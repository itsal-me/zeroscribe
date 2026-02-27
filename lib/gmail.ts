/**
 * Gmail API integration utilities
 * Handles OAuth flow and email scanning for subscription detection
 */

import { computeConfidenceScore } from './confidence'

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

// Known subscription senders — includes service name, logo, and auto-detected category
export const SUBSCRIPTION_PATTERNS: { sender: string; name: string; logoUrl: string; category: string }[] = [
  // Streaming & Entertainment
  { sender: 'netflix.com', name: 'Netflix', logoUrl: 'https://logo.clearbit.com/netflix.com', category: 'Entertainment' },
  { sender: 'spotify.com', name: 'Spotify', logoUrl: 'https://logo.clearbit.com/spotify.com', category: 'Entertainment' },
  { sender: 'apple.com', name: 'Apple', logoUrl: 'https://logo.clearbit.com/apple.com', category: 'Entertainment' },
  { sender: 'hulu.com', name: 'Hulu', logoUrl: 'https://logo.clearbit.com/hulu.com', category: 'Entertainment' },
  { sender: 'disneyplus.com', name: 'Disney+', logoUrl: 'https://logo.clearbit.com/disneyplus.com', category: 'Entertainment' },
  { sender: 'max.com', name: 'Max (HBO)', logoUrl: 'https://logo.clearbit.com/max.com', category: 'Entertainment' },
  { sender: 'hbo.com', name: 'HBO Max', logoUrl: 'https://logo.clearbit.com/hbo.com', category: 'Entertainment' },
  { sender: 'paramountplus.com', name: 'Paramount+', logoUrl: 'https://logo.clearbit.com/paramountplus.com', category: 'Entertainment' },
  { sender: 'peacocktv.com', name: 'Peacock', logoUrl: 'https://logo.clearbit.com/peacocktv.com', category: 'Entertainment' },
  { sender: 'crunchyroll.com', name: 'Crunchyroll', logoUrl: 'https://logo.clearbit.com/crunchyroll.com', category: 'Entertainment' },
  { sender: 'youtube.com', name: 'YouTube Premium', logoUrl: 'https://logo.clearbit.com/youtube.com', category: 'Entertainment' },
  { sender: 'twitch.tv', name: 'Twitch', logoUrl: 'https://logo.clearbit.com/twitch.tv', category: 'Entertainment' },
  { sender: 'audible.com', name: 'Audible', logoUrl: 'https://logo.clearbit.com/audible.com', category: 'Entertainment' },
  { sender: 'scribd.com', name: 'Scribd', logoUrl: 'https://logo.clearbit.com/scribd.com', category: 'Entertainment' },
  { sender: 'plex.tv', name: 'Plex Pass', logoUrl: 'https://logo.clearbit.com/plex.tv', category: 'Entertainment' },
  { sender: 'dazn.com', name: 'DAZN', logoUrl: 'https://logo.clearbit.com/dazn.com', category: 'Entertainment' },
  // Music
  { sender: 'tidal.com', name: 'Tidal', logoUrl: 'https://logo.clearbit.com/tidal.com', category: 'Entertainment' },
  // Cloud & Productivity
  { sender: 'amazon.com', name: 'Amazon Prime', logoUrl: 'https://logo.clearbit.com/amazon.com', category: 'Cloud' },
  { sender: 'microsoft.com', name: 'Microsoft 365', logoUrl: 'https://logo.clearbit.com/microsoft.com', category: 'Productivity' },
  { sender: 'google.com', name: 'Google One', logoUrl: 'https://logo.clearbit.com/google.com', category: 'Cloud' },
  { sender: 'dropbox.com', name: 'Dropbox', logoUrl: 'https://logo.clearbit.com/dropbox.com', category: 'Cloud' },
  { sender: 'notion.so', name: 'Notion', logoUrl: 'https://logo.clearbit.com/notion.so', category: 'Productivity' },
  { sender: 'evernote.com', name: 'Evernote', logoUrl: 'https://logo.clearbit.com/evernote.com', category: 'Productivity' },
  { sender: 'airtable.com', name: 'Airtable', logoUrl: 'https://logo.clearbit.com/airtable.com', category: 'Productivity' },
  { sender: 'monday.com', name: 'Monday.com', logoUrl: 'https://logo.clearbit.com/monday.com', category: 'Productivity' },
  { sender: 'asana.com', name: 'Asana', logoUrl: 'https://logo.clearbit.com/asana.com', category: 'Productivity' },
  { sender: 'trello.com', name: 'Trello', logoUrl: 'https://logo.clearbit.com/trello.com', category: 'Productivity' },
  { sender: 'atlassian.com', name: 'Atlassian', logoUrl: 'https://logo.clearbit.com/atlassian.com', category: 'Productivity' },
  { sender: 'linear.app', name: 'Linear', logoUrl: 'https://logo.clearbit.com/linear.app', category: 'Productivity' },
  // Design & Dev
  { sender: 'figma.com', name: 'Figma', logoUrl: 'https://logo.clearbit.com/figma.com', category: 'Design' },
  { sender: 'adobe.com', name: 'Adobe', logoUrl: 'https://logo.clearbit.com/adobe.com', category: 'Design' },
  { sender: 'canva.com', name: 'Canva', logoUrl: 'https://logo.clearbit.com/canva.com', category: 'Design' },
  { sender: 'sketch.com', name: 'Sketch', logoUrl: 'https://logo.clearbit.com/sketch.com', category: 'Design' },
  { sender: 'webflow.com', name: 'Webflow', logoUrl: 'https://logo.clearbit.com/webflow.com', category: 'Developer Tools' },
  { sender: 'github.com', name: 'GitHub', logoUrl: 'https://logo.clearbit.com/github.com', category: 'Developer Tools' },
  { sender: 'gitlab.com', name: 'GitLab', logoUrl: 'https://logo.clearbit.com/gitlab.com', category: 'Developer Tools' },
  { sender: 'jetbrains.com', name: 'JetBrains', logoUrl: 'https://logo.clearbit.com/jetbrains.com', category: 'Developer Tools' },
  { sender: 'vercel.com', name: 'Vercel', logoUrl: 'https://logo.clearbit.com/vercel.com', category: 'Developer Tools' },
  { sender: 'digitalocean.com', name: 'DigitalOcean', logoUrl: 'https://logo.clearbit.com/digitalocean.com', category: 'Developer Tools' },
  { sender: 'cloudflare.com', name: 'Cloudflare', logoUrl: 'https://logo.clearbit.com/cloudflare.com', category: 'Developer Tools' },
  { sender: 'heroku.com', name: 'Heroku', logoUrl: 'https://logo.clearbit.com/heroku.com', category: 'Developer Tools' },
  { sender: 'postman.com', name: 'Postman', logoUrl: 'https://logo.clearbit.com/postman.com', category: 'Developer Tools' },
  { sender: 'sentry.io', name: 'Sentry', logoUrl: 'https://logo.clearbit.com/sentry.io', category: 'Developer Tools' },
  { sender: 'datadoghq.com', name: 'Datadog', logoUrl: 'https://logo.clearbit.com/datadoghq.com', category: 'Developer Tools' },
  // Communication & Collaboration
  { sender: 'slack.com', name: 'Slack', logoUrl: 'https://logo.clearbit.com/slack.com', category: 'Communication' },
  { sender: 'zoom.us', name: 'Zoom', logoUrl: 'https://logo.clearbit.com/zoom.us', category: 'Communication' },
  { sender: 'loom.com', name: 'Loom', logoUrl: 'https://logo.clearbit.com/loom.com', category: 'Communication' },
  { sender: 'intercom.com', name: 'Intercom', logoUrl: 'https://logo.clearbit.com/intercom.com', category: 'Communication' },
  { sender: 'zendesk.com', name: 'Zendesk', logoUrl: 'https://logo.clearbit.com/zendesk.com', category: 'Communication' },
  { sender: 'discord.com', name: 'Discord Nitro', logoUrl: 'https://logo.clearbit.com/discord.com', category: 'Entertainment' },
  // AI Tools
  { sender: 'openai.com', name: 'ChatGPT Plus', logoUrl: 'https://logo.clearbit.com/openai.com', category: 'AI Tools' },
  { sender: 'anthropic.com', name: 'Claude Pro', logoUrl: 'https://logo.clearbit.com/anthropic.com', category: 'AI Tools' },
  { sender: 'midjourney.com', name: 'Midjourney', logoUrl: 'https://logo.clearbit.com/midjourney.com', category: 'AI Tools' },
  { sender: 'grammarly.com', name: 'Grammarly', logoUrl: 'https://logo.clearbit.com/grammarly.com', category: 'AI Tools' },
  // Marketing & CRM
  { sender: 'mailchimp.com', name: 'Mailchimp', logoUrl: 'https://logo.clearbit.com/mailchimp.com', category: 'Marketing' },
  { sender: 'hubspot.com', name: 'HubSpot', logoUrl: 'https://logo.clearbit.com/hubspot.com', category: 'Marketing' },
  { sender: 'salesforce.com', name: 'Salesforce', logoUrl: 'https://logo.clearbit.com/salesforce.com', category: 'Marketing' },
  { sender: 'typeform.com', name: 'Typeform', logoUrl: 'https://logo.clearbit.com/typeform.com', category: 'Marketing' },
  { sender: 'mixpanel.com', name: 'Mixpanel', logoUrl: 'https://logo.clearbit.com/mixpanel.com', category: 'Marketing' },
  // Website & Domain
  { sender: 'shopify.com', name: 'Shopify', logoUrl: 'https://logo.clearbit.com/shopify.com', category: 'Business' },
  { sender: 'squarespace.com', name: 'Squarespace', logoUrl: 'https://logo.clearbit.com/squarespace.com', category: 'Business' },
  { sender: 'wix.com', name: 'Wix', logoUrl: 'https://logo.clearbit.com/wix.com', category: 'Business' },
  { sender: 'godaddy.com', name: 'GoDaddy', logoUrl: 'https://logo.clearbit.com/godaddy.com', category: 'Business' },
  { sender: 'namecheap.com', name: 'Namecheap', logoUrl: 'https://logo.clearbit.com/namecheap.com', category: 'Business' },
  // Security & Privacy
  { sender: 'lastpass.com', name: 'LastPass', logoUrl: 'https://logo.clearbit.com/lastpass.com', category: 'Security' },
  { sender: '1password.com', name: '1Password', logoUrl: 'https://logo.clearbit.com/1password.com', category: 'Security' },
  { sender: 'dashlane.com', name: 'Dashlane', logoUrl: 'https://logo.clearbit.com/dashlane.com', category: 'Security' },
  { sender: 'bitwarden.com', name: 'Bitwarden', logoUrl: 'https://logo.clearbit.com/bitwarden.com', category: 'Security' },
  { sender: 'nordvpn.com', name: 'NordVPN', logoUrl: 'https://logo.clearbit.com/nordvpn.com', category: 'Security' },
  { sender: 'expressvpn.com', name: 'ExpressVPN', logoUrl: 'https://logo.clearbit.com/expressvpn.com', category: 'Security' },
  // Learning
  { sender: 'duolingo.com', name: 'Duolingo Plus', logoUrl: 'https://logo.clearbit.com/duolingo.com', category: 'Education' },
  { sender: 'coursera.org', name: 'Coursera', logoUrl: 'https://logo.clearbit.com/coursera.org', category: 'Education' },
  { sender: 'udemy.com', name: 'Udemy', logoUrl: 'https://logo.clearbit.com/udemy.com', category: 'Education' },
  { sender: 'skillshare.com', name: 'Skillshare', logoUrl: 'https://logo.clearbit.com/skillshare.com', category: 'Education' },
  { sender: 'masterclass.com', name: 'MasterClass', logoUrl: 'https://logo.clearbit.com/masterclass.com', category: 'Education' },
  { sender: 'linkedin.com', name: 'LinkedIn Premium', logoUrl: 'https://logo.clearbit.com/linkedin.com', category: 'Education' },
  // Health & Wellness
  { sender: 'headspace.com', name: 'Headspace', logoUrl: 'https://logo.clearbit.com/headspace.com', category: 'Health & Fitness' },
  { sender: 'calm.com', name: 'Calm', logoUrl: 'https://logo.clearbit.com/calm.com', category: 'Health & Fitness' },
  { sender: 'strava.com', name: 'Strava', logoUrl: 'https://logo.clearbit.com/strava.com', category: 'Health & Fitness' },
  { sender: 'onepeloton.com', name: 'Peloton', logoUrl: 'https://logo.clearbit.com/onepeloton.com', category: 'Health & Fitness' },
  // Gaming
  { sender: 'xbox.com', name: 'Xbox Game Pass', logoUrl: 'https://logo.clearbit.com/xbox.com', category: 'Gaming' },
  { sender: 'playstation.com', name: 'PlayStation Plus', logoUrl: 'https://logo.clearbit.com/playstation.com', category: 'Gaming' },
  { sender: 'nintendo.com', name: 'Nintendo Switch Online', logoUrl: 'https://logo.clearbit.com/nintendo.com', category: 'Gaming' },
  { sender: 'steampowered.com', name: 'Steam', logoUrl: 'https://logo.clearbit.com/steampowered.com', category: 'Gaming' },
  { sender: 'epicgames.com', name: 'Epic Games', logoUrl: 'https://logo.clearbit.com/epicgames.com', category: 'Gaming' },
  { sender: 'ea.com', name: 'EA Play', logoUrl: 'https://logo.clearbit.com/ea.com', category: 'Gaming' },
  // Creator & Content
  { sender: 'patreon.com', name: 'Patreon', logoUrl: 'https://logo.clearbit.com/patreon.com', category: 'Entertainment' },
  { sender: 'substack.com', name: 'Substack', logoUrl: 'https://logo.clearbit.com/substack.com', category: 'Entertainment' },
  { sender: 'medium.com', name: 'Medium', logoUrl: 'https://logo.clearbit.com/medium.com', category: 'Entertainment' },
  // Food & Delivery
  { sender: 'doordash.com', name: 'DashPass', logoUrl: 'https://logo.clearbit.com/doordash.com', category: 'Utilities' },
  { sender: 'ubereats.com', name: 'Uber One', logoUrl: 'https://logo.clearbit.com/ubereats.com', category: 'Utilities' },
]

