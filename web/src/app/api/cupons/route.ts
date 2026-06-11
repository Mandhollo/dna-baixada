import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Cupom } from '@/lib/supabase';

/**
 * GET /api/cupons
 * Validate a coupon code.
 * Query params: codigo (required), valor_corrida (optional — for min-value check)
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
    const codigo = searchParams.get('codigo');

    if (!codigo) {
      return NextResponse.json(
        { error: 'Parâmetro "codigo" é obrigatório' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('codigo', codigo)
      .eq('ativo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Cupom não encontrado ou inválido', valido: false },
          { status: 404 },
        );
      }
      console.error('[GET /api/cupons] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar cupom', details: error.message },
        { status: 500 },
      );
    }

    const cupom = data as Cupom;
    const now = new Date();

    // Validate expiry
    if (cupom.valido_ate && new Date(cupom.valido_ate) < now) {
      return NextResponse.json(
        { error: 'Cupom expirado', valido: false },
        { status: 400 },
      );
    }

    // Validate start date
    if (cupom.valido_de && new Date(cupom.valido_de) > now) {
      return NextResponse.json(
        { error: 'Cupom ainda não está disponível', valido: false },
        { status: 400 },
      );
    }

    // Validate usage limit
    if (cupom.usos_maximo > 0 && cupom.usos_contabilizados >= cupom.usos_maximo) {
      return NextResponse.json(
        { error: 'Cupom esgotado', valido: false },
        { status: 400 },
      );
    }

    // Validate minimum ride value
    const valorCorrida = searchParams.get('valor_corrida')
      ? parseFloat(searchParams.get('valor_corrida')!)
      : null;

    if (valorCorrida !== null && cupom.valor_minimo_corrida && valorCorrida < cupom.valor_minimo_corrida) {
      return NextResponse.json(
        { error: `Valor mínimo da corrida: R$ ${cupom.valor_minimo_corrida.toFixed(2)}`, valido: false },
        { status: 400 },
      );
    }

    // Check if user already used this coupon
    const { count: usoCount } = await supabase
      .from('cupons_usados')
      .select('*', { count: 'exact', head: true })
      .eq('cupom_id', cupom.id)
      .eq('usuario_id', user.id);

    if (usoCount && usoCount > 0) {
      return NextResponse.json(
        { error: 'Você já utilizou este cupom', valido: false },
        { status: 400 },
      );
    }

    // Calculate discount
    let descontoCalculado = 0;
    if (cupom.tipo_desconto === 'percentual') {
      descontoCalculado = valorCorrida
        ? Math.round((valorCorrida * cupom.valor_desconto / 100) * 100) / 100
        : 0;
    } else {
      descontoCalculado = cupom.valor_desconto;
    }

    return NextResponse.json({
      valido: true,
      cupom,
      desconto_calculado: descontoCalculado,
    });
  } catch (err) {
    console.error('[GET /api/cupons]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
