import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // OAuth provider returned an error (e.g. user denied consent)
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const message = errorDescription || error === 'access_denied'
      ? 'Sign-in was cancelled. Please try again.'
      : `OAuth error: ${error}`
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }

    // Session exchange failed — surface the real error
    console.error('Session exchange error:', exchangeError)
    const msg = exchangeError.message ?? 'Authentication failed. Please try again.'
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`
    )
  }

  // No code and no error — something unexpected happened
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('No authentication code received. Please try again.')}`
  )
}
