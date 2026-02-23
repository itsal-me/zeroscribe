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

  let billing_cycle = 'monthly'
  if (lower.includes('annual') || lower.includes('yearly')) billing_cycle = 'yearly'
  else if (lower.includes('quarterly')) billing_cycle = 'quarterly'

  return {
    name: pattern.name,
    amount,
    currency: 'USD',
    billing_cycle,
    logo_url: pattern.logoUrl,
    email_sender: from,
    email_thread_id: threadId,
    website_url: `https://${pattern.sender}`,
  }
}

async function scanUserGmail(userId: string, accessToken: string) {
  const query = encodeURIComponent(
    'subject:(receipt OR invoice OR billing OR subscription OR renewal) newer_than:90d'
  )
  const msgResp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const msgData = await msgResp.json()
  const messages: { id: string; threadId: string }[] = msgData.messages || []

  // Get existing thread IDs
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('email_thread_id')
    .eq('user_id', userId)
    .not('email_thread_id', 'is', null)

  const existingIds = new Set(existing?.map((s: { email_thread_id: string }) => s.email_thread_id) || [])
  const processedThreads = new Set<string>()
  let found = 0

  for (const msg of messages) {
    if (processedThreads.has(msg.threadId) || existingIds.has(msg.threadId)) continue

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

      processedThreads.add(msg.threadId)
      const detected = detectSubscription(subject, from, body.slice(0, 2000), msg.threadId)

      if (detected) {
        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + 30)

        await supabase.from('subscriptions').insert({
          user_id: userId,
          ...detected,
          next_billing_date: nextDate.toISOString().split('T')[0],
          status: 'active',
          auto_detected: true,
          source: 'gmail',
        })

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'payment_detected',
          title: `${detected.name} detected`,
          message: `Found a ${detected.name} subscription for $${detected.amount}/${detected.billing_cycle} in your Gmail.`,
        })

        existingIds.add(detected.email_thread_id)
        found++
      }
    } catch (_) {
      // Skip failed messages
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
