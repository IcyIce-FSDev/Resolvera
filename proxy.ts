import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // CSRF Protection - Validate origin for state-changing requests
  const method = request.method;
  const isStateChangingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isStateChangingRequest) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // For state-changing requests, validate that the origin/referer matches our host
    // This prevents CSRF attacks from malicious sites
    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return new NextResponse('CSRF validation failed', { status: 403 });
      }
    } else if (referer) {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return new NextResponse('CSRF validation failed', { status: 403 });
      }
    } else {
      // No origin or referer header - could be a CSRF attempt
      // Allow only if it's from same-origin (browser will include cookies)
      // In production, you may want to be more strict here
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (!isDevelopment) {
        return new NextResponse('CSRF validation failed - missing origin', { status: 403 });
      }
    }
  }

  const response = NextResponse.next();

  // Security Headers
  const headers = response.headers;

  // Prevent clickjacking attacks
  headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy - don't leak referrer information
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - restrict what features can be used
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy
  const isDevelopment = process.env.NODE_ENV === 'development';
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-* needed for Next.js dev/build
    "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Next.js
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // HSTS - Force HTTPS (only in production)
  if (!isDevelopment) {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

// Apply proxy to all routes except static files and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
