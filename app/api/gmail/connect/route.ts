import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailAuthUrl } from '@/lib/gmail'
import { getPublicOrigin } from '@/lib/url'

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
