
import { z } from 'zod';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { visitStatusSchema } from '@/lib/fsm';
import {
  prepareEventoInsert,
  validateMediaRules,
} from '@/lib/evento-rules';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { uploadActaPdf, uploadPhoto, uploadSignature } from '@/lib/storage';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

const mediaSchema = z.object({
  kind: z.enum(['foto', 'firma']),
  dataUrl: z.string().min(10, 'Media requerida'),
});

const checklistSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const requestSchema = z.object({
  nuevo_estado: visitStatusSchema,
  notas: z.string().max(2000).optional(),
  checklist: z.array(checklistSchema).default([]),
  has_nc: z.boolean().default(false),
  actor: z.object({
    name: z.string().min(2),
    role: z.enum(['Cliente', 'Socio']),
    method: z.enum(['QR', 'login', 'PIN']),
  }),
  media: z.array(mediaSchema).max(5).default([]),
  motivo: z.string().optional(),
  nc_responsable: z.string().optional(),
  nc_deadline: z.string().optional(),
  gps_lat: z.number().optional(),
  gps_lon: z.number().optional(),
});

type TareaRecord = {
  id: string;
  obra_id: string | null;
  org_id: string | null;
  title: string | null;
  descripcion: string | null;
  estado: string | null;
  responsable: string | null;
  referente_id: string | null;
  socio_ids: string[] | null;
  obra: {
    id: string;
    name: string | null;
    address: string | null;
    org_id: string | null;
  } | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[TRANSITION] Iniciando transición para tarea:', id);
    
    let body: any;
    try {
      body = await request.json();
      console.log('[TRANSITION] Body recibido:', { 
        nuevo_estado: body.nuevo_estado,
        actor: body.actor,
        has_nc: body.has_nc,
        checklist_count: body.checklist?.length || 0,
        media_count: body.media?.length || 0,
      });
    } catch (parseError) {
      console.error('[TRANSITION_ERROR] Error al parsear JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          message: 'Error al parsear el cuerpo de la petición',
          error: 'PARSE_ERROR'
        }), 
        { status: 400 }
      );
    }
    
    let payload: z.infer<typeof requestSchema>;
    try {
      payload = requestSchema.parse(body);
      console.log('[TRANSITION] Payload validado correctamente');
    } catch (zodError) {
      console.error('[TRANSITION_ERROR] Error de validación Zod:', zodError);
      if (zodError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ 
            message: 'Error de validación',
            error: 'VALIDATION_ERROR',
            details: zodError.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
            }))
          }), 
          { status: 400 }
        );
      }
      throw zodError;
    }
    
    // Obtener usuario autenticado
    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch (cookieError) {
      console.error('[TRANSITION_ERROR] Error al obtener cookies:', cookieError);
      return new Response(
        JSON.stringify({ 
          message: 'Error de autenticación',
          error: 'AUTH_ERROR'
        }), 
        { status: 401 }
      );
    }
    
    const supabaseAuth = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('[TRANSITION_ERROR] Error de autenticación:', authError);
      return new Response(
        JSON.stringify({ 
          message: 'No autenticado',
          error: 'AUTH_ERROR'
        }), 
        { status: 401 }
      );
    }

    const userEmail = user.email;
    if (!userEmail) {
      console.error('[TRANSITION_ERROR] Usuario sin email:', user.id);
      return new Response(
        JSON.stringify({ 
          message: 'Usuario sin email',
          error: 'AUTH_ERROR'
        }), 
        { status: 400 }
      );
    }
    
    console.log('[TRANSITION] Usuario autenticado:', { 
      userId: user.id, 
      email: userEmail 
    });

    const supabase = createServiceSupabaseClient();

    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .select(
        `id, obra_id, org_id, title, descripcion, estado, responsable,
         obra:obras(id, name, address, org_id)`
      )
      .eq('id', id)
      .maybeSingle<TareaRecord>();

    if (tareaError) {
      throw tareaError;
    }

    if (!tarea) {
      return new Response(JSON.stringify({ message: 'Tarea no encontrada' }), {
        status: 404,
      });
    }

    // ✅ Validar que el usuario sea el responsable de la tarea (si tiene responsable asignado)
    // Si responsable está vacío/null, permitir la operación
    // El responsable puede ser un email o un nombre/descripción, así que hacemos validación flexible
    console.log('[TRANSITION] Validando responsable:', {
      tareaId: tarea.id,
      tareaResponsable: tarea.responsable,
      userEmail,
      tieneResponsable: !!(tarea.responsable && tarea.responsable.trim() !== ''),
    });
    
    if (tarea.responsable && tarea.responsable.trim() !== '') {
      const responsableNormalizado = tarea.responsable.trim().toLowerCase();
      const emailNormalizado = userEmail.toLowerCase();
      
      // Buscar el socio por email para obtener su nombre completo
      const { data: socio, error: socioError } = await supabase
        .from('socios')
        .select('id, nombre, email, telefono')
        .eq('email', userEmail)
        .maybeSingle();
      
      let esResponsable = false;
      
      // Comparación directa por email
      if (responsableNormalizado === emailNormalizado) {
        esResponsable = true;
        console.log('[TRANSITION] ✅ Coincidencia por email directo');
      }
      // Comparación por email contenido en el responsable
      else if (responsableNormalizado.includes(emailNormalizado) || emailNormalizado.includes(responsableNormalizado)) {
        esResponsable = true;
        console.log('[TRANSITION] ✅ Coincidencia por email contenido');
      }
      // Si encontramos el socio, comparar también por nombre
      else if (socio && socio.nombre) {
        const nombreNormalizado = socio.nombre.trim().toLowerCase();
        // Verificar si el responsable contiene el nombre del socio o viceversa
        if (responsableNormalizado.includes(nombreNormalizado) || nombreNormalizado.includes(responsableNormalizado)) {
          esResponsable = true;
          console.log('[TRANSITION] ✅ Coincidencia por nombre:', {
            responsable: tarea.responsable,
            nombreSocio: socio.nombre,
          });
        }
        // También verificar por primera palabra del nombre (por si hay formato "NOMBRE - Especialidad")
        else {
          const primeraPalabraNombre = nombreNormalizado.split(' ')[0];
          const primeraPalabraResponsable = responsableNormalizado.split(' ')[0];
          if (primeraPalabraNombre && primeraPalabraResponsable && 
              (primeraPalabraResponsable.includes(primeraPalabraNombre) || 
               primeraPalabraNombre.includes(primeraPalabraResponsable))) {
            esResponsable = true;
            console.log('[TRANSITION] ✅ Coincidencia por primera palabra del nombre');
          }
        }
      }
      
      if (!esResponsable) {
        console.warn('[TRANSITION] ❌ Usuario no es responsable:', {
          tareaResponsable: tarea.responsable,
          userEmail,
          socioNombre: socio?.nombre,
        });
        return new Response(
          JSON.stringify({ 
            message: 'Sólo el socio responsable puede avanzar esta tarea.',
            error: 'AUTHORIZATION_ERROR',
            details: {
              tareaResponsable: tarea.responsable,
              userEmail,
              socioNombre: socio?.nombre,
            }
          }),
          { status: 403 }
        );
      }
      console.log('[TRANSITION] ✅ Usuario es responsable, continuando...');
    } else {
      console.log('[TRANSITION] ⚠️ Tarea sin responsable asignado, permitiendo operación');
    }
    
    // No validamos más cuadrillas, quedan obsoletas.

    const { data: precedencias } = await supabase
      .from('tarea_precedencias')
      .select('depende_de')
      .eq('tarea_id', tarea.id);

    if (precedencias && precedencias.length > 0) {
      const dependeIds = precedencias.map((p) => p.depende_de);
      const { data: bloqueo } = await supabase
        .from('tareas')
        .select('id, estado')
        .in('id', dependeIds)
        .neq('estado', 'validado');

      if (bloqueo && bloqueo.length > 0) {
        // Obtener información de las tareas bloqueantes para mostrar mejor mensaje
        const { data: tareasBloqueantes } = await supabase
          .from('tareas')
          .select('id, title, estado')
          .in('id', bloqueo.map((b) => b.id));
        
        return new Response(
          JSON.stringify({
            message: 'No se puede avanzar: tareas precedentes sin validar',
            bloqueos: tareasBloqueantes || bloqueo,
            error: 'PRECEDENCE_ERROR',
          }),
          { status: 409 }
        );
      }
    }

    validateMediaRules({
      has_nc: payload.has_nc,
      checklist: payload.checklist,
      media: payload.media,
    });

    const uploadedMedia = await Promise.all(
      payload.media.map(async (item, idx) => {
        if (item.kind === 'foto') {
          const { path } = await uploadPhoto(item.dataUrl);
          return { kind: item.kind, path, dataUrl: item.dataUrl, idx };
        }
        const { path } = await uploadSignature(item.dataUrl);
        return { kind: item.kind, path, dataUrl: item.dataUrl, idx };
      })
    );

    const prepared = await prepareEventoInsert(
      {
        tareaId: tarea.id,
        nuevo_estado: payload.nuevo_estado,
        checklist: payload.checklist,
        media: uploadedMedia,
        notas: payload.notas,
        has_nc: payload.has_nc,
        actor: payload.actor,
        nc_responsable: payload.nc_responsable ?? null,
        nc_deadline: payload.nc_deadline ?? null,
        rollbackMotivo: payload.motivo ?? null,
      },
      {
        tarea: {
          id: tarea.id,
          tipo: tarea.title || '', // Usar title como tipo para compatibilidad
          descripcion: tarea.descripcion || '',
          estado: tarea.estado as any,
        },
        obra: {
          nombre: tarea.obra?.name || '',
          cliente: null, // No disponible en la query actual
          localizacion: tarea.obra?.address || null,
        },
      }
    );

    const pdfPath = prepared.pdf_path;
    if (prepared.pdf_bytes && pdfPath) {
      await uploadActaPdf(prepared.pdf_bytes, pdfPath);
    }

    // Obtener org_id de la tarea o de la obra
    const organizacionId = tarea.org_id || tarea.obra?.org_id;
    if (!organizacionId) {
      console.error('[TRANSITION_ERROR] No se pudo obtener org_id de la tarea o obra');
      return new Response(
        JSON.stringify({ 
          message: 'No se pudo determinar la organización de la tarea',
          error: 'ORG_ID_ERROR'
        }), 
        { status: 400 }
      );
    }

    console.log('[TRANSITION] Insertando evento con org_id:', organizacionId);

    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .insert({
        ...prepared.evento,
        org_id: organizacionId,
        checklist: prepared.evento.checklist,
        notas: prepared.evento.notas,
        gps_lat: payload.gps_lat ?? null,
        gps_lon: payload.gps_lon ?? null,
        has_nc: payload.has_nc,
        snapshot_json: prepared.snapshot_json,
        pdf_path: pdfPath,
      } as any)
      .select('id, created_at')
      .single();

    if (eventoError) {
      throw eventoError;
    }

    if (uploadedMedia.length > 0) {
      const mediaRows = uploadedMedia.map((item) => ({
        evento_id: evento.id,
        path: item.path,
        kind: item.kind,
        idx: item.idx,
      }));
      const { error: mediaError } = await supabase
        .from('media')
        .insert(mediaRows);
      if (mediaError) {
        throw mediaError;
      }
    }

    const { error: updateError } = await supabase
      .from('tareas')
      .update({ estado: payload.nuevo_estado })
      .eq('id', tarea.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        eventoId: evento.id,
        pdf_path: pdfPath,
      })
    );
  } catch (error) {
    console.error('[TRANSITION_ERROR]', error);
    
    // Manejar errores de Zod (validación de schema)
    if (error instanceof z.ZodError) {
      const details = error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      console.error('[TRANSITION_ERROR] Zod validation error:', details);
      return new Response(
        JSON.stringify({ 
          message: 'Error de validación',
          error: 'VALIDATION_ERROR',
          details 
        }), 
        { status: 400 }
      );
    }
    
    // Manejar errores de Supabase
    if (error && typeof error === 'object' && 'message' in error) {
      const supabaseError = error as { message: string; code?: string; details?: string };
      console.error('[TRANSITION_ERROR] Supabase error:', {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
      });
      return new Response(
        JSON.stringify({ 
          message: supabaseError.message || 'Error en la base de datos',
          error: 'DATABASE_ERROR',
          code: supabaseError.code,
        }), 
        { status: 500 }
      );
    }
    
    // Manejar errores genéricos
    const message = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Error al transicionar tarea';
    
    const status = message.includes('foto') || message.includes('validación') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        message,
        error: 'UNKNOWN_ERROR',
      }), 
      { status }
    );
  }
}
