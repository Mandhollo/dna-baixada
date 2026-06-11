import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';

/**
 * GET /api/profile
 * Fetch the current user's profile.
 * Query params: user_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Parâmetro user_id é obrigatório' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Perfil não encontrado' },
          { status: 404 },
        );
      }
      console.error('[GET /api/profile] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar perfil', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ profile: data as Profile });
  } catch (err) {
    console.error('[GET /api/profile]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/profile
 * Update the current user's profile.
 * Body: user_id (required), plus fields to update: nome, telefone, foto_url, etc.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, ...updates } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'Campo user_id é obrigatório' },
        { status: 400 },
      );
    }

    // Whitelist allowed update fields
    const allowedFields = [
      'nome',
      'telefone',
      'foto_url',
      'pontos',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualizar' },
        { status: 400 },
      );
    }

    updateData['updated_at'] = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user_id)
      .select('*')
      .single();

    if (error) {
      console.error('[PATCH /api/profile] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ profile: data as Profile });
  } catch (err) {
    console.error('[PATCH /api/profile]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
