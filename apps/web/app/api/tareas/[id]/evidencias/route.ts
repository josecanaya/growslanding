import { NextRequest, NextResponse } from 'next/server';
import { TareaService } from '../../../../../lib/services';
import { CrearEvidenciaSchema } from '../../../../../lib/schemas';
import { PermisosService } from '../../../../../lib/services';
import { prisma } from '@/lib/prisma';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizacionId = request.headers.get('x-organizacion-id');
    
    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const evidenciasCombinadas: any[] = [];

    // 1. Obtener evidencias de Supabase (tabla media a través de eventos)
    try {
      // Obtener eventos de la tarea
      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('id, created_at, actor_name')
        .eq('tarea_id', id)
        .order('created_at', { ascending: false });

      if (!eventosError && eventos && eventos.length > 0) {
        const eventoIds = eventos.map(e => e.id);
        
        // Obtener media de esos eventos
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .select('id, path, kind, idx, created_at, evento_id')
          .in('evento_id', eventoIds)
          .order('created_at', { ascending: false });

        if (!mediaError && mediaData) {
          // Obtener URLs públicas de Storage
          for (const media of mediaData) {
            const evento = eventos.find(e => e.id === media.evento_id);
            const bucket = media.kind === 'video_final' || media.kind === 'video' ? 'videos' : 'evidencias';
            
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(media.path);

            evidenciasCombinadas.push({
              id: media.id,
              tarea_id: id,
              tipo: media.kind === 'evidencia_final' ? 'evidencia_final' : 
                    media.kind === 'evidencia_parcial' ? 'evidencia_parcial' :
                    media.kind === 'video_final' ? 'video_final' : 'evidencia_parcial',
              archivo_path: media.path,
              url: publicUrl,
              descripcion: `Evidencia ${media.kind}`,
              subido_por: evento?.actor_name || 'Socio',
              subido_por_tipo: 'SOCIO',
              created_at: media.created_at,
              source: 'supabase',
            });
          }
        }
      }
    } catch (supabaseError) {
      console.error('[EVIDENCIAS] Error obteniendo evidencias de Supabase:', supabaseError);
    }

    // 2. Obtener evidencias de Prisma (legacy)
    try {
      const evidenciasPrisma = await (prisma as any).tareaEvidencia.findMany({
        where: {
          tareaId: id,
          tarea: {
            elemento: {
              obra: {
                organizacionId,
              },
            },
          },
        },
        include: {
          subidoPor: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Convertir formato de Prisma al formato esperado
      for (const evidencia of evidenciasPrisma) {
        evidenciasCombinadas.push({
          id: evidencia.id,
          tarea_id: id,
          tipo: evidencia.tipo || 'evidencia_parcial',
          archivo_path: evidencia.archivo_path,
          url: evidencia.archivo_path, // Asumir que ya es una URL completa
          descripcion: evidencia.descripcion,
          subido_por: evidencia.subidoPor?.nombre || evidencia.subidoPor?.email || 'Socio',
          subido_por_tipo: evidencia.subido_por_tipo || 'SOCIO',
          created_at: evidencia.created_at,
          source: 'prisma',
        });
      }
    } catch (prismaError) {
      console.error('[EVIDENCIAS] Error obteniendo evidencias de Prisma:', prismaError);
    }

    // Ordenar por fecha de creación (más recientes primero)
    evidenciasCombinadas.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      data: evidenciasCombinadas,
    });

  } catch (error) {
    console.error('Error en GET /api/tareas/[id]/evidencias:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const organizacionId = request.headers.get('x-organizacion-id');
    const usuarioId = request.headers.get('x-usuario-id');

    if (!organizacionId || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Organización y usuario requeridos' },
        { status: 400 }
      );
    }

    // Verificar permisos
    const tienePermiso = await PermisosService.verificarPermiso(
      usuarioId,
      organizacionId,
      'subir_evidencia'
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para subir evidencias' },
        { status: 403 }
      );
    }

    // Validar datos
    const validatedData = CrearEvidenciaSchema.parse({
      ...body,
      tareaId: id,
    });

    // Crear evidencia
    const evidencia = await TareaService.crearEvidencia(validatedData, usuarioId, organizacionId);

    return NextResponse.json({
      success: true,
      data: evidencia,
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/tareas/[id]/evidencias:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
