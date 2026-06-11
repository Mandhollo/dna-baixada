import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Corrida, CorridaStatus } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Helper: fetch profiles by IDs to avoid RLS recursion from JOIN.
 */
async function fetchProfiles(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, { id: string; nome: string; foto_url: string | null; telefone: string | null }>;
  const { data } = await supabase
    .from('profiles')
    .select('id, nome, foto_url, telefone')
    .in('id', ids);
  const map: Record<string, { id: string; nome: string; foto_url: string | null; telefone: string | null }> = {};
  if (data) data.forEach((p: { id: string }) => { map[p.id] = p as typeof map[string]; });
  return map;
}

/**
 * GET /api/corridas/[id]
 * Fetch a single corrida by ID.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabase
      .from('corridas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Corrida não encontrada' },
          { status: 404 },
        );
      }
      console.error('[GET /api/corridas/[id]] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar corrida', details: error.message },
        { status: 500 },
      );
    }

    const corrida = data as Record<string, unknown>;
    const profileIds: string[] = [];
    if (corrida.passageiro_id) profileIds.push(corrida.passageiro_id as string);
    if (corrida.motorista_id) profileIds.push(corrida.motorista_id as string);
    const profilesMap = await fetchProfiles(profileIds);

    const result = {
      ...corrida,
      passageiro: corrida.passageiro_id ? profilesMap[corrida.passageiro_id as string] || null : null,
      motorista: corrida.motorista_id ? profilesMap[corrida.motorista_id as string] || null : null,
    };

    return NextResponse.json({ corrida: result as Corrida });
  } catch (err) {
    console.error('[GET /api/corridas/[id]]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/corridas/[id]
 * Update corrida fields — typically used for status transitions.
 * Body: status, motorista_id, preco_final, forma_pagamento, etc.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validate status transition if status is provided
    const validStatuses: CorridaStatus[] = [
      'aguardando',
      'aceita',
      'em_andamento',
      'finalizada',
      'cancelada',
    ];

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Status inválido. Valores aceitos: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    // Build update payload from allowed fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'status',
      'motorista_id',
      'preco_final',
      'forma_pagamento',
      'distancia_km',
      'duracao_minutos',
      'observacoes',
      'passageiros',
      'cancelado_por',
      'motivo_cancelamento',
      'destino_endereco',
      'destino_lat',
      'destino_lng',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Set timestamp fields based on status
    if (body.status === 'aceita') {
      updateData['aceita_em'] = new Date().toISOString();
    } else if (body.status === 'em_andamento') {
      updateData['iniciada_em'] = new Date().toISOString();
    } else if (body.status === 'finalizada') {
      updateData['finalizada_em'] = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('corridas')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[PATCH /api/corridas/[id]] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao atualizar corrida', details: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Corrida não encontrada' },
        { status: 404 },
      );
    }

    const corrida = data as Record<string, unknown>;
    const profileIds: string[] = [];
    if (corrida.passageiro_id) profileIds.push(corrida.passageiro_id as string);
    if (corrida.motorista_id) profileIds.push(corrida.motorista_id as string);
    const profilesMap = await fetchProfiles(profileIds);

    const result = {
      ...corrida,
      passageiro: corrida.passageiro_id ? profilesMap[corrida.passageiro_id as string] || null : null,
      motorista: corrida.motorista_id ? profilesMap[corrida.motorista_id as string] || null : null,
    };

    return NextResponse.json({ corrida: result as Corrida });
  } catch (err) {
    console.error('[PATCH /api/corridas/[id]]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
