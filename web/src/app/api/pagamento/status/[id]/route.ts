import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkPaymentStatus } from '@/lib/payment';

/**
 * GET /api/pagamento/status/[id]
 *
 * Checks the current status of a Mercado Pago payment by its ID.
 * Returns the status so the client can poll for confirmation.
 *
 * :id = Mercado Pago payment ID (number)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paymentId = parseInt(id, 10);

    if (isNaN(paymentId)) {
      return NextResponse.json(
        { error: 'ID de pagamento inválido' },
        { status: 400 }
      );
    }

    // ── Auth check ──
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // ── Verify user owns a transação with this payment_id ──
    const { data: tx, error: txError } = await supabase
      .from('transacoes')
      .select('id, usuario_id, status, corrida_id, metadata')
      .eq('pix_txid', String(paymentId))
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (txError || !tx) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // If already approved in our DB, return immediately
    if (tx.status === 'concluido') {
      return NextResponse.json({
        status: 'approved',
        transacao_id: tx.id,
        corrida_id: tx.corrida_id,
      });
    }

    // ── Check payment status via Mercado Pago ──
    const mpStatus = await checkPaymentStatus(paymentId);

    // ── If approved, update our DB ──
    if (mpStatus.status === 'approved') {
      const now = new Date().toISOString();

      // Update transação
      await supabase
        .from('transacoes')
        .update({
          status: 'concluido',
          pix_pago_em: now,
          metadata: {
            ...(tx.metadata as Record<string, unknown> | null),
            mercadopago_status: 'approved',
            approved_at: now,
          },
        })
        .eq('id', tx.id);

      // Update corrida status to confirmada
      if (tx.corrida_id) {
        await supabase
          .from('corridas')
          .update({ status: 'aguardando' }) // stays in aguardando to be picked up by motorista
          .eq('id', tx.corrida_id);
      }
    }

    return NextResponse.json({
      status: mpStatus.status,
      status_detail: mpStatus.status_detail,
      transacao_id: tx.id,
      corrida_id: tx.corrida_id,
      date_approved: mpStatus.date_approved,
    });
  } catch (err) {
    console.error('[GET /api/pagamento/status/[id]]', err);
    const message =
      err instanceof Error ? err.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
