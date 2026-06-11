import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/notificacoes/subscribe
 *
 * Saves a push subscription (from the browser's PushManager) to the
 * `push_subscriptions` table in Supabase.
 *
 * Table DDL (run in Supabase SQL editor):
 * ─────────────────────────────────────────────────────────────
 *  CREATE TABLE IF NOT EXISTS push_subscriptions (
 *    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *    usuario_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *    endpoint    TEXT NOT NULL,
 *    p256dh      TEXT NOT NULL,
 *    auth_key    TEXT NOT NULL,
 *    created_at  TIMESTAMPTZ DEFAULT now(),
 *    updated_at  TIMESTAMPTZ DEFAULT now(),
 *    UNIQUE(endpoint)
 *  );
 *
 *  -- Enable RLS
 *  ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
 *
 *  -- Users can manage their own subscriptions
 *  CREATE POLICY "Users manage own subscriptions"
 *    ON push_subscriptions FOR ALL
 *    USING (auth.uid() = usuario_id);
 * ─────────────────────────────────────────────────────────────
 */
export async function POST(request: NextRequest) {
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
            // Read-only
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: endpoint, keys.p256dh, keys.auth' },
        { status: 400 },
      );
    }

    // Upsert subscription (one per endpoint)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          usuario_id: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth_key: keys.auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      )
      .select('id')
      .single();

    if (error) {
      console.error('[POST /api/notificacoes/subscribe] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao salvar inscrição push', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/notificacoes/subscribe]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/notificacoes/subscribe
 *
 * Returns push subscriptions for the authenticated user.
 */
export async function GET() {
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
            // Read-only
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, created_at, updated_at')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/notificacoes/subscribe] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar inscrições', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ subscriptions: data });
  } catch (err) {
    console.error('[GET /api/notificacoes/subscribe]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/notificacoes/subscribe
 *
 * Removes a push subscription by endpoint.
 * Body: { endpoint: string }
 */
export async function DELETE(request: NextRequest) {
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
            // Read-only
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Campo obrigatório: endpoint' },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('usuario_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[DELETE /api/notificacoes/subscribe] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao remover inscrição', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/notificacoes/subscribe]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
