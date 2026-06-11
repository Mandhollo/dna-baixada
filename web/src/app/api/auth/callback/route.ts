import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/callback
 * Handles Supabase OAuth callback (e.g. Google OAuth).
 * Exchanges the `code` query param for a session, then redirects to /dashboard.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: false, // server-side — don't persist here
            detectSessionInUrl: false,
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
    } catch (err) {
      console.error('[auth/callback] Unexpected error:', err);
      return NextResponse.redirect(
        new URL('/entrar?error=auth_callback_failed', requestUrl.origin),
      );
    }
  }

  // Redirect to dashboard (or the `next` param) after successful exchange
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
