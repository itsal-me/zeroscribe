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
  // Streaming & Entertainment
  { sender: 'netflix.com', name: 'Netflix', logoUrl: 'https://logo.clearbit.com/netflix.com' },
  { sender: 'spotify.com', name: 'Spotify', logoUrl: 'https://logo.clearbit.com/spotify.com' },
  { sender: 'apple.com', name: 'Apple', logoUrl: 'https://logo.clearbit.com/apple.com' },
  { sender: 'hulu.com', name: 'Hulu', logoUrl: 'https://logo.clearbit.com/hulu.com' },
  { sender: 'disneyplus.com', name: 'Disney+', logoUrl: 'https://logo.clearbit.com/disneyplus.com' },
  { sender: 'max.com', name: 'Max (HBO)', logoUrl: 'https://logo.clearbit.com/max.com' },
  { sender: 'hbo.com', name: 'HBO Max', logoUrl: 'https://logo.clearbit.com/hbo.com' },
  { sender: 'paramountplus.com', name: 'Paramount+', logoUrl: 'https://logo.clearbit.com/paramountplus.com' },
  { sender: 'peacocktv.com', name: 'Peacock', logoUrl: 'https://logo.clearbit.com/peacocktv.com' },
  { sender: 'crunchyroll.com', name: 'Crunchyroll', logoUrl: 'https://logo.clearbit.com/crunchyroll.com' },
  { sender: 'youtube.com', name: 'YouTube Premium', logoUrl: 'https://logo.clearbit.com/youtube.com' },
  { sender: 'twitch.tv', name: 'Twitch', logoUrl: 'https://logo.clearbit.com/twitch.tv' },
  { sender: 'audible.com', name: 'Audible', logoUrl: 'https://logo.clearbit.com/audible.com' },
  { sender: 'scribd.com', name: 'Scribd', logoUrl: 'https://logo.clearbit.com/scribd.com' },
  { sender: 'plex.tv', name: 'Plex Pass', logoUrl: 'https://logo.clearbit.com/plex.tv' },
  { sender: 'dazn.com', name: 'DAZN', logoUrl: 'https://logo.clearbit.com/dazn.com' },
  // Music
  { sender: 'tidal.com', name: 'Tidal', logoUrl: 'https://logo.clearbit.com/tidal.com' },
  // Cloud & Productivity
  { sender: 'amazon.com', name: 'Amazon Prime', logoUrl: 'https://logo.clearbit.com/amazon.com' },
  { sender: 'microsoft.com', name: 'Microsoft 365', logoUrl: 'https://logo.clearbit.com/microsoft.com' },
  { sender: 'google.com', name: 'Google One', logoUrl: 'https://logo.clearbit.com/google.com' },
  { sender: 'dropbox.com', name: 'Dropbox', logoUrl: 'https://logo.clearbit.com/dropbox.com' },
  { sender: 'notion.so', name: 'Notion', logoUrl: 'https://logo.clearbit.com/notion.so' },
  { sender: 'evernote.com', name: 'Evernote', logoUrl: 'https://logo.clearbit.com/evernote.com' },
  { sender: 'airtable.com', name: 'Airtable', logoUrl: 'https://logo.clearbit.com/airtable.com' },
  { sender: 'monday.com', name: 'Monday.com', logoUrl: 'https://logo.clearbit.com/monday.com' },
  { sender: 'asana.com', name: 'Asana', logoUrl: 'https://logo.clearbit.com/asana.com' },
  { sender: 'trello.com', name: 'Trello', logoUrl: 'https://logo.clearbit.com/trello.com' },
  { sender: 'atlassian.com', name: 'Atlassian', logoUrl: 'https://logo.clearbit.com/atlassian.com' },
  { sender: 'linear.app', name: 'Linear', logoUrl: 'https://logo.clearbit.com/linear.app' },
  // Design & Dev
  { sender: 'figma.com', name: 'Figma', logoUrl: 'https://logo.clearbit.com/figma.com' },
  { sender: 'adobe.com', name: 'Adobe', logoUrl: 'https://logo.clearbit.com/adobe.com' },
  { sender: 'canva.com', name: 'Canva', logoUrl: 'https://logo.clearbit.com/canva.com' },
  { sender: 'sketch.com', name: 'Sketch', logoUrl: 'https://logo.clearbit.com/sketch.com' },
  { sender: 'webflow.com', name: 'Webflow', logoUrl: 'https://logo.clearbit.com/webflow.com' },
  { sender: 'github.com', name: 'GitHub', logoUrl: 'https://logo.clearbit.com/github.com' },
  { sender: 'gitlab.com', name: 'GitLab', logoUrl: 'https://logo.clearbit.com/gitlab.com' },
  { sender: 'jetbrains.com', name: 'JetBrains', logoUrl: 'https://logo.clearbit.com/jetbrains.com' },
  { sender: 'vercel.com', name: 'Vercel', logoUrl: 'https://logo.clearbit.com/vercel.com' },
  { sender: 'digitalocean.com', name: 'DigitalOcean', logoUrl: 'https://logo.clearbit.com/digitalocean.com' },
  { sender: 'cloudflare.com', name: 'Cloudflare', logoUrl: 'https://logo.clearbit.com/cloudflare.com' },
  { sender: 'heroku.com', name: 'Heroku', logoUrl: 'https://logo.clearbit.com/heroku.com' },
  { sender: 'postman.com', name: 'Postman', logoUrl: 'https://logo.clearbit.com/postman.com' },
  { sender: 'sentry.io', name: 'Sentry', logoUrl: 'https://logo.clearbit.com/sentry.io' },
  { sender: 'datadoghq.com', name: 'Datadog', logoUrl: 'https://logo.clearbit.com/datadoghq.com' },
  // Communication & Collaboration
  { sender: 'slack.com', name: 'Slack', logoUrl: 'https://logo.clearbit.com/slack.com' },
  { sender: 'zoom.us', name: 'Zoom', logoUrl: 'https://logo.clearbit.com/zoom.us' },
  { sender: 'loom.com', name: 'Loom', logoUrl: 'https://logo.clearbit.com/loom.com' },
  { sender: 'intercom.com', name: 'Intercom', logoUrl: 'https://logo.clearbit.com/intercom.com' },
  { sender: 'zendesk.com', name: 'Zendesk', logoUrl: 'https://logo.clearbit.com/zendesk.com' },
  { sender: 'discord.com', name: 'Discord Nitro', logoUrl: 'https://logo.clearbit.com/discord.com' },
  // AI Tools
  { sender: 'openai.com', name: 'ChatGPT Plus', logoUrl: 'https://logo.clearbit.com/openai.com' },
  { sender: 'anthropic.com', name: 'Claude Pro', logoUrl: 'https://logo.clearbit.com/anthropic.com' },
  { sender: 'midjourney.com', name: 'Midjourney', logoUrl: 'https://logo.clearbit.com/midjourney.com' },
  { sender: 'grammarly.com', name: 'Grammarly', logoUrl: 'https://logo.clearbit.com/grammarly.com' },
  // Marketing & CRM
  { sender: 'mailchimp.com', name: 'Mailchimp', logoUrl: 'https://logo.clearbit.com/mailchimp.com' },
  { sender: 'hubspot.com', name: 'HubSpot', logoUrl: 'https://logo.clearbit.com/hubspot.com' },
  { sender: 'salesforce.com', name: 'Salesforce', logoUrl: 'https://logo.clearbit.com/salesforce.com' },
  { sender: 'typeform.com', name: 'Typeform', logoUrl: 'https://logo.clearbit.com/typeform.com' },
  { sender: 'mixpanel.com', name: 'Mixpanel', logoUrl: 'https://logo.clearbit.com/mixpanel.com' },
  // Website & Domain
  { sender: 'shopify.com', name: 'Shopify', logoUrl: 'https://logo.clearbit.com/shopify.com' },
  { sender: 'squarespace.com', name: 'Squarespace', logoUrl: 'https://logo.clearbit.com/squarespace.com' },
  { sender: 'wix.com', name: 'Wix', logoUrl: 'https://logo.clearbit.com/wix.com' },
  { sender: 'godaddy.com', name: 'GoDaddy', logoUrl: 'https://logo.clearbit.com/godaddy.com' },
  { sender: 'namecheap.com', name: 'Namecheap', logoUrl: 'https://logo.clearbit.com/namecheap.com' },
  // Security & Privacy
  { sender: 'lastpass.com', name: 'LastPass', logoUrl: 'https://logo.clearbit.com/lastpass.com' },
  { sender: '1password.com', name: '1Password', logoUrl: 'https://logo.clearbit.com/1password.com' },
  { sender: 'dashlane.com', name: 'Dashlane', logoUrl: 'https://logo.clearbit.com/dashlane.com' },
  { sender: 'bitwarden.com', name: 'Bitwarden', logoUrl: 'https://logo.clearbit.com/bitwarden.com' },
  { sender: 'nordvpn.com', name: 'NordVPN', logoUrl: 'https://logo.clearbit.com/nordvpn.com' },
  { sender: 'expressvpn.com', name: 'ExpressVPN', logoUrl: 'https://logo.clearbit.com/expressvpn.com' },
  // Learning
  { sender: 'duolingo.com', name: 'Duolingo Plus', logoUrl: 'https://logo.clearbit.com/duolingo.com' },
  { sender: 'coursera.org', name: 'Coursera', logoUrl: 'https://logo.clearbit.com/coursera.org' },
  { sender: 'udemy.com', name: 'Udemy', logoUrl: 'https://logo.clearbit.com/udemy.com' },
  { sender: 'skillshare.com', name: 'Skillshare', logoUrl: 'https://logo.clearbit.com/skillshare.com' },
  { sender: 'masterclass.com', name: 'MasterClass', logoUrl: 'https://logo.clearbit.com/masterclass.com' },
  { sender: 'linkedin.com', name: 'LinkedIn Premium', logoUrl: 'https://logo.clearbit.com/linkedin.com' },
  // Health & Wellness
  { sender: 'headspace.com', name: 'Headspace', logoUrl: 'https://logo.clearbit.com/headspace.com' },
  { sender: 'calm.com', name: 'Calm', logoUrl: 'https://logo.clearbit.com/calm.com' },
  { sender: 'strava.com', name: 'Strava', logoUrl: 'https://logo.clearbit.com/strava.com' },
  { sender: 'onepeloton.com', name: 'Peloton', logoUrl: 'https://logo.clearbit.com/onepeloton.com' },
  // Gaming
  { sender: 'xbox.com', name: 'Xbox Game Pass', logoUrl: 'https://logo.clearbit.com/xbox.com' },
  { sender: 'playstation.com', name: 'PlayStation Plus', logoUrl: 'https://logo.clearbit.com/playstation.com' },
  { sender: 'nintendo.com', name: 'Nintendo Switch Online', logoUrl: 'https://logo.clearbit.com/nintendo.com' },
  { sender: 'steampowered.com', name: 'Steam', logoUrl: 'https://logo.clearbit.com/steampowered.com' },
  { sender: 'epicgames.com', name: 'Epic Games', logoUrl: 'https://logo.clearbit.com/epicgames.com' },
  { sender: 'ea.com', name: 'EA Play', logoUrl: 'https://logo.clearbit.com/ea.com' },
  // Creator & Content
  { sender: 'patreon.com', name: 'Patreon', logoUrl: 'https://logo.clearbit.com/patreon.com' },
  { sender: 'substack.com', name: 'Substack', logoUrl: 'https://logo.clearbit.com/substack.com' },
  { sender: 'medium.com', name: 'Medium', logoUrl: 'https://logo.clearbit.com/medium.com' },
  // Food & Delivery
  { sender: 'doordash.com', name: 'DashPass', logoUrl: 'https://logo.clearbit.com/doordash.com' },
  { sender: 'ubereats.com', name: 'Uber One', logoUrl: 'https://logo.clearbit.com/ubereats.com' },
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
    // Core billing words
    'receipt',
    'invoice',
    'billing',
    'payment',
    'subscription',
    'renewed',
    'renewal',
    'charged',
    'charge',
    'paid',
    'billed',
    'bill',
    'fee',
    'debit',
    // Order & purchase
    'your order',
    'order confirmation',
    'order receipt',
    'purchase confirmation',
    'thank you for your purchase',
    'thank you for your order',
    'thanks for your purchase',
    'your receipt',
    'purchase receipt',
    'order total',
    'subtotal',
    // Payment confirmations
    'payment confirmation',
    'payment received',
    'payment successful',
    'payment processed',
    'payment failed',
    'payment declined',
    'payment due',
    'payment method',
    'amount due',
    'amount paid',
    'total paid',
    'total charged',
    'next payment',
    'next billing',
    'next charge',
    'due date',
    'overdue',
    'past due',
    'thank you for your payment',
    'thanks for your payment',
    'we received your payment',
    // Subscription lifecycle
    'your subscription',
    'subscription confirmed',
    'subscription activated',
    'subscription renewed',
    'subscription renewal',
    'subscription update',
    'subscription receipt',
    'subscription fee',
    'monthly subscription',
    'annual subscription',
    'has been charged',
    'successfully charged',
    'successfully renewed',
    'auto-renew',
    'auto-renewal',
    'auto renew',
    'autorenewal',
    'will be charged',
    'will be renewed',
    'will renew',
    'recurring payment',
    'recurring charge',
    'recurring billing',
    'monthly charge',
    'annual charge',
    'yearly charge',
    // Plan & membership
    'your plan',
    'plan renewed',
    'plan renewal',
    'plan activated',
    'plan confirmation',
    'service fee',
    'license fee',
    'license renewed',
    'license renewal',
    'membership',
    'membership renewed',
    'membership confirmation',
    // Trial
    'trial ending',
    'trial expires',
    'trial period',
    'free trial',
    'trial ended',
    // Transaction & financial
    'statement',
    'transaction',
    'direct debit',
    'standing order',
    'thank you for subscribing',
    'thanks for subscribing',
    'cancellation confirmed',
    'subscription cancelled',
  ]

  const isBillingEmail = billingKeywords.some(
    (kw) => lowerSubject.includes(kw) || lowerBody.includes(kw)
  )
  if (!isBillingEmail) return null

  // Find matching service
  const pattern = SUBSCRIPTION_PATTERNS.find((p) => lowerFrom.includes(p.sender))
  if (!pattern) return null

  // Extract amount using regex patterns
  const amountPatterns: [RegExp, string][] = [
    [/\$\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/,  'USD'],
    [/USD\s*(\d+(?:\.\d{2})?)/,                  'USD'],
    [/(\d+(?:\.\d{2})?)\s*USD/,                  'USD'],
    [/€\s*(\d{1,4}(?:[.,]\d{2,3})*(?:[.,]\d{2})?)/,  'EUR'],
    [/EUR\s*(\d+(?:\.\d{2})?)/,                  'EUR'],
    [/(\d+(?:\.\d{2})?)\s*EUR/,                  'EUR'],
    [/£\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/,    'GBP'],
    [/GBP\s*(\d+(?:\.\d{2})?)/,                  'GBP'],
    [/(\d+(?:\.\d{2})?)\s*GBP/,                  'GBP'],
    [/₹\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/,  'INR'],
    [/INR\s*(\d+(?:\.\d{2})?)/,                  'INR'],
    [/(\d+(?:\.\d{2})?)\s*INR/,                  'INR'],
    [/CA\$\s*(\d+(?:\.\d{2})?)/,                 'CAD'],
    [/CAD\s*(\d+(?:\.\d{2})?)/,                  'CAD'],
    [/(\d+(?:\.\d{2})?)\s*CAD/,                  'CAD'],
    [/A\$\s*(\d+(?:\.\d{2})?)/,                  'AUD'],
    [/AUD\s*(\d+(?:\.\d{2})?)/,                  'AUD'],
    [/(\d+(?:\.\d{2})?)\s*AUD/,                  'AUD'],
    [/¥\s*(\d+)/,                                 'JPY'],
    [/JPY\s*(\d+)/,                               'JPY'],
  ]

  let amount = 0
  let currency = 'USD'

  const searchText = subject + ' ' + body
  for (const [pat, cur] of amountPatterns) {
    const match = searchText.match(pat)
    if (match) {
      const raw = match[1].replace(/,/g, '')
      const parsed = parseFloat(raw)
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed
        currency = cur
        break
      }
    }
}

  if (amount === 0) return null

  // Detect billing cycle
  const cycleText = lowerSubject + ' ' + lowerBody
  let billing_cycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly' = 'monthly'
  if (cycleText.includes('annual') || cycleText.includes('yearly') || cycleText.includes('year plan') || cycleText.includes('/year') || cycleText.includes('per year')) {
    billing_cycle = 'yearly'
  } else if (cycleText.includes('quarterly') || cycleText.includes('every 3 months') || cycleText.includes('3-month')) {
    billing_cycle = 'quarterly'
  } else if (cycleText.includes('weekly') || cycleText.includes('per week') || cycleText.includes('/week')) {
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
  maxResults = 200
): Promise<{ id: string; threadId: string }[]> {
  const query = encodeURIComponent(
    '(receipt OR invoice OR billing OR billed OR bill OR subscription OR renewal OR payment OR paid OR charge OR charged OR fee OR debit OR statement OR membership OR overdue OR recurring OR "auto-renew" OR "auto-renewal" OR "order confirmation" OR "payment confirmation" OR "payment received" OR "payment successful" OR "payment processed" OR "amount due" OR "payment due" OR "next payment" OR "will be charged" OR "will renew" OR "successfully charged" OR "has been charged" OR "your subscription" OR "your plan" OR "plan renewed" OR "trial ending" OR "free trial" OR "thank you for subscribing" OR "recurring payment" OR "recurring charge" OR "subscription fee" OR "service fee" OR "license fee" OR "direct debit" OR "thank you for your payment") newer_than:365d'
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
