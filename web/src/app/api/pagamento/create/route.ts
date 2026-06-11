import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createPixPayment } from '@/lib/payment';

/**
 * POST /api/pagamento/create
 *
 * Creates a PIX payment via Mercado Pago, records a transação in Supabase,
 * and returns the QR code data for the client to display.
 *
 * Body: { corrida_id, email, cpf, nome? }
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // ── Parse body ──
    const body = await request.json();
    const { corrida_id, email, cpf, nome } = body;

    if (!corrida_id) {
      return NextResponse.json(
        { error: 'Campo obrigatório ausente: corrida_id' },
        { status: 400 }
      );
    }
    if (!email) {
      return NextResponse.json(
        { error: 'Campo obrigatório ausente: email' },
        { status: 400 }
      );
    }
    if (!cpf) {
      return NextResponse.json(
        { error: 'Campo obrigatório ausente: cpf' },
        { status: 400 }
      );
    }

    // ── Fetch corrida to get value ──
    const { data: corrida, error: corridaError } = await supabase
      .from('corridas')
      .select('id, preco_estimado, preco_final, status, passageiro_id')
      .eq('id', corrida_id)
      .single();

    if (corridaError || !corrida) {
      return NextResponse.json(
        { error: 'Corrida não encontrada', details: corridaError?.message },
        { status: 404 }
      );
    }

    // Verify user owns this corrida
    if (corrida.passageiro_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const amount = corrida.preco_final ?? corrida.preco_estimado ?? 0;
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Valor da corrida inválido' },
        { status: 400 }
      );
    }

    // ── Check if there's already a pending PIX transação for this corrida ──
    const { data: existingTx } = await supabase
      .from('transacoes')
      .select('id, pix_txid, status, metadata')
      .eq('corrida_id', corrida_id)
      .eq('forma_pagamento', 'pix')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If there's a pending transação with a valid MP payment_id, return it
    if (existingTx?.metadata && typeof existingTx.metadata === 'object') {
      const meta = existingTx.metadata as Record<string, unknown>;
      if (meta.mercadopago_payment_id && meta.qr_code_copy) {
        return NextResponse.json({
          qr_code: meta.qr_code_base64 ?? null,
          copy_paste: meta.qr_code_copy as string,
          payment_id: meta.mercadopago_payment_id as number,
          transacao_id: existingTx.id,
          amount,
        });
      }
    }

    // ── Create PIX payment via Mercado Pago ──
    const description = `Corrida DNA Baixada #${corrida_id.substring(0, 8)}`;
    const pixResult = await createPixPayment({
      amount,
      description,
      email,
      cpf,
      nome,
      externalReference: corrida_id,
    });

    // ── Record transação in Supabase ──
    const { data: tx, error: txError } = await supabase
      .from('transacoes')
      .insert({
        corrida_id,
        usuario_id: user.id,
        tipo: 'pagamento_corrida',
        status: 'pendente',
        valor_bruto: amount,
        taxa_plataforma: 0,
        valor_liquido: amount,
        forma_pagamento: 'pix',
        pix_qrcode: pixResult.qr_code_base64,
        pix_copiaecola: pixResult.qr_code_copy,
        pix_txid: String(pixResult.payment_id),
        descricao: description,
        metadata: {
          mercadopago_payment_id: pixResult.payment_id,
          qr_code_base64: pixResult.qr_code_base64,
          qr_code_copy: pixResult.qr_code_copy,
          mercadopago_status: pixResult.status,
        },
      })
      .select('id')
      .single();

    if (txError) {
      console.error(
        '[POST /api/pagamento/create] Supabase insert error:',
        txError.message
      );
      return NextResponse.json(
        { error: 'Erro ao registrar transação', details: txError.message },
        { status: 500 }
      );
    }

    // ── Update corrida status ──
    await supabase
      .from('corridas')
      .update({ forma_pagamento: 'pix' })
      .eq('id', corrida_id);

    return NextResponse.json({
      qr_code: pixResult.qr_code_base64,
      copy_paste: pixResult.qr_code_copy,
      payment_id: pixResult.payment_id,
      transacao_id: tx.id,
      amount,
    });
  } catch (err) {
    console.error('[POST /api/pagamento/create]', err);
    const message =
      err instanceof Error ? err.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
