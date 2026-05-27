
import { z } from 'zod';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { VisitStatus } from '@/lib/fsm';
import {
  prepareEventoInsert,
  validateMediaRules,
} from '@/lib/evento-rules';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { uploadActaPdf, uploadPhoto, uploadSignature } from '@/lib/storage';
import type { Database } from '@/lib/types/supabase.gen';
import { TareaFsmService, type EstadoTarea } from '@/lib/services/tarea-fsm.service';
import { PermisoService } from '@/lib/services/permiso.service';
import { SocioTareaOperacionService } from '@/lib/services/socio-tarea-operacion.service';
import { ESTADO_BLOQUE_FINAL, ESTADO_TAREA_FINAL } from '@/lib/domain/estados-core';
import type { RolActor } from '@/lib/services/permiso.service';
import { listSocioRecordsForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import {
  buildBloquesPorTareaMap,
  predecesorasQueBloqueanAvance,
} from '@/lib/socio/tareas-operativas-socio';

export const runtime = 'nodejs';

const IS_DEV = process.env.NODE_ENV === 'development';

const mediaSchema = z.object({
  kind: z.enum(['foto', 'firma']),
  dataUrl: z.string().min(10, 'Media requerida'),
  path: z.string().optional(),
});

const checklistSchema = z.object({
  id: z.string(),
  label: z.string(),
  checked: z.boolean(),
});

const estadoSolicitudSchema = z.enum([
  'pendiente',
  'en_progreso',
  'para_validar',
  'validada',
  'rechazada',
  'en_ejecucion',
  'en ejecucion',
  'finalizado',
  'finalizada',
  'terminada',
  'terminado',
  'en_revision',
  'validado',
  'rechazado',
  'rechazada',
]);

const requestSchema = z.object({
  nuevo_estado: estadoSolicitudSchema,
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
  responsable_socio_id: string | null;
  cuadrilla_id: string | null;
  referente_id: string | null;
  socio_ids: string[] | null;
  obra: {
    id: string;
    name: string | null;
    address: string | null;
    org_id: string | null;
  } | null;
};

const ESTADO_OFICIAL_TO_VISIT: Record<EstadoTarea, VisitStatus> = {
  pendiente: 'pendiente',
  en_progreso: 'en_ejecucion',
  para_validar: 'finalizado',
  validada: 'validado',
  rechazada: 'pendiente',
};

const mapEstadoBDaVisitStatus = (estado: string | null | undefined): VisitStatus => {
  const oficial = TareaFsmService.mapLegacyToOficial(estado);
  return ESTADO_OFICIAL_TO_VISIT[oficial];
};

const mapOficialToVisitStatus = (estado: EstadoTarea): VisitStatus => {
  return ESTADO_OFICIAL_TO_VISIT[estado];
};

const bloqueTieneEvidencia = (bloque: {
  evidencia_cargada?: boolean | null;
  evidencia_url?: string | null;
}) => Boolean(bloque.evidencia_cargada || bloque.evidencia_url);

async function validarBloquesListosParaEnviarTarea(
  supabaseAny: any,
  tareaId: string,
): Promise<Response | null> {
  const { data: bloques, error } = await supabaseAny
    .from('tareas_subtareas')
    .select('id, estado, evidencia_obligatoria, evidencia_cargada, evidencia_url')
    .eq('tarea_id', tareaId)
    .order('orden', { ascending: true });

  if (error) {
    return new Response(
      JSON.stringify({
        message: 'No se pudieron verificar los bloques de la tarea.',
        error: 'BLOQUES_VERIFICACION_ERROR',
        detail: error.message,
      }),
      { status: 500 },
    );
  }

  if (!bloques || bloques.length === 0) {
    return new Response(
      JSON.stringify({
        message: 'Primero tenés que generar y completar un bloque antes de enviar la tarea a validar.',
        error: 'BLOQUES_FALTANTES',
        errorCode: 'BLOQUES_FALTANTES',
      }),
      { status: 409 },
    );
  }

  const bloqueNoEnviado = bloques.find((bloque: any) => !['para_validar', ESTADO_BLOQUE_FINAL].includes(bloque.estado));
  if (bloqueNoEnviado) {
    return new Response(
      JSON.stringify({
        message: 'Primero enviá el bloque a validar desde el flujo de evidencia.',
        error: 'BLOQUE_NO_LISTO',
        errorCode: 'BLOQUE_NO_LISTO',
        bloqueId: bloqueNoEnviado.id,
        estado: bloqueNoEnviado.estado,
      }),
      { status: 409 },
    );
  }

  const bloqueSinEvidencia = bloques.find(
    (bloque: any) => bloque.evidencia_obligatoria !== false && !bloqueTieneEvidencia(bloque),
  );
  if (bloqueSinEvidencia) {
    return new Response(
      JSON.stringify({
        message: 'Debés cargar una foto de evidencia antes de enviar a validar.',
        error: 'EVIDENCIA_FALTANTE',
        errorCode: 'EVIDENCIA_FALTANTE',
        bloqueId: bloqueSinEvidencia.id,
      }),
      { status: 400 },
    );
  }

  return null;
}

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
    let nuevoEstadoCanon: EstadoTarea = 'pendiente';
    try {
      payload = requestSchema.parse(body);
      console.log('[TRANSITION] Payload validado correctamente');
      nuevoEstadoCanon = TareaFsmService.mapLegacyToOficial(payload.nuevo_estado);
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
      cookies: () => cookieStore as any 
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
        `id, obra_id, org_id, title, descripcion, estado, responsable, responsable_socio_id, cuadrilla_id,
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

    const orgIdRes = tarea.org_id || tarea.obra?.org_id || '';

    const rolDesdeOrg = await PermisoService.obtenerRolEnOrganizacion(
      user.id,
      orgIdRes,
    );

    const filasSesionSocio = await listSocioRecordsForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });

    let rolParaTransicion: RolActor | null = rolDesdeOrg;
    if (!rolParaTransicion && filasSesionSocio.length > 0) {
      rolParaTransicion = 'SOCIO';
    }

    if (!rolParaTransicion) {
      const body403 = {
        message: 'No tiene permisos para operar esta tarea',
        error: 'NO_ROL_EN_ORG',
        code: 'NO_ROL_EN_ORG',
        ...(IS_DEV
          ? {
              debug: SocioTareaOperacionService.toTransition403Debug({
                role: 'NONE',
                orgId: orgIdRes,
                tareaOrgId: tarea.org_id,
                tareaId: tarea.id,
                tareaEstado: tarea.estado,
                userId: user.id,
                userEmail,
                socioIdEfectivo: null,
                responsableSocioId: tarea.responsable_socio_id,
                cuadrillaId: tarea.cuadrilla_id,
                tareaResponsable: tarea.responsable,
                checks: {
                  A_responsableSocioId: false,
                  B_presupuestoAprobado: false,
                  C_socioEnCuadrilla: false,
                  D_legacyResponsableSinResponsableSocioId: false,
                },
                motivo403: 'NO_ROL_EN_ORG',
              }),
            }
          : {}),
      };
      return new Response(JSON.stringify(body403), { status: 403 });
    }

    if (rolParaTransicion === 'SOCIO' && nuevoEstadoCanon === ESTADO_TAREA_FINAL) {
      return new Response(
        JSON.stringify({
          message: 'El socio solo puede enviar a validar; la validación final la realiza el cliente/profesional.',
          error: 'SOCIO_NO_PUEDE_VALIDAR',
          errorCode: 'SOCIO_NO_PUEDE_VALIDAR',
        }),
        { status: 403 },
      );
    }

    const estadoActualCanon = TareaFsmService.mapLegacyToOficial(tarea.estado);
    if (estadoActualCanon === nuevoEstadoCanon) {
      return new Response(
        JSON.stringify({
          success: true,
          noOp: true,
          estado: estadoActualCanon,
          message: 'La tarea ya se encuentra en ese estado.',
        }),
        { status: 200 },
      );
    }

    if (rolParaTransicion === 'SOCIO' && nuevoEstadoCanon === 'para_validar') {
      const bloqueoBloques = await validarBloquesListosParaEnviarTarea(supabase as any, tarea.id);
      if (bloqueoBloques) {
        return bloqueoBloques;
      }
    }

    if (nuevoEstadoCanon === ESTADO_TAREA_FINAL) {
      const supabaseAny = supabase as any;
      const { data: pendientesSubtareas } = await supabaseAny
        .from('tareas_subtareas')
        .select('id')
        .eq('tarea_id', tarea.id)
        .neq('estado', ESTADO_BLOQUE_FINAL)
        .limit(1);

      if (pendientesSubtareas && pendientesSubtareas.length > 0) {
        return new Response(
          JSON.stringify({
            message: 'No podés validar la tarea: todavía hay bloques pendientes de aprobación.',
            error: 'SUBTAREAS_INCOMPLETAS',
          }),
          { status: 400 }
        );
      }
    }

    const orgIdParaAuth = tarea.org_id || tarea.obra?.org_id || '';
    let socioOperadorIdParaFsm: string | null = null;

    if (rolParaTransicion === 'SOCIO') {
      const { allowed, socioIdEfectivo, debug } =
        await SocioTareaOperacionService.evaluarSocioPuedeOperarTarea(supabase, {
          userId: user.id,
          userEmail,
          orgId: orgIdParaAuth,
          tarea: {
            id: tarea.id,
            estado: tarea.estado,
            responsable_socio_id: tarea.responsable_socio_id,
            responsable: tarea.responsable,
            cuadrilla_id: tarea.cuadrilla_id,
          },
        });

      socioOperadorIdParaFsm = socioIdEfectivo;

      if (IS_DEV) {
        console.log('[transition auth debug]', {
          userId: user.id,
          userEmail,
          role: rolParaTransicion,
          socioIdEfectivo,
          tareaId: tarea.id,
          tareaEstado: tarea.estado,
          responsableSocioId: tarea.responsable_socio_id,
          cuadrillaId: tarea.cuadrilla_id,
          tareaResponsable: tarea.responsable,
          checks: debug.checks,
          allowed,
          motivo403: allowed ? null : debug.motivoDenegacion,
        });
      }

      if (!allowed) {
        const flatDebug = SocioTareaOperacionService.toTransition403Debug({
          role: rolParaTransicion,
          orgId: orgIdParaAuth,
          tareaOrgId: tarea.org_id,
          tareaId: tarea.id,
          tareaEstado: tarea.estado,
          userId: user.id,
          userEmail,
          socioIdEfectivo,
          responsableSocioId: tarea.responsable_socio_id,
          cuadrillaId: tarea.cuadrilla_id,
          tareaResponsable: tarea.responsable,
          checks: debug.checks,
          motivo403: debug.motivoDenegacion ?? 'SOCIO_NO_AUTORIZADO_TAREA',
        });
        return new Response(
          JSON.stringify({
            message: 'Sólo el socio autorizado puede avanzar esta tarea.',
            error: 'SOCIO_NO_AUTORIZADO_TAREA',
            code: 'SOCIO_NO_AUTORIZADO_TAREA',
            ...(IS_DEV ? { debug: flatDebug } : {}),
          }),
          { status: 403 },
        );
      }
    }
    
    // No validamos más cuadrillas, quedan obsoletas.

    // Verificar precedencias activas
    const { data: precedencias, error: precedenciasError } = await supabase
      .from('tarea_precedencias')
      .select('depende_de, tarea_id')
      .eq('tarea_id', tarea.id);

    console.log('[TRANSITION] Precedencias encontradas para tarea:', {
      tareaId: tarea.id,
      tareaTitle: tarea.title,
      precedenciasCount: precedencias?.length || 0,
      precedencias: precedencias,
      error: precedenciasError,
    });

    if (precedencias && precedencias.length > 0) {
      const dependeIds = precedencias
        .map((p) => p.depende_de)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

      console.log('[TRANSITION] IDs de tareas predecesoras:', dependeIds);

      if (dependeIds.length > 0) {
        // Obtener información completa de las tareas predecesoras (incluyendo nombres)
        const { data: tareasPredecesoras, error: predecesorasError } = await supabase
          .from('tareas')
          .select('id, title, estado')
          .in('id', dependeIds);

        console.log('[TRANSITION] 📋 TODAS las tareas predecesoras (con nombres):', 
          tareasPredecesoras?.map(t => ({
            id: t.id,
            nombre: t.title,
            estado: t.estado,
            depende_de: precedencias.find(p => p.depende_de === t.id)?.depende_de
          }))
        );

        if (predecesorasError) {
          console.error('[TRANSITION] Error cargando predecesoras:', predecesorasError);
        }

        const { data: bloquesPredecesoras, error: bloquesPrecError } = await supabase
          .from('tareas_subtareas')
          .select('tarea_id, estado')
          .in('tarea_id', dependeIds);

        if (bloquesPrecError) {
          console.error('[TRANSITION] Error cargando bloques de predecesoras:', bloquesPrecError);
        }

        const bloquesPorTarea = buildBloquesPorTareaMap(bloquesPredecesoras ?? []);
        const tareasBloqueantes = predecesorasQueBloqueanAvance(
          tareasPredecesoras ?? [],
          bloquesPorTarea,
        );

        console.log('[TRANSITION] Predecesoras que bloquean avance:', {
          bloqueoCount: tareasBloqueantes.length,
          bloqueo: tareasBloqueantes,
        });

        if (tareasBloqueantes.length > 0) {
          console.log('[TRANSITION] ❌ Bloqueando transición por tareas precedentes:', tareasBloqueantes);
          
          // Mostrar información detallada para eliminar manualmente
          console.log('[TRANSITION] 🔧 Para eliminar esta precedencia manualmente en Supabase, ejecutá:');
          tareasBloqueantes.forEach(tb => {
            const prec = precedencias.find(p => p.depende_de === tb.id);
            if (prec) {
              console.log(`DELETE FROM tarea_precedencias WHERE tarea_id = '${prec.tarea_id}' AND depende_de = '${prec.depende_de}'; -- Elimina precedencia de "${tb.title}" (${tb.id}) hacia "${tarea.title}" (${tarea.id})`);
            }
          });
          
          // Crear mensaje detallado con IDs y nombres
          const mensajeDetallado = tareasBloqueantes.map(tb => {
            const prec = precedencias.find(p => p.depende_de === tb.id);
            return `- "${tb.title}" (ID: ${tb.id}, Estado: ${tb.estado})${prec ? ` - Precedencia: tarea_id=${prec.tarea_id}, depende_de=${prec.depende_de}` : ''}`;
          }).join('\n') || 'Tareas precedentes aún no listas';

          return new Response(
            JSON.stringify({
              message: `No se puede avanzar: tareas precedentes aún no listas:\n${mensajeDetallado}`,
              bloqueos: tareasBloqueantes,
              precedencias: precedencias.map(p => ({ tarea_id: p.tarea_id, depende_de: p.depende_de })),
              error: 'PRECEDENCE_ERROR',
            }),
            { status: 409 }
          );
        }
      }
    } else {
      console.log('[TRANSITION] ✅ No hay precedencias activas, puede continuar');
    }

    validateMediaRules({
      has_nc: payload.has_nc,
      checklist: payload.checklist,
      media: payload.media,
    });

    // Validar checklist completo solo al finalizar
    if (nuevoEstadoCanon === 'para_validar') {
      if (payload.checklist && payload.checklist.length > 0) {
        const itemsIncompletos = payload.checklist.filter((item) => !item.checked);
        if (itemsIncompletos.length > 0) {
          const itemsPendientes = itemsIncompletos.map((item) => item.label).join(', ');
          return new Response(
            JSON.stringify({
              message: 'Debés completar todos los puntos del checklist antes de finalizar la tarea.',
              error: 'CHECKLIST_INCOMPLETO',
              itemsPendientes: itemsPendientes,
              bloqueos: itemsIncompletos,
            }),
            { status: 400 }
          );
        }
      }
    }

    const uploadedMedia = await Promise.all(
      payload.media.map(async (item, idx) => {
        if (item.kind === 'foto') {
          if (item.path) {
            return { kind: item.kind, path: item.path, dataUrl: item.dataUrl, idx };
          }
          const { path } = await uploadPhoto(item.dataUrl);
          return { kind: item.kind, path, dataUrl: item.dataUrl, idx };
        }
        if (item.path) {
          return { kind: item.kind, path: item.path, dataUrl: item.dataUrl, idx };
        }
        const { path } = await uploadSignature(item.dataUrl);
        return { kind: item.kind, path, dataUrl: item.dataUrl, idx };
      })
    );

    const prepared = await prepareEventoInsert(
      {
        tareaId: tarea.id,
        nuevo_estado: mapOficialToVisitStatus(nuevoEstadoCanon),
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
          estado: mapEstadoBDaVisitStatus(tarea.estado),
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

    await TareaFsmService.enforceTransition({
      tareaId: tarea.id,
      nuevoEstado: nuevoEstadoCanon,
      actorId: user.id,
      rol: rolParaTransicion,
      motivo: payload.motivo,
      socioOperadorId: socioOperadorIdParaFsm,
    });

    if (rolParaTransicion === 'SOCIO' && nuevoEstadoCanon === 'en_progreso') {
      const supabaseAny = supabase as any;
      const { data: bloqueInicial } = await supabaseAny
        .from('tareas_subtareas')
        .select('id, estado')
        .eq('tarea_id', tarea.id)
        .or(`socio_id.eq.${socioOperadorIdParaFsm},socio_id.is.null`)
        .in('estado', ['pendiente', 'rechazado'])
        .order('orden', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (bloqueInicial?.id) {
        await supabaseAny
          .from('tareas_subtareas')
          .update({
            estado: 'en_progreso',
            hora_inicio: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', bloqueInicial.id);
      }
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
    // Manejar errores genéricos
    const message = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Error al transicionar tarea';
    
    // Mapear errores específicos a códigos
    let errorCode = 'UNKNOWN_ERROR';
    let statusCode = message.includes('foto') || message.includes('validación') || message.includes('validacion') ? 400 : 500;
    
    if (message.includes('dos tareas en progreso') || message.includes('dos tareas activas')) {
      errorCode = 'SOCIO_TIENE_2_TAREAS_EN_PROGRESO';
      statusCode = 400;
    } else if (message.includes('SOCIO_SUSPENDIDO') || message.includes('suspendido')) {
      errorCode = 'SOCIO_SUSPENDIDO';
      statusCode = 403;
    } else if (message.includes('Transicion no permitida') || message.includes('no permitida')) {
      errorCode = 'TRANSICIÓN_NO_PERMITIDA';
      statusCode = 400;
    } else if (message.includes('No se puede validar la tarea: existen bloques pendientes')) {
      errorCode = 'SUBTAREAS_INCOMPLETAS';
      statusCode = 400;
    }

    if (error instanceof Error || typeof error === 'string') {
      return new Response(
        JSON.stringify({
          message,
          error: errorCode,
          errorCode,
        }),
        { status: statusCode }
      );
    }
    
    // Manejar errores de Supabase/PostgREST
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
          detail: supabaseError.details ?? null,
        }), 
        { status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        message,
        error: errorCode,
        errorCode,
      }), 
      { status: statusCode }
    );
  }
}
