import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Cruzeiro } from '@/lib/supabase';

/**
 * GET /api/turismo/cruzeiros
 * List cruzeiros (incoming ships) with optional filters.
 * Query params: status, ativo, limit, offset
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
      .from('cruzeiros')
      .select('*', { count: 'exact' })
      .eq('ativo', true)
      .order('data_chegada', { ascending: true });

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status);

    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/turismo/cruzeiros] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar cruzeiros', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ cruzeiros: data as Cruzeiro[], count });
  } catch (err) {
    console.error('[GET /api/turismo/cruzeiros]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
