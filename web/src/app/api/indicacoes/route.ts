import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/indicacoes
 * Get referral stats for the authenticated user.
 * Returns: total indicados, indicados que cadastraram, pontos ganhos, lista de indicacoes
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

    // Fetch user's referrals
    let query = supabase
      .from('indicacoes')
      .select('*, indicado:profiles!indicado_id(id, nome, foto_url, ativo)', { count: 'exact' })
      .eq('indicador_id', user.id)
      .order('created_at', { ascending: false });

    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/indicacoes] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar indicações', details: error.message },
        { status: 500 },
      );
    }

    const indicacoes = data ?? [];

    // Compute stats
    const totalIndicados = count ?? 0;
    const cadastraram = indicacoes.filter((i: Record<string, unknown>) => i.cadastrou === true).length;
    const pontosGanhos = indicacoes.reduce(
      (acc: number, i: Record<string, unknown>) => acc + ((i.pontos_ganhos as number) ?? 0),
      0,
    );

    return NextResponse.json({
      indicacoes,
      stats: {
        total_indicados: totalIndicados,
        cadastraram,
        pontos_ganhos: pontosGanhos,
      },
      count: totalIndicados,
    });
  } catch (err) {
    console.error('[GET /api/indicacoes]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/indicacoes
 * Create a new referral (indicação).
 * Body: indicado_id (the referred user's ID) OR indicado_email/indicado_telefone
 */
export async function POST(request: NextRequest) {
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
            // No cookie writes
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.indicado_id && !body.indicado_email && !body.indicado_telefone) {
      return NextResponse.json(
        { error: 'Forneça indicado_id, indicado_email ou indicado_telefone' },
        { status: 400 },
      );
    }

    // Prevent self-referral
    if (body.indicado_id === user.id) {
      return NextResponse.json(
        { error: 'Você não pode se indicar' },
        { status: 400 },
      );
    }

    // Check for duplicate referral
    if (body.indicado_id) {
      const { data: existing } = await supabase
        .from('indicacoes')
        .select('id')
        .eq('indicador_id', user.id)
        .eq('indicado_id', body.indicado_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Você já indicou esta pessoa' },
          { status: 409 },
        );
      }
    }

    const insertData: Record<string, unknown> = {
      indicador_id: user.id,
      indicado_id: body.indicado_id ?? null,
      indicado_email: body.indicado_email ?? null,
      indicado_telefone: body.indicado_telefone ?? null,
      cadastrou: !!body.indicado_id, // if we have an ID, they already signed up
      pontos_ganhos: body.indicado_id ? 50 : 0, // points awarded only when referred user signs up
    };

    const { data, error } = await supabase
      .from('indicacoes')
      .insert(insertData)
      .select('*, indicado:profiles!indicado_id(id, nome, foto_url)')
      .single();

    if (error) {
      console.error('[POST /api/indicacoes] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao criar indicação', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ indicacao: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/indicacoes]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
