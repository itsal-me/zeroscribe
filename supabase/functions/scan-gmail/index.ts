// Supabase Edge Function: scan-gmail
// Deployed to: supabase/functions/scan-gmail/index.ts
// Triggered by: cron job every 6 hours OR manually via API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const SUBSCRIPTION_PATTERNS = [
  { sender: 'netflix.com', name: 'Netflix', logoUrl: 'https://logo.clearbit.com/netflix.com' },
  { sender: 'spotify.com', name: 'Spotify', logoUrl: 'https://logo.clearbit.com/spotify.com' },
  { sender: 'apple.com', name: 'Apple', logoUrl: 'https://logo.clearbit.com/apple.com' },
  { sender: 'hulu.com', name: 'Hulu', logoUrl: 'https://logo.clearbit.com/hulu.com' },
  { sender: 'adobe.com', name: 'Adobe CC', logoUrl: 'https://logo.clearbit.com/adobe.com' },
  { sender: 'notion.so', name: 'Notion', logoUrl: 'https://logo.clearbit.com/notion.so' },
  { sender: 'figma.com', name: 'Figma', logoUrl: 'https://logo.clearbit.com/figma.com' },
  { sender: 'github.com', name: 'GitHub', logoUrl: 'https://logo.clearbit.com/github.com' },
  { sender: 'openai.com', name: 'ChatGPT Plus', logoUrl: 'https://logo.clearbit.com/openai.com' },
  { sender: 'anthropic.com', name: 'Claude Pro', logoUrl: 'https://logo.clearbit.com/anthropic.com' },
  { sender: 'microsoft.com', name: 'Microsoft 365', logoUrl: 'https://logo.clearbit.com/microsoft.com' },
  { sender: 'google.com', name: 'Google One', logoUrl: 'https://logo.clearbit.com/google.com' },
]

const ONE_TIME_KEYWORDS = [
  'one-time purchase',
  'one time purchase',
  'one-time payment',
  'one time payment',
  'single payment',
  'single charge',
  'lifetime license',
  'lifetime access',
  'not a subscription',
  'non-recurring',
  'nonrecurring',
]

const RECURRING_SIGNALS = [
  'auto-renew',
  'auto renew',
  'will renew',
  'will be charged',
  'will be billed',
  'recurring payment',
  'recurring billing',
  'next billing date',
  'next payment date',
  'next renewal',
  'billed every',
  'charged every',
  'subscription renewed',
]

const TRIAL_SIGNALS = [
  'trial ending',
  'trial ends',
  'trial expired',
  'your free trial',
  'trial has ended',
]

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
}

const MAX_SCAN_MESSAGES = 80
const MESSAGE_FETCH_CONCURRENCY = 8

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDateToken(raw: string): string | null {
  const s = raw.trim().replace(/,/g, '').replace(/\s+/g, ' ')

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00`)
    return isNaN(d.getTime()) ? null : toISODate(d)
  }

  const m1 = s.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/)
  if (m1) {
    const mon = MONTH_MAP[m1[1].toLowerCase()]
    if (mon !== undefined) return toISODate(new Date(+m1[3], mon, +m1[2]))
  }

  const m2 = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (m2) {
    const mon = MONTH_MAP[m2[2].toLowerCase()]
    if (mon !== undefined) return toISODate(new Date(+m2[3], mon, +m2[1]))
  }

  const m3 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m3) {
    const d = new Date(+m3[3], +m3[1] - 1, +m3[2])
    return isNaN(d.getTime()) ? null : toISODate(d)
  }

  return null
}

function addBillingCycle(date: string, billingCycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly'): string | null {
  const base = new Date(`${date}T00:00:00`)
  if (isNaN(base.getTime())) return null

  const next = new Date(base)
  if (billingCycle === 'weekly') next.setDate(next.getDate() + 7)
  if (billingCycle === 'monthly') next.setMonth(next.getMonth() + 1)
  if (billingCycle === 'quarterly') next.setMonth(next.getMonth() + 3)
  if (billingCycle === 'yearly') next.setFullYear(next.getFullYear() + 1)
  return toISODate(next)
}

function extractNextBillingDate(text: string): string | null {
  const dateChunk = '([A-Za-z]+ \\d{1,2},?\\s*\\d{4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4})'
  const patterns = [
    new RegExp(`next\\s+billing\\s+(?:date|on)\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`next\\s+payment\\s+(?:date|on|due)?\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`renew(?:al|s)?\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`will\\s+be\\s+(?:charged|billed)\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return parseDateToken(match[1])
  }

  return null
}

function extractBillingAnchorDate(text: string): string | null {
  const dateChunk = '([A-Za-z]+ \\d{1,2},?\\s*\\d{4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4})'
  const patterns = [
    new RegExp(`(?:charged|billed|paid)\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`payment\\s+(?:date|received)\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`invoice\\s+date\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return parseDateToken(match[1])
  }

  return null
}

