import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { normalizeRole, type UserRole } from '@/lib/roles';

const DEV_MODE_ENABLED =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_DEV_MODE?.toLowerCase() === 'true';
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  '';

type RouteRule = {
  prefix: string;
  allowed: UserRole[];
};

const protectedRoutes: RouteRule[] = [
  { prefix: '/cliente', allowed: ['ADMIN', 'CLIENTE_TECNICO'] },
  { prefix: '/socio', allowed: ['ADMIN', 'SOCIO'] },
];

function isAuthRoute(pathname: string) {
  return pathname.startsWith('/auth');
}

function isRedirectLoop(pathname: string) {
  return pathname === '/auth/login' || pathname === '/auth/callback';
}

function isLegacyLanding(pathname: string) {
  return pathname === '/es' || pathname === '/es/';
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
    return NextResponse.redirect(new URL('/cliente/dashboard', req.url));
  }
  
  // Redirecciones legacy
  if (isLegacyLanding(pathname)) {
    return NextResponse.redirect(new URL('/socio/panel', req.url));
  }

  if (pathname.startsWith('/cliente-tecnico')) {
    return NextResponse.redirect(new URL('/cliente/dashboard', req.url));
  }
  
  if (pathname.startsWith('/panel')) {
    return NextResponse.redirect(new URL('/socio/panel', req.url));
  }

  const res = NextResponse.next();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase configuration missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY).'
    );
  }
  
  // Validate that SUPABASE_URL is a valid HTTP/HTTPS URL
  try {
    const url = new URL(SUPABASE_URL);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`Invalid Supabase URL protocol: ${url.protocol}. Must be http:// or https://`);
    }
  } catch (error) {
    if (error instanceof TypeError || error instanceof Error) {
      throw new Error(
        `Invalid Supabase URL: "${SUPABASE_URL}". Must be a valid HTTP or HTTPS URL. ${error.message.includes('protocol') ? error.message : 'Please check your NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable.'}`
      );
    }
    throw error;
  }
  
  const supabase = createMiddlewareClient<Database>(
    { req, res } as any,
    {
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
    } as any
  );
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
      role === 'SOCIO' ? '/socio/panel' : '/cliente/dashboard',
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
    '/cliente/:path*',
    '/cliente-tecnico/:path*', // Legacy redirect
    '/socio/:path*',
    '/panel/:path*', // Legacy redirect
    '/dashboard/:path*',
    '/auth/login',
    '/auth/callback',
    '/onboarding',
  ],
};
