import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchGmailMessages,
  fetchGmailMessage,
  detectSubscriptionFromEmail,
  detectStatusFromEmail,
  refreshAccessToken,
  SUBSCRIPTION_PATTERNS,
} from '@/lib/gmail'

// Default colors per auto-detected category name
const CATEGORY_COLORS: Record<string, string> = {
  'Entertainment':    '#E50914',
  'Productivity':     '#4F46E5',
  'Cloud':            '#FF9900',
  'Design':           '#A259FF',
  'Developer Tools':  '#181717',
  'Communication':    '#4A154B',
  'AI Tools':         '#10A37F',
  'Marketing':        '#F59E0B',
  'Business':         '#06B6D4',
  'Security':         '#0094F5',
  'Education':        '#0A66C2',
  'Health & Fitness': '#1CBF73',
  'Gaming':           '#107C10',
  'Utilities':        '#64748B',
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's Gmail tokens
  const { data: profile } = await supabase
    .from('profiles')
    .select('gmail_access_token, gmail_refresh_token, gmail_token_expiry, gmail_connected')
    .eq('id', user.id)
    .single()

  if (!profile?.gmail_connected || !profile?.gmail_access_token) {
    return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })
  }

  // Create scan log
  const { data: scanLog } = await supabase
    .from('gmail_scan_logs')
    .insert({ user_id: user.id, status: 'running' })
    .select()
    .single()

  let accessToken = profile.gmail_access_token

  // Refresh token if expired
  if (profile.gmail_token_expiry && new Date(profile.gmail_token_expiry) < new Date()) {
    try {
      accessToken = await refreshAccessToken(profile.gmail_refresh_token!)
      await supabase
        .from('profiles')
        .update({
          gmail_access_token: accessToken,
          gmail_token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
        })
        .eq('id', user.id)
    } catch {
      await supabase
        .from('gmail_scan_logs')
        .update({ status: 'failed', error_message: 'Token refresh failed', completed_at: new Date().toISOString() })
        .eq('id', scanLog?.id)
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 400 })
    }
  }

  try {
    const messages = await fetchGmailMessages(accessToken, 200)
    const processedThreadIds = new Set<string>()

    // Fetch existing subscriptions for deduplication
    const { data: existingSubscriptions } = await supabase
      .from('subscriptions')
      .select('email_thread_id, name, status')
      .eq('user_id', user.id)

    // Thread-level dedup: skip email threads already stored in DB
    const existingThreadIdSet = new Set(
      existingSubscriptions?.map((s) => s.email_thread_id).filter(Boolean) || []
    )
    // Name-level dedup: skip services that already have an active or pending_review record
    const existingActiveNames = new Set(
      existingSubscriptions
        ?.filter((s) => s.status === 'active' || s.status === 'pending_review')
        .map((s) => (s.name as string).toLowerCase()) || []
    )
    // Historical service names (any status) — used for confidence scoring
    const existingServiceNames = new Set(
      existingSubscriptions?.map((s) => (s.name as string).toLowerCase()) || []
    )

    // Pre-fetch user's existing categories so we can look up / create as needed
    const { data: userCategories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)

    // Build a mutable name→id map; we'll add new categories into this as we create them
    const categoryMap = new Map<string, string>(
      (userCategories || []).map((c) => [c.name.toLowerCase(), c.id])
    )

    // ── Pass 1: fetch & analyse all emails ──────────────────────────────────
    // Gmail returns results newest-first, so we process most recent emails first.
    type EmailAnalysis = {
      detection: ReturnType<typeof detectSubscriptionFromEmail>
      statusChange: ReturnType<typeof detectStatusFromEmail>
    }
    const emailAnalyses: EmailAnalysis[] = []

    for (const msg of messages.slice(0, 150)) {
      if (processedThreadIds.has(msg.threadId) || existingThreadIdSet.has(msg.threadId)) {
        continue
      }
      try {
        const email = await fetchGmailMessage(accessToken, msg.id)
        processedThreadIds.add(msg.threadId)

        // Determine if this service has been seen in historical scans
        const senderPattern = SUBSCRIPTION_PATTERNS.find(
          (p) => email.from.toLowerCase().includes(p.sender)
        )
        const hasPreviousHistory = senderPattern
          ? existingServiceNames.has(senderPattern.name.toLowerCase())
          : false

        emailAnalyses.push({
          detection: detectSubscriptionFromEmail(email.subject, email.from, email.body, email.threadId, hasPreviousHistory),
          statusChange: detectStatusFromEmail(email.subject, email.from, email.body),
        })
      } catch {
        // skip failed messages
      }
    }

    // ── Build per-service status & detection maps ────────────────────────────
    // Because Gmail returns newest-first, the FIRST signal we see per service
    // is the most recent one — that determines the final status.
    const serviceStatus = new Map<string, 'active' | 'cancelled' | 'paused'>()
    const serviceDetections = new Map<
      string,
      NonNullable<ReturnType<typeof detectSubscriptionFromEmail>>
    >()

    for (const { detection, statusChange } of emailAnalyses) {
      // Status-change emails (cancellation / pause) take priority if seen first
      if (statusChange && !serviceStatus.has(statusChange.name)) {
        serviceStatus.set(statusChange.name, statusChange.status)
      }
      // Active billing email — record best (most recent) detection per service
      if (detection) {
        if (!serviceDetections.has(detection.name)) {
          serviceDetections.set(detection.name, detection)
        }
        if (!serviceStatus.has(detection.name)) {
          serviceStatus.set(detection.name, 'active')
        }
      }
    }

    // ── Pass 2: insert deduplicated subscriptions ────────────────────────────
    let subscriptionsFound = 0

    for (const [, detected] of serviceDetections) {
      const finalStatus = serviceStatus.get(detected.name) ?? 'active'

      // Skip detections the model is not confident enough about
      if (detected.confidence_suggestion === 'ignore') continue

      // Skip one-time charges — they are not recurring subscriptions
      if (detected.is_one_time && !detected.is_recurring) continue

      // STRICT: require an actual renewal date extracted from the email body.
      // If the email didn't mention a next billing date, we cannot confirm this is
      // a recurring subscription — treat it as a one-time charge and skip it.
      if (!detected.next_billing_date) continue

      // Skip if an active or pending_review subscription with the same name already exists
      if (existingActiveNames.has(detected.name.toLowerCase())) continue

      // ── Auto-assign category ──────────────────────────────────────────────
      // Look up the category by name (case-insensitive). If not found, create it
      // with a sensible default color so the user sees it categorised immediately.
      let categoryId: string | null = null
      const catKey = detected.category_name.toLowerCase()
      if (categoryMap.has(catKey)) {
        categoryId = categoryMap.get(catKey)!
      } else {
        const color = CATEGORY_COLORS[detected.category_name] ?? '#64748B'
        const { data: newCat } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            name: detected.category_name,
            color,
            icon: null,
            is_default: false,
          })
          .select('id')
          .single()
        if (newCat?.id) {
          categoryMap.set(catKey, newCat.id)
          categoryId = newCat.id
        }
      }

      // ── Determine initial status ──────────────────────────────────────────
      //   cancelled/paused from statusChange emails take priority
      //   auto (>=80%) → active immediately
      //   ask (45-79%) → pending_review (surfaces in UI for user approval)
      const recordStatus =
        finalStatus !== 'active'
          ? finalStatus
          : detected.confidence_suggestion === 'auto'
          ? 'active'
          : 'pending_review'

      await supabase.from('subscriptions').insert({
        user_id: user.id,
        name: detected.name,
        amount: detected.amount,
        currency: detected.currency,
        billing_cycle: detected.billing_cycle,
        next_billing_date: detected.next_billing_date,
        status: recordStatus,
        category_id: categoryId,
        auto_detected: true,
        source: 'gmail',
        email_thread_id: detected.email_thread_id,
        email_sender: detected.email_sender,
        logo_url: detected.logo_url,
        website_url: detected.website_url,
        confidence_score: detected.confidence_score,
        detection_reason: detected.detection_reason,
      })

      if (recordStatus === 'active') {
        // Notify for auto-confirmed subscriptions
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'payment_detected',
          title: `${detected.name} detected`,
          message: `We found a ${detected.name} subscription for ${
            detected.currency === 'USD' ? '$' : detected.currency
          }${detected.amount}/${detected.billing_cycle} in your Gmail.`,
        })
        existingActiveNames.add(detected.name.toLowerCase())
      } else if (recordStatus === 'pending_review') {
        // Notify user to review the detection
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'payment_detected',
          title: `Review: ${detected.name} detected`,
          message: `We found a possible ${detected.name} subscription (${
            detected.currency === 'USD' ? '$' : detected.currency
          }${detected.amount}/${detected.billing_cycle}) with ${detected.confidence_score}% confidence. Please review it.`,
        })
        existingActiveNames.add(detected.name.toLowerCase())
      }

      subscriptionsFound++
    }

    // Update scan log and profile
    await Promise.all([
      supabase
        .from('gmail_scan_logs')
        .update({
          status: 'success',
          emails_scanned: messages.length,
          subscriptions_found: subscriptionsFound,
          completed_at: new Date().toISOString(),
        })
        .eq('id', scanLog?.id),
      supabase
        .from('profiles')
        .update({ gmail_last_scanned: new Date().toISOString() })
        .eq('id', user.id),
    ])

    return NextResponse.json({
      success: true,
      emailsScanned: messages.length,
      subscriptionsFound,
    })
  } catch (err) {
    console.error('Gmail scan error:', err)
    await supabase
      .from('gmail_scan_logs')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanLog?.id)

    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
