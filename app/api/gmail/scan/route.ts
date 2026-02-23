import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchGmailMessages,
  fetchGmailMessage,
  detectSubscriptionFromEmail,
  refreshAccessToken,
} from '@/lib/gmail'
import { addDays, format } from 'date-fns'

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
    const messages = await fetchGmailMessages(accessToken, 100)
    let subscriptionsFound = 0
    const processedThreadIds = new Set<string>()

    // Get existing email thread IDs to avoid duplicates
    const { data: existingThreads } = await supabase
      .from('subscriptions')
      .select('email_thread_id')
      .eq('user_id', user.id)
      .not('email_thread_id', 'is', null)

    const existingThreadIdSet = new Set(existingThreads?.map((s) => s.email_thread_id) || [])

    for (const msg of messages.slice(0, 50)) {
      if (processedThreadIds.has(msg.threadId) || existingThreadIdSet.has(msg.threadId)) {
        continue
      }

      try {
        const email = await fetchGmailMessage(accessToken, msg.id)
        processedThreadIds.add(msg.threadId)

        const detected = detectSubscriptionFromEmail(
          email.subject,
          email.from,
          email.body,
          email.threadId
        )

        if (detected) {
          const nextBillingDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

          await supabase.from('subscriptions').insert({
            user_id: user.id,
            name: detected.name,
            amount: detected.amount,
            currency: detected.currency,
            billing_cycle: detected.billing_cycle,
            next_billing_date: nextBillingDate,
            status: 'active',
            auto_detected: true,
            source: 'gmail',
            email_thread_id: detected.email_thread_id,
            email_sender: detected.email_sender,
            logo_url: detected.logo_url,
            website_url: detected.website_url,
          })

          // Create notification
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'payment_detected',
            title: `${detected.name} detected`,
            message: `We found a ${detected.name} subscription for ${detected.currency === 'USD' ? '$' : detected.currency}${detected.amount}/${detected.billing_cycle} in your Gmail.`,
          })

          subscriptionsFound++
          existingThreadIdSet.add(detected.email_thread_id)
        }
      } catch {
        // Skip failed messages
      }
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
