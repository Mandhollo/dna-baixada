import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Notificacao, NotificacaoTipo } from '@/lib/supabase';

/**
 * GET /api/notificacoes
 * List notifications for the authenticated user.
 * Query params: tipo, lida, limit, offset
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

    let query = supabase
      .from('notificacoes')
      .select('*', { count: 'exact' })
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    const tipo = searchParams.get('tipo') as NotificacaoTipo | null;
    if (tipo) query = query.eq('tipo', tipo);

    const lida = searchParams.get('lida');
    if (lida === 'true') query = query.eq('lida', true);
    else if (lida === 'false') query = query.eq('lida', false);

    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/notificacoes] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar notificações', details: error.message },
        { status: 500 },
      );
    }

    // Count unread for convenience
    const { count: unreadCount } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .eq('lida', false);

    return NextResponse.json({
      notificacoes: data as Notificacao[],
      count,
      nao_lidas: unreadCount ?? 0,
    });
  } catch (err) {
    console.error('[GET /api/notificacoes]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notificacoes
 * Create a new notification (admin/system use).
 * Body: usuario_id, titulo, mensagem, tipo, link?, metadata?
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
            // No cookie writes
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    const required = ['usuario_id', 'titulo', 'mensagem', 'tipo'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório ausente: ${field}` },
          { status: 400 },
        );
      }
    }

    const insertData: Record<string, unknown> = {
      usuario_id: body.usuario_id,
      titulo: body.titulo,
      mensagem: body.mensagem,
      tipo: body.tipo,
      lida: false,
      link: body.link ?? null,
      metadata: body.metadata ?? null,
    };

    const { data, error } = await supabase
      .from('notificacoes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[POST /api/notificacoes] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao criar notificação', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ notificacao: data as Notificacao }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/notificacoes]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/notificacoes
 * Mark notifications as read.
 * Body: id (single) OR ids (array) — marks the given notifications as read.
 */
export async function PATCH(request: NextRequest) {
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
            // No cookie writes
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const now = new Date().toISOString();

    // Mark all as read
    if (body.marcar_todas === true) {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true, lida_em: now })
        .eq('usuario_id', user.id)
        .eq('lida', false);

      if (error) {
        console.error('[PATCH /api/notificacoes] Supabase error:', error.message);
        return NextResponse.json(
          { error: 'Erro ao marcar notificações como lidas', details: error.message },
          { status: 500 },
        );
      }

      return NextResponse.json({ message: 'Todas as notificações marcadas como lidas' });
    }

    // Mark specific notification(s) as read
    const ids: string[] = body.ids ?? (body.id ? [body.id] : []);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Forneça "id", "ids" ou "marcar_todas: true"' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: now })
      .in('id', ids)
      .eq('usuario_id', user.id)
      .select();

    if (error) {
      console.error('[PATCH /api/notificacoes] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao marcar notificações como lidas', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ notificacoes: data as Notificacao[] });
  } catch (err) {
    console.error('[PATCH /api/notificacoes]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
