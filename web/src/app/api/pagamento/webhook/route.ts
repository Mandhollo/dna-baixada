import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkPaymentStatus } from '@/lib/payment';

/**
 * POST /api/pagamento/webhook
 *
 * Webhook endpoint for Mercado Pago payment notifications.
 * When a PIX payment is approved, updates the transação and corrida
 * in Supabase and creates notifications for motoristas.
 *
 * Mercado Pago sends:
 *  { action: "payment.updated", data: { id: "<payment_id>" } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
      // Acknowledge but ignore
      return NextResponse.json({ received: true });
    }

    const mpPaymentId = parseInt(String(paymentId), 10);
    if (isNaN(mpPaymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    // ── Check payment status with Mercado Pago ──
    const mpStatus = await checkPaymentStatus(mpPaymentId);

    if (mpStatus.status !== 'approved') {
      // Not approved yet — just acknowledge
      return NextResponse.json({ received: true, status: mpStatus.status });
    }

    // ── Find the transação by MP payment ID ──
    const supabase = await createSupabaseServerClient();
    const { data: tx, error: txError } = await supabase
      .from('transacoes')
      .select('id, usuario_id, status, corrida_id, metadata')
      .eq('pix_txid', String(mpPaymentId))
      .maybeSingle();

    if (txError || !tx) {
      console.error(
        '[webhook] Transação não encontrada para payment_id:',
        mpPaymentId
      );
      return NextResponse.json({ received: true });
    }

    // Already processed — idempotent
    if (tx.status === 'concluido') {
      return NextResponse.json({ received: true, already_processed: true });
    }

    const now = new Date().toISOString();

    // ── Update transação ──
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

    // ── Update corrida ──
    if (tx.corrida_id) {
      await supabase
        .from('corridas')
        .update({ status: 'aguardando' })
        .eq('id', tx.corrida_id);

      // ── Create notifications for available motoristas ──
      try {
        // Fetch corrida details for notification
        const { data: corrida } = await supabase
          .from('corridas')
          .select('id, origem_endereco, destino_endereco, tipo')
          .eq('id', tx.corrida_id)
          .single();

        if (corrida) {
          // Find available motoristas
          const { data: motoristas } = await supabase
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

            // Insert in batches to avoid payload too large
            const BATCH_SIZE = 50;
            for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
              const batch = notifications.slice(i, i + BATCH_SIZE);
              await supabase.from('notificacoes').insert(batch);
            }

            // ── Send push notifications to subscribed motoristas ──
            try {
              const motoristaIds = motoristas.map((m) => m.id);

              const { data: pushSubs } = await supabase
                .from('push_subscriptions')
                .select('endpoint, p256dh, auth_key')
                .in('usuario_id', motoristaIds);

              if (pushSubs && pushSubs.length > 0) {
                // Trigger push via service worker (requires VAPID private key on server).
                // For now, log the count — real push delivery needs a push service worker
                // and VAPID signing (web-push library).
                console.info(
                  `[webhook] ${pushSubs.length} push subscriptions found for motoristas. ` +
                  'Configure VAPID keys + web-push to deliver real push.',
                );

                // Store push payloads for later delivery (or use web-push directly)
                await supabase.from('push_queue').upsert(
                  pushSubs.map((sub) => ({
                    endpoint: sub.endpoint,
                    p256dh: sub.p256dh,
                    auth_key: sub.auth_key,
                    payload: JSON.stringify({
                      title: '🚗 Nova corrida disponível!',
                      body: `Corrida paga via PIX — ${corrida.origem_endereco}${corrida.destino_endereco ? ` → ${corrida.destino_endereco}` : ''}`,
                      data: {
                        link: `/motorista/corrida/${corrida.id}`,
                        corrida_id: corrida.id,
                      },
                    }),
                    status: 'pending',
                    created_at: new Date().toISOString(),
                  })),
                  { onConflict: 'endpoint' },
                ).then(({ error: qErr }) => {
                  if (qErr) {
                    console.warn('[webhook] push_queue write skipped (table may not exist):', qErr.message);
                  }
                });
              }
            } catch (pushErr) {
              console.warn('[webhook] Push notification step skipped:', pushErr);
            }
          }
        }
      } catch (notifErr) {
        // Don't fail the webhook if notification creation fails
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
