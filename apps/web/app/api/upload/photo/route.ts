import { NextRequest, NextResponse } from 'next/server';
import { uploadPhoto } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataUrl } = body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'dataUrl es requerido' },
        { status: 400 }
      );
    }

    // Validar que sea un dataUrl válido
    if (!dataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'El dataUrl debe ser una imagen válida' },
        { status: 400 }
      );
    }

    // Subir usando la función del servidor
    const { path } = await uploadPhoto(dataUrl);

    return NextResponse.json({
      success: true,
      path,
    });

  } catch (error) {
    console.error('[UPLOAD_PHOTO_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir la imagen',
      },
      { status: 500 }
    );
  }
}

