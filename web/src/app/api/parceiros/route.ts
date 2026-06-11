import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Estabelecimento, EstabelecimentoCategoria } from '@/lib/supabase';

/**
 * GET /api/parceiros
 * List estabelecimentos parceiros with optional filters.
 * Query params: categoria, cidade, destaque, verificado, limit, offset
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    let query = supabase
      .from('estabelecimentos')
      .select('*, campanhas:campanhas_promocionais(*)', { count: 'exact' })
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('ordem', { ascending: true });

    const categoria = searchParams.get('categoria') as EstabelecimentoCategoria | null;
    if (categoria) query = query.eq('categoria', categoria);

    const cidade = searchParams.get('cidade');
    if (cidade) query = query.eq('cidade', cidade);

    const destaque = searchParams.get('destaque');
    if (destaque === 'true') query = query.eq('destaque', true);

    const verificado = searchParams.get('verificado');
    if (verificado === 'true') query = query.eq('verificado', true);

    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/parceiros] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar parceiros', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ estabelecimentos: data as Estabelecimento[], count });
  } catch (err) {
    console.error('[GET /api/parceiros]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
