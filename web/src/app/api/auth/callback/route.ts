import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/callback
 * Handles Supabase OAuth callback (e.g. Google OAuth).
 * Exchanges the `code` query param for a session, sets cookies, then redirects to /dashboard.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    try {
      const response = NextResponse.redirect(new URL(next, requestUrl.origin));

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        },
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[auth/callback] Error exchanging code:', error.message);
        return NextResponse.redirect(
          new URL(`/entrar?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
        );
      }

      return response;
    } catch (err) {
      console.error('[auth/callback] Unexpected error:', err);
      return NextResponse.redirect(
        new URL('/entrar?error=auth_callback_failed', requestUrl.origin),
      );
    }
  }

  // No code — redirect to login
  return NextResponse.redirect(new URL('/entrar', requestUrl.origin));
}
