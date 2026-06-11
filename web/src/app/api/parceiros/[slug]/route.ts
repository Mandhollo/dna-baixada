import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Estabelecimento } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/parceiros/[slug]
 * Fetch a single estabelecimento by slug.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Read-only route
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { slug } = await context.params;

    const { data, error } = await supabase
      .from('estabelecimentos')
      .select('*, campanhas:campanhas_promocionais(*)')
      .eq('slug', slug)
      .eq('ativo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Estabelecimento não encontrado' },
          { status: 404 },
        );
      }
      console.error('[GET /api/parceiros/[slug]] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar estabelecimento', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ estabelecimento: data as Estabelecimento });
  } catch (err) {
    console.error('[GET /api/parceiros/[slug]]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