async function refreshToken(refreshToken: string): Promise<string> {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })
  const data = await resp.json()
  if (data.error) throw new Error(data.error)
  return data.access_token
}

function detectSubscription(subject: string, from: string, body: string, threadId: string) {
  const lower = (subject + ' ' + body + ' ' + from).toLowerCase()
  const billingKws = ['receipt', 'invoice', 'billing', 'payment', 'subscription', 'renewed', 'renewal']
  if (!billingKws.some((kw) => lower.includes(kw))) return null

  const pattern = SUBSCRIPTION_PATTERNS.find((p) => from.toLowerCase().includes(p.sender))
  if (!pattern) return null

  const amountMatch = (subject + ' ' + body).match(/\$(\d+(?:\.\d{2})?)/)
  if (!amountMatch) return null
  const amount = parseFloat(amountMatch[1])
  if (amount <= 0) return null

  let billing_cycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly' = 'monthly'
  let billingCycleDetected = false
  if (lower.includes('annual') || lower.includes('yearly')) billing_cycle = 'yearly'
  else if (lower.includes('quarterly')) billing_cycle = 'quarterly'
  else if (lower.includes('weekly')) billing_cycle = 'weekly'

  if (
    lower.includes('annual') ||
    lower.includes('yearly') ||
    lower.includes('quarterly') ||
    lower.includes('weekly') ||
    lower.includes('monthly') ||
    lower.includes('per month') ||
    lower.includes('per year') ||
    lower.includes('/month') ||
    lower.includes('/year')
  ) {
    billingCycleDetected = true
  }

  const isOneTime = ONE_TIME_KEYWORDS.some((kw) => lower.includes(kw))
  const isRecurring = RECURRING_SIGNALS.some((kw) => lower.includes(kw))
  const hasTrialSignal = TRIAL_SIGNALS.some((kw) => lower.includes(kw))
  const explicitNextBillingDate = extractNextBillingDate(subject + ' ' + body)
  const billingAnchorDate = extractBillingAnchorDate(subject + ' ' + body)
  const nextBillingDate = explicitNextBillingDate ||
    (billingAnchorDate && (isRecurring || billingCycleDetected || hasTrialSignal)
      ? addBillingCycle(billingAnchorDate, billing_cycle)
      : null)

  if (isOneTime && !isRecurring) return null
  if (!nextBillingDate) return null

  const reasons = ['SENDER_MATCH', 'AMOUNT_DETECTED']
  if (billingCycleDetected) reasons.push('BILLING_CYCLE_EXPLICIT')
  if (isRecurring) reasons.push('RECURRING_SIGNAL')
  if (hasTrialSignal) reasons.push('TRIAL_SIGNAL')
  if (explicitNextBillingDate) reasons.push('NEXT_BILLING_DATE_EXTRACTED')
  if (!explicitNextBillingDate && nextBillingDate && billingAnchorDate) reasons.push('NEXT_BILLING_DATE_ESTIMATED')

  const reviewRequired = !isRecurring || !billingCycleDetected || !explicitNextBillingDate || hasTrialSignal

  return {
    name: pattern.name,
    amount,
    currency: 'USD',
    billing_cycle,
    next_billing_date: nextBillingDate,
    status: reviewRequired ? 'pending_review' : 'active',
    detection_reason: reasons.join(' | '),
    logo_url: pattern.logoUrl,
    email_sender: from,
    email_thread_id: threadId,
    website_url: `https://${pattern.sender}`,
  }
}

