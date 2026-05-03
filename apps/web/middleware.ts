/**
 * Edge-friendly auth middleware. Redirects unauthenticated visitors to
 * /login and bounces logged-in users away from /login and /signup.
 *
 * Public surface: /, /login, /signup, /api/auth/*, /verify-email,
 * /accept-invitation, _next assets.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from './auth';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/verify-email', '/accept-invitation'];

const AUTH_PATHS = ['/login', '/signup'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/icons/')) return true;
  if (pathname === '/manifest.webmanifest' || pathname === '/favicon.ico') return true;
  return false;
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isAuthed = req.auth !== null && req.auth !== undefined;

  if (isAuthed && AUTH_PATHS.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/account';
    return NextResponse.redirect(url);
  }

  if (!isAuthed && !isPublic(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest).*)'],
};
