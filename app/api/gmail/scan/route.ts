import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchGmailMessages,
  fetchGmailMessage,
  detectSubscriptionFromEmail,
  detectStatusFromEmail,
  refreshAccessToken,
} from '@/lib/gmail'
import { addMonths, addYears, addWeeks, format } from 'date-fns'

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
    // Name-level dedup: skip services that already have an active record
    const existingActiveNames = new Set(
      existingSubscriptions
        ?.filter((s) => s.status === 'active')
        .map((s) => (s.name as string).toLowerCase()) || []
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
        emailAnalyses.push({
          detection: detectSubscriptionFromEmail(email.subject, email.from, email.body, email.threadId),
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

      // Skip if an active subscription with the same name already exists in DB
      if (finalStatus === 'active' && existingActiveNames.has(detected.name.toLowerCase())) {
        continue
      }

      // Compute next billing date accurately based on cycle
      const now = new Date()
      let nextBillingDate: string
      if (detected.billing_cycle === 'yearly') {
        nextBillingDate = format(addYears(now, 1), 'yyyy-MM-dd')
      } else if (detected.billing_cycle === 'quarterly') {
        nextBillingDate = format(addMonths(now, 3), 'yyyy-MM-dd')
      } else if (detected.billing_cycle === 'weekly') {
        nextBillingDate = format(addWeeks(now, 1), 'yyyy-MM-dd')
      } else {
        nextBillingDate = format(addMonths(now, 1), 'yyyy-MM-dd')
      }

      await supabase.from('subscriptions').insert({
        user_id: user.id,
        name: detected.name,
        amount: detected.amount,
        currency: detected.currency,
        billing_cycle: detected.billing_cycle,
        next_billing_date: nextBillingDate,
        status: finalStatus,
        auto_detected: true,
        source: 'gmail',
        email_thread_id: detected.email_thread_id,
        email_sender: detected.email_sender,
        logo_url: detected.logo_url,
        website_url: detected.website_url,
      })

      // Only notify for newly detected active subscriptions
      if (finalStatus === 'active') {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'payment_detected',
          title: `${detected.name} detected`,
          message: `We found a ${detected.name} subscription for ${
            detected.currency === 'USD' ? '$' : detected.currency
          }${detected.amount}/${detected.billing_cycle} in your Gmail.`,
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
