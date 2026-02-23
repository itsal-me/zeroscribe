import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailAuthUrl } from '@/lib/gmail'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Derive the redirect URI from the actual request origin so it always
  // matches what is registered in Google Cloud Console.
  const { origin } = new URL(request.url)
  const redirectUri = `${origin}/api/gmail/callback`

  const authUrl = getGmailAuthUrl(user.id, redirectUri)
  return NextResponse.redirect(authUrl)
}
