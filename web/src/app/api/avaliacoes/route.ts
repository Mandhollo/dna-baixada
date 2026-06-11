import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Avaliacao } from '@/lib/supabase';

/**
 * GET /api/avaliacoes
 * List avaliações with optional filters.
 * Query params: corrida_id, avaliador_id, avaliado_id, limit, offset
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
      .from('avaliacoes')
      .select('*, avaliador:profiles!avaliador_id(id, nome, foto_url), avaliado:profiles!avaliado_id(id, nome, foto_url)', { count: 'exact' })
      .order('created_at', { ascending: false });

    const corridaId = searchParams.get('corrida_id');
    if (corridaId) query = query.eq('corrida_id', corridaId);

    const avaliadorId = searchParams.get('avaliador_id');
    if (avaliadorId) query = query.eq('avaliador_id', avaliadorId);

    const avaliadoId = searchParams.get('avaliado_id');
    if (avaliadoId) query = query.eq('avaliado_id', avaliadoId);

    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/avaliacoes] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar avaliações', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ avaliacoes: data as Avaliacao[], count });
  } catch (err) {
    console.error('[GET /api/avaliacoes]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/avaliacoes
 * Create a new avaliação.
 * Body: corrida_id, avaliado_id, nota (1-5), comentario?
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

    const required = ['corrida_id', 'avaliado_id', 'nota'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Campo obrigatório ausente: ${field}` },
          { status: 400 },
        );
      }
    }

    // Validate nota range
    const nota = Number(body.nota);
    if (nota < 1 || nota > 5 || !Number.isInteger(nota)) {
      return NextResponse.json(
        { error: 'Nota deve ser um número inteiro entre 1 e 5' },
        { status: 400 },
      );
    }

    // Check if user already rated this ride for this person
    const { data: existing } = await supabase
      .from('avaliacoes')
      .select('id')
      .eq('corrida_id', body.corrida_id)
      .eq('avaliador_id', user.id)
      .eq('avaliado_id', body.avaliado_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Você já avaliou esta pessoa nesta corrida' },
        { status: 409 },
      );
    }

    const insertData: Record<string, unknown> = {
      corrida_id: body.corrida_id,
      avaliador_id: user.id,
      avaliado_id: body.avaliado_id,
      nota,
      comentario: body.comentario ?? null,
    };

    const { data, error } = await supabase
      .from('avaliacoes')
      .insert(insertData)
      .select('*, avaliador:profiles!avaliador_id(id, nome, foto_url), avaliado:profiles!avaliado_id(id, nome, foto_url)')
      .single();

    if (error) {
      console.error('[POST /api/avaliacoes] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao criar avaliação', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ avaliacao: data as Avaliacao }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/avaliacoes]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