async function scanUserGmail(userId: string, accessToken: string) {
  const queries = [
    'category:purchases (subscription OR renewal OR renewed OR recurring OR membership OR "auto-renew" OR "auto renew" OR "next billing" OR "next payment" OR "will renew" OR "will be charged" OR "billed every" OR "charged every" OR "plan renewed" OR "subscription fee" OR "membership fee" OR "trial ending" OR "free trial") newer_than:400d -in:spam -in:trash',
    '(subscription OR renewal OR renewed OR recurring OR membership OR "auto-renew" OR "auto renew" OR "next billing" OR "next payment" OR "will renew" OR "will be charged" OR "billed every" OR "charged every" OR "plan renewed" OR "subscription fee" OR "membership fee" OR "trial ending" OR "free trial") newer_than:400d -in:spam -in:trash',
  ]

  let messages: { id: string; threadId: string }[] = []

  for (const rawQuery of queries) {
    const query = encodeURIComponent(rawQuery)
    const msgResp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${MAX_SCAN_MESSAGES}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const msgData = await msgResp.json()
    if (Array.isArray(msgData.messages) && msgData.messages.length > 0) {
      messages = msgData.messages
      break
    }
  }

  // Get existing thread IDs
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('email_thread_id')
    .eq('user_id', userId)
    .not('email_thread_id', 'is', null)

  const existingIds = new Set(existing?.map((s: { email_thread_id: string }) => s.email_thread_id) || [])
  const processedThreads = new Set<string>()
  let found = 0

  const candidateMessages: typeof messages = []

  for (const msg of messages) {
    if (processedThreads.has(msg.threadId) || existingIds.has(msg.threadId)) continue
    processedThreads.add(msg.threadId)
    candidateMessages.push(msg)
  }

  for (let index = 0; index < candidateMessages.length; index += MESSAGE_FETCH_CONCURRENCY) {
    const batch = candidateMessages.slice(index, index + MESSAGE_FETCH_CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (msg) => {
        try {
          const emailResp = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          const emailData = await emailResp.json()
          const headers = emailData.payload?.headers || []
          const subject = headers.find((h: { name: string; value: string }) => h.name === 'Subject')?.value || ''
          const from = headers.find((h: { name: string; value: string }) => h.name === 'From')?.value || ''

          let body = ''
          if (emailData.payload?.body?.data) {
            body = atob(emailData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
          }

          return detectSubscription(subject, from, body.slice(0, 2000), msg.threadId)
        } catch (_) {
          return null
        }
      })
    )

    for (const detected of results) {
      if (!detected) continue

      await supabase.from('subscriptions').insert({
        user_id: userId,
        ...detected,
        auto_detected: true,
        source: 'gmail',
        confidence_score: null,
      })

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'payment_detected',
        title: detected.status === 'pending_review' ? `Review: ${detected.name} detected` : `${detected.name} detected`,
        message: detected.status === 'pending_review'
          ? `Found a possible ${detected.name} subscription for $${detected.amount}/${detected.billing_cycle}. Review the billing details before confirming it.`
          : `Found a ${detected.name} subscription for $${detected.amount}/${detected.billing_cycle} in your Gmail.`,
      })

      existingIds.add(detected.email_thread_id)
      found++
    }
  }

  return { scanned: messages.length, found }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const allUsers = body.all_users === true
    const specificUserId = body.user_id as string | undefined

    // Get users with Gmail connected
    const query = supabase
      .from('profiles')
      .select('id, gmail_access_token, gmail_refresh_token, gmail_token_expiry')
      .eq('gmail_connected', true)
      .not('gmail_access_token', 'is', null)

    if (!allUsers && specificUserId) {
      query.eq('id', specificUserId)
    }

    const { data: users, error } = await query
    if (error) throw error

    const results = []

    for (const user of users || []) {
      // Create scan log
      const { data: log } = await supabase
        .from('gmail_scan_logs')
        .insert({ user_id: user.id, status: 'running' })
        .select()
        .single()

      let accessToken = user.gmail_access_token

      // Refresh if expired
      if (user.gmail_token_expiry && new Date(user.gmail_token_expiry) < new Date()) {
        try {
          accessToken = await refreshToken(user.gmail_refresh_token)
          await supabase.from('profiles').update({
            gmail_access_token: accessToken,
            gmail_token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
          }).eq('id', user.id)
        } catch {
          await supabase.from('gmail_scan_logs').update({
            status: 'failed',
            error_message: 'Token refresh failed',
            completed_at: new Date().toISOString(),
          }).eq('id', log?.id)
          continue
        }
      }

      try {
        const { scanned, found } = await scanUserGmail(user.id, accessToken)

        await Promise.all([
          supabase.from('gmail_scan_logs').update({
            status: 'success',
            emails_scanned: scanned,
            subscriptions_found: found,
            completed_at: new Date().toISOString(),
          }).eq('id', log?.id),
          supabase.from('profiles').update({
            gmail_last_scanned: new Date().toISOString(),
          }).eq('id', user.id),
        ])

        results.push({ userId: user.id, scanned, found })
      } catch (err) {
        await supabase.from('gmail_scan_logs').update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        }).eq('id', log?.id)
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
