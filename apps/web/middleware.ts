import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';

const DEV_MODE_ENABLED =
  process.env.NEXT_PUBLIC_DEV_MODE?.toLowerCase() === 'true';
const protectedMatchers = ['/dashboard', '/lider', '/panel-socio'];

export async function middleware(req: NextRequest) {
  if (DEV_MODE_ENABLED) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname, search } = req.nextUrl;
  const isProtected = protectedMatchers.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !session) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/lider/:path*',
    '/panel-socio/:path*',
    '/auth/login',
  ],
};
