import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedRoutes = ['/dashboard', '/corrida', '/corridas-disponiveis', '/admin'];
const authRoutes = ['/entrar', '/cadastro', '/recuperar-senha'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create a response object we can mutate (start with a pass-through)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create a Supabase server client that reads/writes cookies via the request/response pair
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refresh the session and get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  // Protected route + no user → redirect to login
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/entrar';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Auth route + logged in user → redirect to dashboard
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.delete('redirect');
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
