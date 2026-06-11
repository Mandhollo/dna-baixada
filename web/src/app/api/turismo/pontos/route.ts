import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { PontoTuristico, PontoCategoria } from '@/lib/supabase';

/**
 * GET /api/turismo/pontos
 * List pontos turísticos with optional filters.
 * Query params: categoria, cidade, destaque, ativo, limit, offset
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

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    let query = supabase
      .from('pontos_turisticos')
      .select('*', { count: 'exact' })
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('destaque', { ascending: false });

    // Optional filters
    const categoria = searchParams.get('categoria') as PontoCategoria | null;
    if (categoria) query = query.eq('categoria', categoria);

    const cidade = searchParams.get('cidade');
    if (cidade) query = query.eq('cidade', cidade);

    const destaque = searchParams.get('destaque');
    if (destaque === 'true') query = query.eq('destaque', true);

    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/turismo/pontos] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar pontos turísticos', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ pontos: data as PontoTuristico[], count });
  } catch (err) {
    console.error('[GET /api/turismo/pontos]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
