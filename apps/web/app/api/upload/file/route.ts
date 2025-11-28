import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Obtener cookies para autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener datos del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const kind = formData.get('kind') as string;
    const tareaId = formData.get('tareaId') as string | null;
    const obraId = formData.get('obraId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Archivo requerido' },
        { status: 400 }
      );
    }

    if (!kind) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo (kind) requerido' },
        { status: 400 }
      );
    }

    // Validar que se proporcione tareaId o obraId
    if (!tareaId && !obraId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere tareaId o obraId' },
        { status: 400 }
      );
    }

    // Crear cliente de servicio para operaciones de almacenamiento
    const supabaseService = createServiceSupabaseClient();

    // Determinar el bucket según el tipo
    let bucket = 'evidencias';
    if (kind === 'video_final' || kind === 'video') {
      bucket = 'videos';
    } else if (kind === 'foto' || kind === 'evidencia_final') {
      bucket = 'evidencias';
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError || !uploadData) {
      console.error('[UPLOAD_FILE] Error subiendo archivo:', uploadError);
      return NextResponse.json(
        {
          success: false,
          error: uploadError?.message || 'Error al subir el archivo',
        },
        { status: 500 }
      );
    }

    // Obtener URL pública del archivo
    const {
      data: { publicUrl },
    } = supabaseService.storage.from(bucket).getPublicUrl(filePath);

    // Si hay tareaId, crear o buscar un evento para asociar el media
    let eventoId: string | null = null;

    if (tareaId) {
      try {
        // Buscar si existe un evento reciente para esta tarea (últimas 5 minutos)
        const cincoMinutosAtras = new Date();
        cincoMinutosAtras.setMinutes(cincoMinutosAtras.getMinutes() - 5);

        const { data: eventoExistente } = await supabaseService
          .from('eventos')
          .select('id')
          .eq('tarea_id', tareaId)
          .gte('created_at', cincoMinutosAtras.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (eventoExistente) {
          eventoId = eventoExistente.id;
        } else {
          // Crear un nuevo evento para esta tarea
          // Obtener obra_id de la tarea si no se proporcionó
          let obraIdFinal = obraId;
          if (!obraIdFinal && tareaId) {
            const { data: tareaData } = await supabaseService
              .from('tareas')
              .select('obra_id')
              .eq('id', tareaId)
              .maybeSingle();

            if (tareaData?.obra_id) {
              obraIdFinal = tareaData.obra_id;
            }
          }

          // Crear evento
          const { data: nuevoEvento, error: eventoError } = await supabaseService
            .from('eventos')
            .insert({
              tarea_id: tareaId,
              nuevo_estado: 'en_ejecucion', // Estado por defecto para evidencias
              actor_name: user.email || user.id || 'Socio',
              actor_role: 'SOCIO',
              actor_method: 'upload',
              notas: `Evidencia subida: ${kind}`,
              checklist: [] as any,
              has_nc: false,
            })
            .select('id')
            .single();

          if (eventoError || !nuevoEvento) {
            console.error('[UPLOAD_FILE] Error creando evento:', eventoError);
            // Continuar sin evento si falla
          } else {
            eventoId = nuevoEvento.id;
          }
        }
      } catch (eventoErr) {
        console.error('[UPLOAD_FILE] Error manejando evento:', eventoErr);
        // Continuar sin evento si falla
      }
    }

    // Guardar registro en la tabla media
    if (eventoId) {
      // Obtener el índice máximo para este evento
      const { data: mediaExistente } = await supabaseService
        .from('media')
        .select('idx')
        .eq('evento_id', eventoId)
        .order('idx', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nuevoIdx = mediaExistente ? (mediaExistente.idx || 0) + 1 : 0;

      const { error: mediaError } = await supabaseService.from('media').insert({
        evento_id: eventoId,
        path: filePath,
        kind: kind,
        idx: nuevoIdx,
      });

      if (mediaError) {
        console.error('[UPLOAD_FILE] Error guardando en media:', mediaError);
        // No fallar si no se puede guardar en media, el archivo ya está subido
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      eventoId: eventoId,
    });
  } catch (error) {
    console.error('[UPLOAD_FILE_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir el archivo',
      },
      { status: 500 }
    );
  }
}

