import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/profile
 * Fetch the current authenticated user's profile.
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
            // Read-only route — no cookie writes needed
          },
        },
      },
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
      }
      console.error('[GET /api/profile] Supabase error:', error.message);
      return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error('[GET /api/profile]', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/profile
 * Update the current authenticated user's profile.
 * Body: fields to update: nome, telefone, foto_url, etc.
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
            // Not updating cookies here
          },
        },
      },
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { ...updates } = body;

    // Whitelist allowed update fields
    const allowedFields = ['nome', 'telefone', 'foto_url'];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 });
    }

    updateData['updated_at'] = new Date().toISOString();

    // Use authenticated user's ID — cannot modify other users
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('[PATCH /api/profile] Supabase error:', error.message);
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error('[PATCH /api/profile]', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
