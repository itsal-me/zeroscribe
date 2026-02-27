import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailAuthUrl } from '@/lib/gmail'

/** Derive the public-facing origin, handling Vercel / reverse-proxy headers. */
function getPublicOrigin(request: Request): string {
  // Prefer explicit env var set in Vercel dashboard (most reliable)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  // Vercel sets x-forwarded-host on the actual deployment domain
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    return `https://${forwardedHost}`
  }
  // Fallback: use the origin from the request URL
  const { origin } = new URL(request.url)
  return origin
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const origin = getPublicOrigin(request)
  const redirectUri = `${origin}/api/gmail/callback`

  const authUrl = getGmailAuthUrl(user.id, redirectUri)
  return NextResponse.redirect(authUrl)
}
