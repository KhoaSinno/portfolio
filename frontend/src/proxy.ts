import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return redirectToLogin(request, 'config');
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { data: claimsResult } = await supabase.auth.getClaims();
  return claimsResult?.claims ? response : redirectToLogin(request);
}

function redirectToLogin(request: NextRequest, reason?: string) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  if (reason) loginUrl.searchParams.set('reason', reason);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ['/admin/resume/:path*', '/admin/inbox/:path*'] };
