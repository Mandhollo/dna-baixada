import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Corrida, CorridaTipo, CorridaStatus } from '@/lib/supabase';

/**
 * GET /api/corridas
 * List corridas with optional query filters.
 * Query params: status, tipo, passageiro_id, motorista_id, limit, offset
 *
 * Note: Does NOT join with profiles to avoid RLS recursion.
 * Fetches profiles separately after getting corridas.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query corridas without the profiles join (avoids RLS recursion on profiles)
    let query = supabase
      .from('corridas')
      .select('*')
      .order('created_at', { ascending: false });

    // Optional filters
    const status = searchParams.get('status') as CorridaStatus | null;
    if (status) query = query.eq('status', status);

    const tipo = searchParams.get('tipo') as CorridaTipo | null;
    if (tipo) query = query.eq('tipo', tipo);

    const passageiroId = searchParams.get('passageiro_id');
    if (passageiroId) query = query.eq('passageiro_id', passageiroId);

    const motoristaId = searchParams.get('motorista_id');
    if (motoristaId) query = query.eq('motorista_id', motoristaId);

    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar corridas', details: error.message },
        { status: 500 },
      );
    }

    // Fetch profiles separately for passageiro and motorista
    const corridas = (data as Corrida[]) ?? [];
    const profileIds = new Set<string>();
    corridas.forEach((c) => {
      if (c.passageiro_id) profileIds.add(c.passageiro_id);
      if (c.motorista_id) profileIds.add(c.motorista_id);
    });

    let profilesMap: Record<string, { id: string; nome: string; foto_url: string | null; telefone: string | null }> = {};
    if (profileIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, foto_url, telefone')
        .in('id', Array.from(profileIds));

      if (profiles) {
        profiles.forEach((p: { id: string }) => {
          profilesMap[p.id] = p as typeof profilesMap[string];
        });
      }
    }

    // Merge profiles into corridas
    const result = corridas.map((c) => ({
      ...c,
      passageiro: c.passageiro_id ? profilesMap[c.passageiro_id] || null : null,
      motorista: c.motorista_id ? profilesMap[c.motorista_id] || null : null,
    }));

    return NextResponse.json({ corridas: result, count: result.length });
  } catch (err) {
    console.error('[GET /api/corridas]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/corridas
 * Create a new corrida.
 * Body: passageiro_id, tipo, origem_endereco, origem_lat, origem_lng, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Required fields
    const required = ['passageiro_id', 'tipo', 'origem_endereco'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório ausente: ${field}` },
          { status: 400 },
        );
      }
    }

    const insertData: Record<string, unknown> = {
      passageiro_id: body.passageiro_id,
      tipo: body.tipo,
      status: body.status ?? 'aguardando',
      origem_endereco: body.origem_endereco,
      origem_lat: body.origem_lat ?? null,
      origem_lng: body.origem_lng ?? null,
      destino_endereco: body.destino_endereco ?? null,
      destino_lat: body.destino_lat ?? null,
      destino_lng: body.destino_lng ?? null,
      preco_estimado: body.preco_estimado ?? null,
      forma_pagamento: body.forma_pagamento ?? null,
      distancia_km: body.distancia_km ?? null,
      duracao_minutos: body.duracao_minutos ?? null,
      observacoes: body.observacoes ?? null,
      passageiros: body.passageiros ?? 1,
    };

    // Insert without profiles join to avoid RLS recursion
    const { data, error } = await supabase
      .from('corridas')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('[POST /api/corridas] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao criar corrida', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ corrida: data as Corrida }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/corridas]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
