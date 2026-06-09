import { type NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/entrar', '/cadastro', '/recuperar-senha'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é rota protegida
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verificar se é rota de auth
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Para rotas protegidas, deixar o cliente lidar com redirecionamento
  // O middleware não consegue acessar Supabase session facilmente
  // A proteção real é feita pelo AuthProvider no client-side

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/entrar', '/cadastro', '/recuperar-senha'],
};
