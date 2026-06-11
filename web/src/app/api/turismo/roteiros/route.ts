import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Roteiro, RoteiroTipo } from '@/lib/supabase';

/**
 * GET /api/turismo/roteiros
 * List roteiros turísticos with optional filters.
 * Query params: tipo, destaque, ativo, limit, offset
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
      .from('roteiros')
      .select('*, pontos:pontos_turisticos!pontos_ids(*)', { count: 'exact' })
      .eq('ativo', true)
      .order('destaque', { ascending: false });

    const tipo = searchParams.get('tipo') as RoteiroTipo | null;
    if (tipo) query = query.eq('tipo', tipo);

    const destaque = searchParams.get('destaque');
    if (destaque === 'true') query = query.eq('destaque', true);

    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/turismo/roteiros] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar roteiros', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ roteiros: data as Roteiro[], count });
  } catch (err) {
    console.error('[GET /api/turismo/roteiros]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
