import { NextRequest, NextResponse } from 'next/server';

const ADMIN_HOST = 'admin.adframe.com.br';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';

  if (hostname !== ADMIN_HOST) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Already on an /admin path — let it through
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Rewrite root and /login to /admin
  const url = request.nextUrl.clone();
  url.pathname = '/admin';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and Next.js internals.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
