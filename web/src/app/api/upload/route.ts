import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Helper: create a Supabase server client from request cookies and return
 * the authenticated user (or null).
 */
async function getAuthUser() {
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
          // read-only in API routes
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

/**
 * POST /api/upload
 * Upload a photo to the Supabase Storage bucket 'fotos'.
 * Requires authentication. Files are stored under the authenticated user's id.
 * Accepts multipart/form-data with a `file` field.
 *
 * Returns: { url: string } — the public URL of the uploaded file.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado. Envie um campo "file".' },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo inválido: ${file.type}. Aceitos: ${allowedTypes.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo excede o tamanho máximo de 5MB' },
        { status: 400 },
      );
    }

    // Build a unique file path using authenticated user's id
    const userId = user.id;
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const sanitized = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 50);
    const filePath = `${userId}/${timestamp}_${sanitized}.${ext}`;

    // Convert File to ArrayBuffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage
      .from('fotos')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error(
        '[POST /api/upload] Supabase storage error:',
        error.message,
      );
      return NextResponse.json(
        {
          error: 'Erro ao fazer upload do arquivo',
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('fotos')
      .getPublicUrl(data.path);

    return NextResponse.json(
      { url: urlData.publicUrl, path: data.path },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/upload]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
