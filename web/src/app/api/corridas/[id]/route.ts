import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Corrida, CorridaStatus } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Helper: create a Supabase server client from request cookies and return
 * the authenticated user (or null).
 */
async function getAuthUser() {
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
          // read-only in API routes
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

/**
 * Helper: fetch profiles by IDs to avoid RLS recursion from JOIN.
 */
async function fetchProfiles(
  supabase: Awaited<ReturnType<typeof getAuthUser>>['supabase'],
  ids: string[],
) {
  if (ids.length === 0)
    return {} as Record<
      string,
      { id: string; nome: string; foto_url: string | null; telefone: string | null }
    >;
  const { data } = await supabase
    .from('profiles')
    .select('id, nome, foto_url, telefone')
    .in('id', ids);
  const map: Record<
    string,
    { id: string; nome: string; foto_url: string | null; telefone: string | null }
  > = {};
  if (data)
    data.forEach((p: { id: string }) => {
      map[p.id] = p as typeof map[string];
    });
  return map;
}

/**
 * GET /api/corridas/[id]
 * Fetch a single corrida by ID. Requires authentication.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

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

    // Verify the user is related to this corrida
    const isPassageiro = corrida.passageiro_id === user.id;
    const isMotorista = corrida.motorista_id === user.id;
    if (!isPassageiro && !isMotorista) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const profileIds: string[] = [];
    if (corrida.passageiro_id) profileIds.push(corrida.passageiro_id as string);
    if (corrida.motorista_id) profileIds.push(corrida.motorista_id as string);
    const profilesMap = await fetchProfiles(supabase, profileIds);

    const result = {
      ...corrida,
      passageiro: corrida.passageiro_id
        ? profilesMap[corrida.passageiro_id as string] || null
        : null,
      motorista: corrida.motorista_id
        ? profilesMap[corrida.motorista_id as string] || null
        : null,
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
 * Requires authentication. Only the passageiro or motorista of the corrida
 * may update it.
 * Body: status, motorista_id, preco_final, forma_pagamento, etc.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    // First fetch the corrida to verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('corridas')
      .select('passageiro_id, motorista_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Corrida não encontrada' },
        { status: 404 },
      );
    }

    const corrida = existing as Record<string, unknown>;
    const isPassageiro = corrida.passageiro_id === user.id;
    const isMotorista = corrida.motorista_id === user.id;
    if (!isPassageiro && !isMotorista) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();

    // Validate status transition if status is provided
    const validStatuses: CorridaStatus[] = [
      'aguardando',
      'aceita',
      'motorista_chegou',
      'em_andamento',
      'finalizada',
      'cancelada',
    ];

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          error: `Status inválido. Valores aceitos: ${validStatuses.join(', ')}`,
        },
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
      console.error(
        '[PATCH /api/corridas/[id]] Supabase error:',
        error.message,
      );
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

    const updated = data as Record<string, unknown>;
    const profileIds: string[] = [];
    if (updated.passageiro_id) profileIds.push(updated.passageiro_id as string);
    if (updated.motorista_id) profileIds.push(updated.motorista_id as string);
    const profilesMap = await fetchProfiles(supabase, profileIds);

    const result = {
      ...updated,
      passageiro: updated.passageiro_id
        ? profilesMap[updated.passageiro_id as string] || null
        : null,
      motorista: updated.motorista_id
        ? profilesMap[updated.motorista_id as string] || null
        : null,
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
