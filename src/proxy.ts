import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pinCookie = request.cookies.get('app_access_token');

  // If the user is trying to access the login page
  if (request.nextUrl.pathname.startsWith('/login')) {
    // If they already have the cookie, redirect to home
    if (pinCookie && pinCookie.value === 'authenticated') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Otherwise let them view the login page
    return NextResponse.next();
  }

  // For any other protected route, check the cookie
  if (!pinCookie || pinCookie.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Matches all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico, sitemap.xml, robots.txt (metadata files)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
