import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/corridas/[id]/location
 *
 * Returns a simulated driver location for the ride.
 * In production, this would come from the driver's real GPS via
 * a real-time channel or a location tracking service.
 *
 * For simulation, we compute a position that moves along the
 * origin → destination route based on time elapsed since the
 * ride was started (iniciada_em).
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    // Auth check - require authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Fetch the corrida to get route info and start time
    const { data: corrida, error } = await supabase
      .from('corridas')
      .select(
        'id, status, origem_lat, origem_lng, destino_lat, destino_lng, distancia_km, duracao_minutos, iniciada_em',
      )
      .eq('id', id)
      .single();

    if (error || !corrida) {
      return NextResponse.json(
        { error: 'Corrida não encontrada' },
        { status: 404 },
      );
    }

    // If ride is not in progress, return origin or null
    if (corrida.status !== 'em_andamento') {
      if (corrida.status === 'aceita' && corrida.origem_lat && corrida.origem_lng) {
        return NextResponse.json({
          lat: corrida.origem_lat,
          lng: corrida.origem_lng,
          heading: 0,
          speed: 0,
          timestamp: new Date().toISOString(),
          status: corrida.status,
        });
      }
      return NextResponse.json(
        { error: 'Corrida não está em andamento', status: corrida.status },
        { status: 400 },
      );
    }

    // Validate coordinates
    if (
      !corrida.origem_lat ||
      !corrida.origem_lng ||
      !corrida.destino_lat ||
      !corrida.destino_lng
    ) {
      return NextResponse.json(
        { error: 'Coordenadas da corrida incompletas' },
        { status: 400 },
      );
    }

    // Calculate progress based on time elapsed since ride started
    const startedAt = corrida.iniciada_em
      ? new Date(corrida.iniciada_em).getTime()
      : Date.now();

    const elapsedMs = Date.now() - startedAt;

    // Use estimated duration or default 15 min for simulation
    const totalDurationMs = (corrida.duracao_minutos ?? 15) * 60 * 1000;

    // Progress is capped at 1.0 and uses a slight sinusoidal ease for realism
    const rawProgress = Math.min(elapsedMs / totalDurationMs, 1);
    // Smooth easing: slow start, steady middle, slow end
    const progress =
      rawProgress < 0.5
        ? 2 * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

    // Interpolate position
    const lat =
      corrida.origem_lat +
      (corrida.destino_lat - corrida.origem_lat) * progress;
    const lng =
      corrida.origem_lng +
      (corrida.destino_lng - corrida.origem_lng) * progress;

    // Compute heading (direction of travel in degrees)
    const dLat = corrida.destino_lat - corrida.origem_lat;
    const dLng = corrida.destino_lng - corrida.origem_lng;
    const heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

    // Simulated speed (30-60 km/h with some variation)
    const baseSpeed = 40;
    const speedVariation = Math.sin(Date.now() / 5000) * 15;
    const speed = Math.round(
      (rawProgress < 1 ? baseSpeed + speedVariation : 0) * 10,
    ) / 10;

    // Remaining ETA in minutes
    const remainingProgress = 1 - rawProgress;
    const etaMinutes = Math.max(
      Math.round(remainingProgress * (corrida.duracao_minutos ?? 15)),
      1,
    );

    return NextResponse.json({
      lat: Math.round(lat * 1000000) / 1000000,
      lng: Math.round(lng * 1000000) / 1000000,
      heading: Math.round(heading * 10) / 10,
      speed,
      timestamp: new Date().toISOString(),
      progress: Math.round(rawProgress * 100) / 100,
      etaMinutes,
      status: corrida.status,
    });
  } catch (err) {
    console.error('[GET /api/corridas/[id]/location]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
