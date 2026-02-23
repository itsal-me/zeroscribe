import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image  (Next.js internals)
     * - favicon.ico
     * - auth/*  (OAuth callback — must NOT run updateSession here or the
     *            PKCE code-verifier cookie gets mutated before the route
     *            handler can call exchangeCodeForSession)
     * - api/*   (API routes handle auth themselves)
     * - Static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|auth\/|api\/|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
