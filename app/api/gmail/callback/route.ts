import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/gmail'

function getPublicOrigin(request: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    return `https://${forwardedHost}`
  }
  const { origin } = new URL(request.url)
  return origin
}

export async function GET(request: Request) {
  const origin = getPublicOrigin(request)
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // user ID
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/dashboard/settings?gmail_error=${error}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/settings?gmail_error=missing_params`)
  }

  // Must match the redirect_uri sent in the initial auth request exactly
  const redirectUri = `${origin}/api/gmail/callback`

  try {
    const supabase = await createClient()
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    await supabase
      .from('profiles')
      .update({
        gmail_connected: true,
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_token_expiry: new Date(tokens.expiry_date).toISOString(),
      })
      .eq('id', state)

    return NextResponse.redirect(`${origin}/dashboard/settings?gmail_connected=true`)
  } catch (err) {
    console.error('Gmail callback error:', err)
    return NextResponse.redirect(`${origin}/dashboard/settings?gmail_error=token_exchange_failed`)
  }
}
