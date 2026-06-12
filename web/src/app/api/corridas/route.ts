import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Corrida, CorridaTipo, CorridaStatus, FormaPagamento } from '@/lib/supabase';

// ════════════════════════════════════════════════════════════
// Server-side price calculation (prevents client tampering)
// ════════════════════════════════════════════════════════════

const PRICE_TABLE: Record<string, { fixo: number; km: number }> = {
  urbana: { fixo: 15, km: 3.50 },
  executivo: { fixo: 40, km: 5.00 },
  transfer_aeroporto: { fixo: 600, km: 0 },
  transfer_rodoviaria: { fixo: 80, km: 2.50 },
  transfer_hotel: { fixo: 40, km: 3.00 },
  transfer_cruzeiro: { fixo: 50, km: 3.00 },
  city_tour: { fixo: 400, km: 0 },
  passeio_turistico: { fixo: 200, km: 2.00 },
};

function recalcPrice(
  tipo: string,
  origemLat?: number | null,
  origemLng?: number | null,
  destinoLat?: number | null,
  destinoLng?: number | null,
  passageiros: number = 1,
): { preco: number; distancia?: number } {
  const config = PRICE_TABLE[tipo];
  if (!config) return { preco: 0 };

  let distancia: number | undefined;
  if (origemLat && origemLng && destinoLat && destinoLng) {
    const R = 6371;
    const dLat = ((destinoLat - origemLat) * Math.PI) / 180;
    const dLon = ((destinoLng - origemLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((origemLat * Math.PI) / 180) *
        Math.cos((destinoLat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    distancia = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }

  const distKm = distancia ?? 10;
  let preco = config.fixo + config.km * distKm;
  if (passageiros > 4) preco *= 1.3;

  return { preco: Math.round(preco * 100) / 100, distancia };
}

// ════════════════════════════════════════════════════════════
// Auth helper
// ════════════════════════════════════════════════════════════

/**
 * Create a Supabase server client from request cookies and return
 * the authenticated user (or null). Uses the anon key + cookie session
 * so RLS policies are enforced per-user.
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
 * GET /api/corridas
 * List corridas with optional query filters.
 * Requires authentication. Only returns corridas where the user is the
 * passageiro or the motorista, unless no user-specific filter is needed
 * (admin use-case handled elsewhere).
 *
 * Query params: status, tipo, passageiro_id, motorista_id, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

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

    // Security: filter by user unless admin. If passageiro_id/motorista_id
    // are provided, ensure they match the authenticated user.
    const passageiroId = searchParams.get('passageiro_id');
    const motoristaId = searchParams.get('motorista_id');

    // Check if user is admin (via profiles table)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const isAdmin = userProfile?.role === 'admin';

    if (!isAdmin) {
      // Non-admin: only see their own corridas
      if (passageiroId && passageiroId !== user.id && motoristaId && motoristaId !== user.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }
      // Force filter to only this user's corridas
      query = query.or(`passageiro_id.eq.${user.id},motorista_id.eq.${user.id}`);
    }

    if (passageiroId) query = query.eq('passageiro_id', passageiroId);

    const motoristaIdFilter = searchParams.get('motorista_id');
    if (motoristaIdFilter) query = query.eq('motorista_id', motoristaIdFilter);

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
      if (c.motorista_id) profileIds.add(c.motorista_id!);
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
      motorista: c.motorista_id ? profilesMap[c.motorista_id!] || null : null,
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
 * Requires authentication. passageiro_id is forced to the authenticated user's id.
 * Body: tipo, origem_endereco, origem_lat, origem_lng, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Required fields (passageiro_id no longer required from body — comes from auth)
    const required = ['tipo', 'origem_endereco'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório ausente: ${field}` },
          { status: 400 },
        );
      }
    }

    // Recalculate price server-side to prevent tampering
    const priceResult = recalcPrice(body.tipo, body.origem_lat, body.origem_lng, body.destino_lat, body.destino_lng, body.passageiros ?? 1);
    const insertData: Record<string, unknown> = {
      passageiro_id: user.id, // force to authenticated user
      tipo: body.tipo,
      status: 'aguardando',
      origem_endereco: body.origem_endereco,
      origem_lat: body.origem_lat ?? null,
      origem_lng: body.origem_lng ?? null,
      destino_endereco: body.destino_endereco ?? null,
      destino_lat: body.destino_lat ?? null,
      destino_lng: body.destino_lng ?? null,
      preco_estimado: priceResult.preco,
      forma_pagamento: body.forma_pagamento ?? null,
      distancia_km: priceResult.distancia ?? null,
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
