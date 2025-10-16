import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { normalizeRole, type UserRole } from '@/lib/roles';

const DEV_MODE_ENABLED =
  process.env.NEXT_PUBLIC_DEV_MODE?.toLowerCase() === 'true';

type RouteRule = {
  prefix: string;
  allowed: UserRole[];
};

const protectedRoutes: RouteRule[] = [
  { prefix: '/cliente-tecnico', allowed: ['ADMIN', 'CLIENTE_TECNICO'] },
  { prefix: '/socio', allowed: ['ADMIN', 'SOCIO'] },
  { prefix: '/panel', allowed: ['ADMIN', 'SOCIO'] },
];

function isAuthRoute(pathname: string) {
  return pathname.startsWith('/auth');
}

function isRedirectLoop(pathname: string) {
  return pathname === '/auth/login' || pathname === '/auth/callback';
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isAuthRoute(pathname)) {
    return NextResponse.next();
  }

  if (DEV_MODE_ENABLED) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/cliente-tecnico', req.url));
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/auth/login', req.url);
    if (!isRedirectLoop(pathname)) {
      loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  const role = normalizeRole(
    (session.user.app_metadata as Record<string, unknown> | undefined)?.role ??
      (session.user.user_metadata as Record<string, unknown> | undefined)?.role
  );

  if (!role) {
    const selectionUrl = new URL('/auth/select-role', req.url);
    if (!pathname.startsWith('/auth/select-role')) {
      selectionUrl.searchParams.set('redirect', `${pathname}${search}`);
    }
    return NextResponse.redirect(selectionUrl);
  }

  const orgId =
    ((session.user.user_metadata as Record<string, unknown> | undefined)?.org_id ??
      (session.user.app_metadata as Record<string, unknown> | undefined)?.org_id ??
      null) as string | null;

  if (role === 'CLIENTE_TECNICO' && !orgId) {
    if (pathname.startsWith('/onboarding')) {
      return res;
    }
    const onboardingUrl = new URL('/onboarding', req.url);
    onboardingUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(onboardingUrl);
  }

  if (pathname.startsWith('/onboarding')) {
    const fallbackUrl = new URL(
      role === 'SOCIO' ? '/socio' : '/cliente-tecnico',
      req.url
    );
    return NextResponse.redirect(fallbackUrl);
  }

  const matchedRule = protectedRoutes.find((rule) =>
    pathname.startsWith(rule.prefix)
  );

  if (matchedRule) {
    const isAllowed = matchedRule.allowed.includes(role);
    if (!isAllowed) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/cliente-tecnico/:path*',
    '/socio/:path*',
    '/panel/:path*',
    '/dashboard/:path*',
    '/auth/login',
    '/auth/callback',
    '/onboarding',
  ],
};