export interface DetectedSubscription {
  name: string
  amount: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly'
  /** True when the email signals a one-off charge, not a recurring subscription */
  is_one_time: boolean
  /** True when the email contains explicit auto-renewal / recurring-billing signals */
  is_recurring: boolean
  /** Next billing / renewal date extracted directly from the email (YYYY-MM-DD), or null */
  next_billing_date: string | null
  /** Auto-detected category name based on sender domain */
  category_name: string
  /** 0–95 integer confidence percentage */
  confidence_score: number
  /** Pipe-separated human-readable signal labels for UI and DB storage */
  detection_reason: string
  /** What the scan pipeline should do with this detection */
  confidence_suggestion: 'auto' | 'ask' | 'ignore'
  logo_url: string
  email_sender: string
  email_thread_id: string
  website_url: string
}

// ── One-time purchase signals ────────────────────────────────────────────────
// If these appear WITHOUT any recurring signal, the charge is not a subscription.
const ONE_TIME_KEYWORDS = [
  'one-time purchase',
  'one time purchase',
  'one-time payment',
  'one time payment',
  'one-time charge',
  'one time charge',
  'one-time fee',
  'one time fee',
  'single payment',
  'single charge',
  'one-off payment',
  'one off payment',
  'lifetime license',
  'lifetime access',
  'lifetime deal',
  'lifetime membership',
  'perpetual license',
  'not a subscription',
  'no recurring',
  'non-recurring',
  'nonrecurring',
  'no subscription',
  'individual purchase',
  'one-time transaction',
  'this is not a recurring charge',
  'this is a one-time',
]

