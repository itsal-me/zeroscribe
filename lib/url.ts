/** Derive the public-facing HTTPS origin, correctly handling Vercel's proxy.
 *
 * On Vercel, request.url is http:// internally even for HTTPS traffic.
 * We must use x-forwarded-proto + x-forwarded-host to build the real URL.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL env var (most explicit — set this in Vercel)
 *   2. x-forwarded-proto + x-forwarded-host headers (Vercel standard)
 *   3. Fallback to request.url origin (works on localhost)
 */
export function getPublicOrigin(request: Request): string {
  // 1. Explicit env override — most reliable for production
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }

  // 2. Vercel reverse-proxy headers — proto is always 'https' on Vercel production
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost  = request.headers.get('x-forwarded-host')
  if (forwardedProto && forwardedHost) {
    // x-forwarded-proto can be "https,http" — take the first value
    const proto = forwardedProto.split(',')[0].trim()
    return `${proto}://${forwardedHost}`
  }

  // 3. Localhost / direct — origin from request URL is correct
  const { origin } = new URL(request.url)
  return origin
}
