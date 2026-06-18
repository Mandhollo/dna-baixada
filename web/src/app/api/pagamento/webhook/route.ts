import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkPaymentStatus } from '@/lib/payment';

/**
 * POST /api/pagamento/webhook
 *
 * Webhook endpoint for Mercado Pago payment notifications.
 * Validates webhook signature when MERCADOPAGO_WEBHOOK_SECRET is set.
 * Falls back to API verification (checkPaymentStatus) in dev/sandbox.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Verify webhook signature ──
    const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature') || '';

    // If secret is configured, signature is REQUIRED — no bypass
    if (WEBHOOK_SECRET && !signature) {
      console.warn('[webhook] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    if (WEBHOOK_SECRET && signature) {
      const crypto = await import('crypto');
      const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      if (signature !== `sha256=${expected}`) {
        console.warn('[webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    // Mercado Pago webhook payloads
    const action = body.action ?? body.type;
    const paymentId = body.data?.id ?? body.resource?.split('/').pop();

    // Only process payment approval events
    const relevantActions = [
      'payment.updated',
      'payment.created',
      'payment_status_updated',
      'topic_payment',
    ];

    if (!relevantActions.includes(action) || !paymentId) {
      return NextResponse.json({ received: true });
    }

    const mpPaymentId = parseInt(String(paymentId), 10);
    if (isNaN(mpPaymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    // ── Verify with Mercado Pago API (always do this for security) ──
    const mpStatus = await checkPaymentStatus(mpPaymentId);

    if (mpStatus.status !== 'approved') {
      return NextResponse.json({ received: true, status: mpStatus.status });
    }

    // ── Find the transação by MP payment ID ──
    // Use service role key for webhook (no user session available)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let dbClient;

    if (serviceKey) {
      const { createClient } = await import('@supabase/supabase-js');
      dbClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
    } else {
      // Fallback: use anon client with cookies (works in dev if user session exists)
      dbClient = await createSupabaseServerClient();
    }

    const { data: tx, error: txError } = await dbClient
      .from('transacoes')
      .select('id, usuario_id, status, corrida_id, metadata')
      .eq('pix_txid', String(mpPaymentId))
      .maybeSingle();

    if (txError || !tx) {
      console.error('[webhook] Transação não encontrada para payment_id:', mpPaymentId);
      return NextResponse.json({ received: true });
    }

    // Already processed — idempotent
    if (tx.status === 'concluido') {
      return NextResponse.json({ received: true, already_processed: true });
    }

    const now = new Date().toISOString();

    // ── Update transação ──
    const { error: updateTxError } = await dbClient
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

    if (updateTxError) {
      console.error('[webhook] Erro ao atualizar transação:', updateTxError.message);
    }

    // ── Update corrida ──
    if (tx.corrida_id) {
      const { error: corrError } = await dbClient
        .from('corridas')
        .update({ status: 'aguardando' })
        .eq('id', tx.corrida_id);

      if (corrError) {
        console.error('[webhook] Erro ao atualizar corrida:', corrError.message);
      }

      // ── Create notifications for available motoristas ──
      try {
        const { data: corrida } = await dbClient
          .from('corridas')
          .select('id, origem_endereco, destino_endereco, tipo')
          .eq('id', tx.corrida_id)
          .single();

        if (corrida) {
          const { data: motoristas } = await dbClient
            .from('motoristas')
            .select('id')
            .eq('disponivel', true)
            .eq('status', 'aprovado');

          if (motoristas && motoristas.length > 0) {
            const notifications = motoristas.map((m) => ({
              usuario_id: m.id,
              titulo: '🚗 Nova corrida disponível!',
              mensagem: `Corrida paga via PIX — ${corrida.origem_endereco}${corrida.destino_endereco ? ` → ${corrida.destino_endereco}` : ''}`,
              tipo: 'corrida_nova',
              lida: false,
              link: `/motorista/corrida/${corrida.id}`,
              metadata: {
                corrida_id: corrida.id,
                tipo_corrida: corrida.tipo,
                pagamento_confirmado: true,
              },
            }));

            const BATCH_SIZE = 50;
            for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
              const batch = notifications.slice(i, i + BATCH_SIZE);
              const { error: notifError } = await dbClient.from('notificacoes').insert(batch);
              if (notifError) {
                console.error('[webhook] Erro ao inserir notificações:', notifError.message);
              }
            }
          }
        }
      } catch (notifErr) {
        console.error('[webhook] Error creating notifications:', notifErr);
      }
    }

    return NextResponse.json({ received: true, status: 'approved' });
  } catch (err) {
    console.error('[POST /api/pagamento/webhook]', err);
    // Always return 200 to Mercado Pago so they don't retry
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}