// ── Explicit recurring / auto-renewal signals ─────────────────────────────────
const RECURRING_SIGNALS = [
  'auto-renew',
  'auto-renewal',
  'auto renew',
  'autorenewal',
  'will renew',
  'will be charged',
  'will be billed',
  'recurring payment',
  'recurring charge',
  'recurring billing',
  'subscription renewed',
  'subscription renewal',
  'next billing date',
  'next billing cycle',
  'next payment date',
  'next renewal',
  'your plan will renew',
  'your subscription will renew',
  'billed every',
  'charged every',
  'renews every',
  'automatically renews',
  'automatically billed',
  'continuous subscription',
]

// ── Date extraction helpers ───────────────────────────────────────────────────
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

function toISODate(d: Date): string {
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDateToken(raw: string): string | null {
  const s = raw.trim().replace(/,/g, '').replace(/\s+/g, ' ')

  // ISO: 2026-03-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00')
    return toISODate(d) || null
  }

  // "March 15 2026" or "Mar 15 2026"
  const m1 = s.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/)
  if (m1) {
    const mon = MONTH_MAP[m1[1].toLowerCase()]
    if (mon !== undefined) return toISODate(new Date(+m1[3], mon, +m1[2])) || null
  }

  // "15 March 2026"
  const m2 = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (m2) {
    const mon = MONTH_MAP[m2[2].toLowerCase()]
    if (mon !== undefined) return toISODate(new Date(+m2[3], mon, +m2[1])) || null
  }

  // MM/DD/YYYY  (US format, most common in billing emails)
  const m3 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m3) {
    const [, mm, dd, yyyy] = m3
    const d = new Date(+yyyy, +mm - 1, +dd)
    if (!isNaN(d.getTime()) && +mm <= 12 && +dd <= 31) return toISODate(d) || null
  }

  return null
}

