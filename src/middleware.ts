import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect routes that require authentication
const protectedRoutes = ['/pdfs', '/archive', '/rag', '/chat', '/pre_rag', '/settings'];

// Public routes
const publicRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if user is authenticated
  const isAuthenticated = !!token;

  // Handle protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle public routes when authenticated
  if (publicRoutes.includes(pathname) && isAuthenticated) {
    // Redirect to home if already logged in
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|public|favicon.ico).*)'],
};