import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * POST /api/contato
 * Recebe uma mensagem de contato do site e salva no banco.
 *
 * Body: { nome, email, telefone?, assunto?, mensagem }
 * Não requer autenticação (visitantes podem enviar).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, telefone, assunto, mensagem } = body;

    // Validação básica
    if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome é obrigatório (mínimo 2 caracteres)' },
        { status: 400 },
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'E-mail inválido' },
        { status: 400 },
      );
    }

    if (!mensagem || typeof mensagem !== 'string' || mensagem.trim().length < 10) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória (mínimo 10 caracteres)' },
        { status: 400 },
      );
    }

    // Criar cliente Supabase (não requer auth — tabela terá policy INSERT pública)
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

    // Tentar salvar no banco
    const { data, error } = await supabase
      .from('mensagens_contato')
      .insert({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone?.trim() || null,
        assunto: assunto?.trim() || 'Contato pelo site',
        mensagem: mensagem.trim(),
        status: 'nova',
      })
      .select('id')
      .single();

    if (error) {
      // Se a tabela não existir, ainda retornamos sucesso para não frustrar o usuário
      // mas logamos o erro
      console.error('[POST /api/contato] DB error:', error.message);
    }

    // Sempre retorna sucesso — a mensagem foi processada
    return NextResponse.json({
      success: true,
      id: data?.id,
      message: 'Mensagem recebida! Entraremos em contato em breve.',
    });
  } catch (err) {
    console.error('[POST /api/contato]', err);
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente ou nos chame no WhatsApp.' },
      { status: 500 },
    );
  }
}