/**
 * Attempt to extract the next billing / renewal date from email text.
 * Returns a YYYY-MM-DD string only when the date is in the future (or ≤7 days past).
 */
function extractNextBillingDate(text: string): string | null {
  const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const dateChunk = '([A-Za-z]+ \\d{1,2},?\\s*\\d{4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4})'

  const patterns: RegExp[] = [
    new RegExp(`next\\s+billing\\s+(?:date|on)\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`next\\s+payment\\s+(?:date|on|due)?\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`next\\s+charge\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`renewal\\s+date\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`renew(?:al|s)?\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`subscription\\s+(?:will\\s+)?renew(?:s)?\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`will\\s+be\\s+(?:charged|billed)\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`automatically\\s+(?:charged|billed|renews?)\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`billed\\s+again\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`due\\s+(?:on|date)\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`expires?\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`valid\\s+through\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
    new RegExp(`trial\\s+ends?\\s+on\\s*[:\\-]?\\s*${dateChunk}`, 'i'),
  ]

  for (const pat of patterns) {
    const match = text.match(pat)
    if (match?.[1]) {
      const parsed = parseDateToken(match[1])
      if (parsed && new Date(parsed) >= threshold) return parsed
    }
  }
  return null
}

export function detectSubscriptionFromEmail(
  subject: string,
  from: string,
  body: string,
  threadId: string,
  hasPreviousHistory = false
): DetectedSubscription | null {
  const lowerSubject = subject.toLowerCase()
  const lowerBody = body.toLowerCase()
  const lowerFrom = from.toLowerCase()

  // Check if this is a billing/receipt email — track subject vs body separately
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

  // Check if this is a billing/receipt email — track subject vs body separately
  const billingKwInSubject = billingKeywords.some((kw) => lowerSubject.includes(kw))
  const billingKwInBody = billingKeywords.some((kw) => lowerBody.includes(kw))
  const isBillingEmail = billingKwInSubject || billingKwInBody
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
  let billingCycleDetected = false
  if (cycleText.includes('annual') || cycleText.includes('yearly') || cycleText.includes('year plan') || cycleText.includes('/year') || cycleText.includes('per year')) {
    billing_cycle = 'yearly'
    billingCycleDetected = true
  } else if (cycleText.includes('quarterly') || cycleText.includes('every 3 months') || cycleText.includes('3-month')) {
    billing_cycle = 'quarterly'
    billingCycleDetected = true
  } else if (cycleText.includes('weekly') || cycleText.includes('per week') || cycleText.includes('/week')) {
    billing_cycle = 'weekly'
    billingCycleDetected = true
  } else if (cycleText.includes('monthly') || cycleText.includes('per month') || cycleText.includes('/month') || cycleText.includes('every month')) {
    billingCycleDetected = true
  }

  // Detect one-time vs recurring
  const combinedText = lowerSubject + ' ' + lowerBody
  const is_one_time = ONE_TIME_KEYWORDS.some((kw) => combinedText.includes(kw))
  const is_recurring = RECURRING_SIGNALS.some((kw) => combinedText.includes(kw))

  // Try to extract the next billing date directly from the email
  const next_billing_date = extractNextBillingDate(subject + ' ' + body)

  // Detect trial signal
  const trialSignal = TRIAL_SIGNALS.some((kw) => combinedText.includes(kw))

  // Compute Bayesian-style confidence score
  const confidence = computeConfidenceScore({
    senderMatched: true, // only reachable when pattern matched
    billingKwInSubject,
    billingKwInBody,
    recurringSignal: is_recurring,
    amountDetected: amount > 0,
    billingCycleDetected,
    nextDateExtracted: next_billing_date !== null,
    trialSignal,
    oneTimeSignal: is_one_time,
    hasPreviousHistory,
  })

  return {
    name: pattern.name,
    amount,
    currency,
    billing_cycle,
    is_one_time,
    is_recurring,
    next_billing_date,
    category_name: pattern.category,
    confidence_score: confidence.score,
    detection_reason: confidence.reason,
    confidence_suggestion: confidence.suggestion,
    logo_url: pattern.logoUrl,
    email_sender: from,
    email_thread_id: threadId,
    website_url: `https://${pattern.sender}`,
  }
}
const CANCELLATION_KEYWORDS = [
  'cancellation confirmed',
  'subscription cancelled',
  'subscription canceled',
  'your subscription has been cancelled',
  'your subscription has been canceled',
  "we've cancelled your subscription",
  "we've canceled your subscription",
  'we have cancelled your subscription',
  'we have canceled your subscription',
  'successfully cancelled your subscription',
  'your cancellation has been processed',
  'your account has been cancelled',
  'your account has been canceled',
  'your account has been closed',
  'account cancelled',
  'account canceled',
  'account closed',
  'service cancelled',
  'service canceled',
  'membership cancelled',
  'membership canceled',
  'plan cancelled',
  'plan canceled',
  'cancellation request received',
  'unsubscribed successfully',
  'you have been unsubscribed',
  'access has been cancelled',
  'access has been removed',
  'refund processed',
  'refund has been issued',
]

// Keywords that indicate a subscription was paused
const PAUSE_KEYWORDS = [
  'subscription paused',
  'subscription has been paused',
  'your subscription is paused',
  "we've paused your subscription",
  'we have paused your subscription',
  'plan paused',
  'account paused',
  'membership paused',
  'temporarily paused',
  'paused your account',
  'billing paused',
]

// Keywords that indicate a trial is converting to a paid subscription
const TRIAL_SIGNALS = [
  'trial ending',
  'trial ends',
  'trial expired',
  'trial is ending',
  'trial will end',
  'trial period ending',
  'your free trial',
  'trial converts',
  'trial converting',
  'after your trial',
  'end of your trial',
  'trial to paid',
  'trial has ended',
]

/**
 * Detect if an email signals a cancellation or pause for a known service.
 * Returns the matched service name and new status, or null if not a status-change email.
 */
export function detectStatusFromEmail(
  subject: string,
  from: string,
  body: string
): { name: string; status: 'cancelled' | 'paused' } | null {
  const lowerFrom = from.toLowerCase()
  const combined = subject.toLowerCase() + ' ' + body.toLowerCase()

  const pattern = SUBSCRIPTION_PATTERNS.find((p) => lowerFrom.includes(p.sender))
  if (!pattern) return null

  if (CANCELLATION_KEYWORDS.some((kw) => combined.includes(kw))) {
    return { name: pattern.name, status: 'cancelled' }
  }
  if (PAUSE_KEYWORDS.some((kw) => combined.includes(kw))) {
    return { name: pattern.name, status: 'paused' }
  }
  return null
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
