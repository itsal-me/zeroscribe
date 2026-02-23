/**
 * Gmail API integration utilities
 * Handles OAuth flow and email scanning for subscription detection
 */

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export function getGmailAuthUrl(userId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string
  refresh_token: string
  expiry_date: number
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error_description || data.error)
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error_description || data.error)
  return data.access_token
}

// Known subscription senders and their service names
const SUBSCRIPTION_PATTERNS: { sender: string; name: string; logoUrl: string }[] = [
  { sender: 'netflix.com', name: 'Netflix', logoUrl: 'https://logo.clearbit.com/netflix.com' },
  { sender: 'spotify.com', name: 'Spotify', logoUrl: 'https://logo.clearbit.com/spotify.com' },
  { sender: 'apple.com', name: 'Apple', logoUrl: 'https://logo.clearbit.com/apple.com' },
  { sender: 'amazon.com', name: 'Amazon Prime', logoUrl: 'https://logo.clearbit.com/amazon.com' },
  { sender: 'hulu.com', name: 'Hulu', logoUrl: 'https://logo.clearbit.com/hulu.com' },
  { sender: 'disneyplus.com', name: 'Disney+', logoUrl: 'https://logo.clearbit.com/disneyplus.com' },
  { sender: 'adobe.com', name: 'Adobe', logoUrl: 'https://logo.clearbit.com/adobe.com' },
  { sender: 'notion.so', name: 'Notion', logoUrl: 'https://logo.clearbit.com/notion.so' },
  { sender: 'figma.com', name: 'Figma', logoUrl: 'https://logo.clearbit.com/figma.com' },
  { sender: 'dropbox.com', name: 'Dropbox', logoUrl: 'https://logo.clearbit.com/dropbox.com' },
  { sender: 'slack.com', name: 'Slack', logoUrl: 'https://logo.clearbit.com/slack.com' },
  { sender: 'github.com', name: 'GitHub', logoUrl: 'https://logo.clearbit.com/github.com' },
  { sender: 'zoom.us', name: 'Zoom', logoUrl: 'https://logo.clearbit.com/zoom.us' },
  { sender: 'microsoft.com', name: 'Microsoft 365', logoUrl: 'https://logo.clearbit.com/microsoft.com' },
  { sender: 'google.com', name: 'Google One', logoUrl: 'https://logo.clearbit.com/google.com' },
  { sender: 'openai.com', name: 'ChatGPT Plus', logoUrl: 'https://logo.clearbit.com/openai.com' },
  { sender: 'anthropic.com', name: 'Claude Pro', logoUrl: 'https://logo.clearbit.com/anthropic.com' },
  { sender: 'canva.com', name: 'Canva', logoUrl: 'https://logo.clearbit.com/canva.com' },
  { sender: 'grammarly.com', name: 'Grammarly', logoUrl: 'https://logo.clearbit.com/grammarly.com' },
  { sender: 'lastpass.com', name: 'LastPass', logoUrl: 'https://logo.clearbit.com/lastpass.com' },
  { sender: '1password.com', name: '1Password', logoUrl: 'https://logo.clearbit.com/1password.com' },
  { sender: 'twitch.tv', name: 'Twitch', logoUrl: 'https://logo.clearbit.com/twitch.tv' },
  { sender: 'youtube.com', name: 'YouTube Premium', logoUrl: 'https://logo.clearbit.com/youtube.com' },
  { sender: 'audible.com', name: 'Audible', logoUrl: 'https://logo.clearbit.com/audible.com' },
  { sender: 'duolingo.com', name: 'Duolingo Plus', logoUrl: 'https://logo.clearbit.com/duolingo.com' },
]

export interface DetectedSubscription {
  name: string
  amount: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly'
  logo_url: string
  email_sender: string
  email_thread_id: string
  website_url: string
}

export function detectSubscriptionFromEmail(
  subject: string,
  from: string,
  body: string,
  threadId: string
): DetectedSubscription | null {
  const lowerSubject = subject.toLowerCase()
  const lowerBody = body.toLowerCase()
  const lowerFrom = from.toLowerCase()

  // Check if this is a billing/receipt email
  const billingKeywords = [
    'receipt',
    'invoice',
    'billing',
    'payment',
    'subscription',
    'renewed',
    'renewal',
    'charged',
    'your order',
    'thank you for your purchase',
    'payment confirmation',
  ]

  const isBillingEmail = billingKeywords.some(
    (kw) => lowerSubject.includes(kw) || lowerBody.includes(kw)
  )
  if (!isBillingEmail) return null

  // Find matching service
  const pattern = SUBSCRIPTION_PATTERNS.find((p) => lowerFrom.includes(p.sender))
  if (!pattern) return null

  // Extract amount using regex patterns
  const amountPatterns = [
    /\$(\d+(?:\.\d{2})?)/,
    /USD\s*(\d+(?:\.\d{2})?)/,
    /(\d+(?:\.\d{2})?)\s*USD/,
    /€(\d+(?:\.\d{2})?)/,
    /£(\d+(?:\.\d{2})?)/,
  ]

  let amount = 0
  let currency = 'USD'

  for (const pat of amountPatterns) {
    const match = (subject + ' ' + body).match(pat)
    if (match) {
      amount = parseFloat(match[1])
      if (pat.source.includes('€')) currency = 'EUR'
      if (pat.source.includes('£')) currency = 'GBP'
      break
    }
  }

  if (amount === 0) return null

  // Detect billing cycle
  let billing_cycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly' = 'monthly'
  if (lowerBody.includes('annual') || lowerBody.includes('yearly') || lowerBody.includes('year')) {
    billing_cycle = 'yearly'
  } else if (lowerBody.includes('quarterly')) {
    billing_cycle = 'quarterly'
  } else if (lowerBody.includes('weekly')) {
    billing_cycle = 'weekly'
  }

  return {
    name: pattern.name,
    amount,
    currency,
    billing_cycle,
    logo_url: pattern.logoUrl,
    email_sender: from,
    email_thread_id: threadId,
    website_url: `https://${pattern.sender}`,
  }
}

export async function fetchGmailMessages(
  accessToken: string,
  maxResults = 100
): Promise<{ id: string; threadId: string }[]> {
  const query = encodeURIComponent(
    'subject:(receipt OR invoice OR billing OR subscription OR renewal OR payment) newer_than:90d'
  )
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await response.json()
  return data.messages || []
}

export async function fetchGmailMessage(
  accessToken: string,
  messageId: string
): Promise<{ subject: string; from: string; body: string; threadId: string }> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await response.json()

  const headers = data.payload?.headers || []
  const subject = headers.find((h: { name: string }) => h.name === 'Subject')?.value || ''
  const from = headers.find((h: { name: string }) => h.name === 'From')?.value || ''

  let body = ''
  if (data.payload?.body?.data) {
    body = Buffer.from(data.payload.body.data, 'base64').toString('utf-8')
  } else if (data.payload?.parts) {
    for (const part of data.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
    }
  }

  return { subject, from, body: body.slice(0, 2000), threadId: data.threadId }
}
