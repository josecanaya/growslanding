// ?? DEPRECATED ? No usar. Reemplazado por servicios Supabase.
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { 
  CrearTarea, 
  ActualizarTarea, 
  AsignarSocio, 
  CambiarEstadoTarea,
  CrearPrecedencia,
  CrearPresupuesto,
  AprobarPresupuesto,
  CrearEvidencia,
  ValidarTransicion,
  EstadoTarea,
  TipoActor
} from '../schemas';
import { createServiceSupabaseClient } from '../supabase-server';
import { WalletService } from './wallet.service';
import { EscrowService } from './escrow.service';
import { primeraFilaPresupuestoAprobado } from '@/lib/domain/aprobacion-presupuesto-tarea';

type PrismaWithLegacy = PrismaClient & {
  miembroOrganizacion?: {
    findFirst: (...args: any[]) => Promise<any>;
  };
};

const prisma = new PrismaClient() as PrismaWithLegacy;

export class TareaService {
  /**
   * Crea una nueva tarea
   */
  static async crearTarea(data: CrearTarea, organizacionId: string) {
    // Verificar que el elemento pertenece a la organización
    const elemento = await prisma.elementoObra.findFirst({
      where: {
        id: data.elementoId,
        obra: {
          organizacionId,
        },
      },
      include: {
        obra: true,
      },
    });

    if (!elemento) {
      throw new Error('Elemento no encontrado o no pertenece a la organización');
    }

    // Crear tarea
    const tarea = await prisma.tarea.create({
      data: {
        ...data,
        estado: 'PROPUESTA',
      },
      include: {
        elemento: {
          include: {
            obra: true,
          },
        },
        plantillaTarea: true,
      },
    });

    // Crear estado inicial
    await this.crearEstadoTarea({
      tareaId: tarea.id,
      estadoAnterior: null,
      estadoNuevo: 'PROPUESTA',
      actorRol: 'CLIENTE_TECNICO',
      motivo: 'Tarea creada',
    });

    // Crear evento
    await this.crearEvento({
      obraId: elemento.obra.id,
      tareaId: tarea.id,
      tipoEvento: 'TAREA_CREADA',
      payloadJson: {
        tareaId: tarea.id,
        nombre: tarea.nombre,
        elementoId: tarea.elementoId,
      },
    });

    return tarea;
  }

  /**
   * Actualiza una tarea
   */
  static async actualizarTarea(tareaId: string, data: ActualizarTarea, organizacionId: string) {
    const tarea = await this.verificarTarea(tareaId, organizacionId);

    const tareaActualizada = await prisma.tarea.update({
      where: { id: tareaId },
      data,
      include: {
        elemento: {
          include: {
            obra: true,
          },
        },
        socio: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return tareaActualizada;
  }

  /**
   * Asigna un socio a una tarea
   */
  static async asignarSocio(data: AsignarSocio, organizacionId: string) {
    const tarea = await this.verificarTarea(data.tareaId, organizacionId);

    // Verificar que el socio pertenece a la organización
    const miembroDelegate = prisma.miembroOrganizacion;
    if (!miembroDelegate) {
      throw new Error('Modelo de miembros no disponible en Prisma');
    }

    const socio = await miembroDelegate.findFirst({
      where: {
        organizacionId,
        usuarioId: data.socioId,
        rol: 'SOCIO',
        activo: true,
      },
    });

    if (!socio) {
      throw new Error('Socio no encontrado o no pertenece a la organización');
    }

    // Verificar estado de la tarea
    if (tarea.estado !== 'PRESUPUESTADA') {
      throw new Error('Solo se pueden asignar socios a tareas presupuestadas');
    }

    const tareaActualizada = await prisma.tarea.update({
      where: { id: data.tareaId },
      data: {
        socioId: data.socioId,
        estado: 'ASIGNADA',
      },
      include: {
        socio: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    // Crear estado
    await this.crearEstadoTarea({
      tareaId: data.tareaId,
      estadoAnterior: 'PRESUPUESTADA',
      estadoNuevo: 'ASIGNADA',
      actorRol: 'CLIENTE_TECNICO',
      motivo: `Socio asignado: ${socio.usuario.nombre}`,
    });

    // Crear evento
    await this.crearEvento({
      obraId: tarea.elemento.obra.id,
      tareaId: data.tareaId,
      tipoEvento: 'SOCIO_ASIGNADO',
      payloadJson: {
        tareaId: data.tareaId,
        socioId: data.socioId,
        socioNombre: socio.usuario.nombre,
      },
    });

    // Generar subtareas automáticamente si no existen
    await this.generarSubtareasAutomaticas(data.tareaId, organizacionId, {
      bloquesPreferidos: tarea.bloquesPlanificados ?? undefined,
    });

    return tareaActualizada;
  }

  /**
   * Genera subtareas automáticamente desde tareas_presupuesto
   */
  static async generarSubtareasAutomaticas(
    tareaId: string,
    organizacionId: string,
    opciones?: { bloquesPreferidos?: number }
  ) {
    const supabase = createServiceSupabaseClient();
    const { data: subtareasExistentes } = await supabase
      .from('tareas_subtareas')
      .select('id')
      .eq('tarea_id', tareaId)
      .limit(1);

    if (subtareasExistentes && subtareasExistentes.length > 0) {
      return;
    }

    const { data: presupuestoRows, error: presupuestoError } = await supabase
      .from('tareas_presupuestos')
      .select('id, cantidad, unidad, dias_reales, notas, monto, socio_id, estado')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: false })
      .limit(20);

    const presupuesto = primeraFilaPresupuestoAprobado(presupuestoRows ?? []);

    if (presupuestoError || !presupuesto) {
      console.warn('[GENERAR_SUBTAREAS] No se encontró presupuesto para tarea ' + tareaId);
      return;
    }

    const { data: tareaConfigurada } = await supabase
      .from('tareas')
      .select('bloques_planificados')
      .eq('id', tareaId)
      .maybeSingle();

    const { cantidad, unidad, dias_reales, notas, monto } = presupuesto;
    let evidenciaObligatoria = true;

    let dias = dias_reales;
    let bloquesNotas: number | undefined;
    if (!dias && notas) {
      try {
        const notasParsed = typeof notas === 'string' ? JSON.parse(notas) : notas;
        dias = notasParsed?.dias_reales || notasParsed?.dias;
        if (typeof notasParsed?.bloques === 'number') {
          bloquesNotas = notasParsed.bloques;
        }
        if (typeof notasParsed?.bloques_planificados === 'number') {
          bloquesNotas = notasParsed.bloques_planificados;
        }
        if (typeof notasParsed?.evidencia_obligatoria === 'boolean') {
          evidenciaObligatoria = notasParsed.evidencia_obligatoria;
        }
      } catch {
        // Ignorar notas que no puedan parsearse
      }
    }

    const configuracionBloques =
      opciones?.bloquesPreferidos ??
      bloquesNotas ??
      tareaConfigurada?.bloques_planificados ??
      dias;

    const totalBloques = Math.max(
      1,
      Math.ceil(
        configuracionBloques ||
          (cantidad ? Math.min(Math.ceil(Number(cantidad)), 365) : 1)
      )
    );

    if (!cantidad && monto == null && !dias) {
      console.warn('[GENERAR_SUBTAREAS] No hay datos suficientes para generar subtareas para tarea ' + tareaId);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const subtareas: any[] = [];

    const cantidadTotal = typeof cantidad === 'number' ? Number(cantidad) : null;
    const montoTotal = typeof monto === 'number' ? Number(monto) : null;
    const cantidadBase = cantidadTotal != null ? cantidadTotal / totalBloques : null;
    const montoBase = montoTotal != null ? montoTotal / totalBloques : null;
    let acumuladoCantidad = 0;
    let acumuladoMonto = 0;

    for (let i = 1; i <= totalBloques; i++) {
      const fechaSubtarea = new Date(hoy);
      fechaSubtarea.setDate(hoy.getDate() + (i - 1));
      const esUltimoBloque = i === totalBloques;

      let cantidadBloque: number | null = null;
      let montoBloque: number | null = null;

      if (cantidadBase != null) {
        cantidadBloque =
          esUltimoBloque && cantidadTotal != null
            ? cantidadTotal - acumuladoCantidad
            : cantidadBase;
        acumuladoCantidad += cantidadBloque;
      }

      if (montoBase != null) {
        montoBloque =
          esUltimoBloque && montoTotal != null
            ? montoTotal - acumuladoMonto
            : montoBase;
        acumuladoMonto += montoBloque;
      }

      subtareas.push({
        tarea_id: tareaId,
        orden: i,
        orden_pago: i,
        cantidad: cantidadBloque,
        unidad: unidad || 'unidades',
        estado: 'pendiente',
        fecha: fechaSubtarea.toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        monto_estimado: montoBloque,
        evidencia_obligatoria: evidenciaObligatoria,
      });
    }

    const { error: insertError } = await supabase
      .from('tareas_subtareas')
      .insert(subtareas);

    if (insertError) {
      console.error('[GENERAR_SUBTAREAS] Error insertando subtareas:', insertError);
      throw new Error('Error al generar subtareas automáticamente');
    }

    console.log('[GENERAR_SUBTAREAS] Generadas ' + subtareas.length + ' subtareas para tarea ' + tareaId);
  }

  /**
   * Cambia el estado de una tarea siguiendo la FSM
   */
  static async cambiarEstadoTarea(data: CambiarEstadoTarea, actorId: string, organizacionId: string) {
    const tarea = await this.verificarTarea(data.tareaId, organizacionId);

    // Obtener rol del actor
    const miembroActorDelegate = prisma.miembroOrganizacion;
    if (!miembroActorDelegate) {
      throw new Error('Modelo de miembros no disponible en Prisma');
    }

    const actor = await miembroActorDelegate.findFirst({
      where: {
        organizacionId,
        usuarioId: actorId,
        activo: true,
      },
      include: {
        usuario: true,
      },
    });

    if (!actor) {
      throw new Error('Actor no encontrado');
    }

    // Validar transición
    const transicionValida = await this.validarTransicionEstado({
      tareaId: data.tareaId,
      estadoNuevo: data.estadoNuevo,
      actorRol: actor.rol as TipoActor,
    });

    if (!transicionValida) {
      throw new Error('Transición de estado no válida');
    }

    const estadoAnterior = tarea.estado;

    // Actualizar tarea
    const tareaActualizada = await prisma.tarea.update({
      where: { id: data.tareaId },
      data: {
        estado: data.estadoNuevo,
        fechaInicioReal: data.estadoNuevo === 'EN_EJECUCION' ? new Date() : tarea.fechaInicioReal,
        fechaFinReal: data.estadoNuevo === 'TERMINADA' ? new Date() : tarea.fechaFinReal,
      },
    });

    // Crear estado
    await this.crearEstadoTarea({
      tareaId: data.tareaId,
      estadoAnterior,
      estadoNuevo: data.estadoNuevo,
      actorRol: actor.rol as TipoActor,
      motivo: data.motivo,
      actorId,
    });

    // Crear evento
    await this.crearEvento({
      obraId: tarea.elemento.obra.id,
      tareaId: data.tareaId,
      tipoEvento: 'TAREA_ESTADO_CAMBIADO',
      payloadJson: {
        tareaId: data.tareaId,
        estadoAnterior,
        estadoNuevo: data.estadoNuevo,
        actorId,
        motivo: data.motivo,
      },
    });

    // Si se valida la tarea, procesar pago (escrow o efectivo)
    if (data.estadoNuevo === 'VALIDADA') {
      await this.crearPagoAutomatico(data.tareaId, actorId);
      
      // Intentar liberar fondos de escrow si existe
      // Si no hay escrow, asume pago en efectivo y usa la lógica anterior
      const escrowResult = await EscrowService.liberarFondosPorTarea(data.tareaId, actorId);
      
      // Si no se liberó escrow (no había), usar lógica de efectivo
      if (!escrowResult.liberado) {
        await this.crearMovimientosWallet(data.tareaId, organizacionId);
      }
      // Si se liberó escrow, ya se registró el pago dentro de liberarFondosPorTarea()
    }

    return tareaActualizada;
  }

  /**
   * Crea un presupuesto para una tarea
   */
  static async crearPresupuesto(data: CrearPresupuesto, organizacionId: string) {
    const tarea = await this.verificarTarea(data.tareaId, organizacionId);

    // Verificar que el socio pertenece a la organización
    const miembroSocioDelegate = prisma.miembroOrganizacion;
    if (!miembroSocioDelegate) {
      throw new Error('Modelo de miembros no disponible en Prisma');
    }

    const socio = await miembroSocioDelegate.findFirst({
      where: {
        organizacionId,
        usuarioId: data.socioId,
        rol: 'SOCIO',
        activo: true,
      },
    });

    if (!socio) {
      throw new Error('Socio no encontrado');
    }

    // Verificar estado de la tarea
    if (tarea.estado !== 'PROPUESTA') {
      throw new Error('Solo se pueden crear presupuestos para tareas en estado PROPUESTA');
    }

    const presupuesto = await prisma.tareaPresupuesto.create({
      data,
    });

    // Crear evento
    await this.crearEvento({
      obraId: tarea.elemento.obra.id,
      tareaId: data.tareaId,
      tipoEvento: 'PRESUPUESTO_SUBIDO',
      payloadJson: {
        tareaId: data.tareaId,
        presupuestoId: presupuesto.id,
        socioId: data.socioId,
        monto: data.monto,
      },
    });

    return presupuesto;
  }

  /**
   * Aprueba o rechaza un presupuesto
   */
  static async aprobarPresupuesto(data: AprobarPresupuesto, organizacionId: string) {
    const presupuesto = await prisma.tareaPresupuesto.findFirst({
      where: {
        id: data.presupuestoId,
        tarea: {
          elemento: {
            obra: {
              organizacionId,
            },
          },
        },
      },
      include: {
        tarea: {
          include: {
            elemento: {
              include: {
                obra: true,
              },
            },
          },
        },
      },
    });

    if (!presupuesto) {
      throw new Error('Presupuesto no encontrado');
    }

    const presupuestoActualizado = await prisma.tareaPresupuesto.update({
      where: { id: data.presupuestoId },
      data: {
        estado: data.aprobado ? 'APROBADO' : 'RECHAZADO',
      },
    });

    // Si se aprueba, cambiar estado de la tarea
    if (data.aprobado) {
      await prisma.tarea.update({
        where: { id: presupuesto.tareaId },
        data: {
          estado: 'PRESUPUESTADA',
        },
      });

      await this.crearEstadoTarea({
        tareaId: presupuesto.tareaId,
        estadoAnterior: 'PROPUESTA',
        estadoNuevo: 'PRESUPUESTADA',
        actorRol: 'CLIENTE_TECNICO',
        motivo: 'Presupuesto aprobado',
      });
    }

    // Crear evento
    await this.crearEvento({
      obraId: presupuesto.tarea.elemento.obra.id,
      tareaId: presupuesto.tareaId,
      tipoEvento: data.aprobado ? 'PRESUPUESTO_APROBADO' : 'PRESUPUESTO_RECHAZADO',
      payloadJson: {
        tareaId: presupuesto.tareaId,
        presupuestoId: data.presupuestoId,
        aprobado: data.aprobado,
        motivo: data.motivo,
      },
    });

    return presupuestoActualizado;
  }

  /**
   * Crea una evidencia para una tarea
   */
  static async crearEvidencia(data: CrearEvidencia, actorId: string, organizacionId: string) {
    const tarea = await this.verificarTarea(data.tareaId, organizacionId);

    const evidencia = await prisma.tareaEvidencia.create({
      data: {
        ...data,
        subidoPorId: actorId,
      },
    });

    // Crear evento
    await this.crearEvento({
      obraId: tarea.elemento.obra.id,
      tareaId: data.tareaId,
      tipoEvento: 'EVIDENCIA_SUBIDA',
      payloadJson: {
        tareaId: data.tareaId,
        evidenciaId: evidencia.id,
        tipo: data.tipo,
        actorId,
      },
    });

    return evidencia;
  }

  /**
   * Valida una transición de estado según la FSM
   */
  private static async validarTransicionEstado(data: ValidarTransicion): Promise<boolean> {
    const { estadoNuevo, actorRol } = data;

    // PROPUESTA → PRESUPUESTADA: socio sube presupuesto o cliente lo acepta
    if (estadoNuevo === 'PRESUPUESTADA') {
      return actorRol === 'SOCIO' || actorRol === 'CLIENTE_TECNICO';
    }

    // PRESUPUESTADA → ASIGNADA: cliente asigna
    if (estadoNuevo === 'ASIGNADA') {
      return actorRol === 'CLIENTE_TECNICO';
    }

    // ASIGNADA → EN_EJECUCION: socio inicia
    if (estadoNuevo === 'EN_EJECUCION') {
      return actorRol === 'SOCIO';
    }

    // EN_EJECUCION → TERMINADA: socio finaliza
    if (estadoNuevo === 'TERMINADA') {
      return actorRol === 'SOCIO';
    }

    // TERMINADA → VALIDADA: cliente valida (se genera Pago)
    if (estadoNuevo === 'VALIDADA') {
      return actorRol === 'CLIENTE_TECNICO';
    }

    return false;
  }

  /**
   * Crea un estado de tarea
   */
  private static async crearEstadoTarea(data: {
    tareaId: string;
    estadoAnterior: EstadoTarea | null;
    estadoNuevo: EstadoTarea;
    actorRol: TipoActor;
    motivo?: string;
    actorId?: string;
  }) {
    await prisma.tareaEstado.create({
      data: {
        tareaId: data.tareaId,
        estadoAnterior: data.estadoAnterior,
        estadoNuevo: data.estadoNuevo,
        actorId: data.actorId || 'system',
        actorRol: data.actorRol,
        motivo: data.motivo,
      },
    });
  }

  /**
   * Crea un pago automático cuando se valida una tarea
   */
  private static async crearPagoAutomatico(tareaId: string, actorId: string) {
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      include: {
        presupuestos: {
          where: {
            estado: 'APROBADO',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!tarea || tarea.presupuestos.length === 0) {
      return;
    }

    const presupuesto = tarea.presupuestos[0];

    await prisma.pago.create({
      data: {
        tareaId,
        monto: presupuesto.monto,
        estadoPago: 'PENDIENTE',
        aprobadoPor: actorId,
      },
    });

    // Crear evento
    await this.crearEvento({
      tareaId,
      tipoEvento: 'PAGO_GENERADO',
      payloadJson: {
        tareaId,
        monto: presupuesto.monto,
        presupuestoId: presupuesto.id,
      },
    });
  }

  /**
   * Verifica que una tarea pertenece a la organización
   */
  private static async verificarTarea(tareaId: string, organizacionId: string) {
    const tarea = await prisma.tarea.findFirst({
      where: {
        id: tareaId,
        elemento: {
          obra: {
            organizacionId,
          },
        },
      },
      include: {
        elemento: {
          include: {
            obra: true,
          },
        },
      },
    });

    if (!tarea) {
      throw new Error('Tarea no encontrada o no pertenece a la organización');
    }

    return tarea;
  }

  /**
   * Crea movimientos de wallet cuando se valida una tarea (pago en efectivo)
   * Usa WalletService.registrarPagoPorTarea con metodoPago: 'EFECTIVO'
   */
  private static async crearMovimientosWallet(tareaId: string, organizacionId: string) {
    try {
      const supabase = createServiceSupabaseClient();
      const supabaseAny = supabase as any;

      // 1. Obtener presupuesto aprobado de la tarea desde Supabase
      const { data: presRows, error: presupuestoError } = await supabaseAny
        .from('tareas_presupuestos')
        .select('id, monto, socio_id, estado')
        .eq('tarea_id', tareaId)
        .order('created_at', { ascending: false })
        .limit(20);

      const presupuesto = primeraFilaPresupuestoAprobado(presRows ?? []);

      if (presupuestoError || !presupuesto || !presupuesto.monto) {
        console.warn('[WALLET] No se encontró presupuesto aprobado para tarea:', tareaId);
        return;
      }

      const montoTotal = presupuesto.monto;
      const socioId = presupuesto.socio_id;

      if (!socioId) {
        console.warn('[WALLET] Presupuesto sin socio_id:', presupuesto.id);
        return;
      }

      // 2. Obtener org_id desde la tarea
      const { data: tarea, error: tareaError } = await supabaseAny
        .from('tareas')
        .select('org_id')
        .eq('id', tareaId)
        .maybeSingle();

      if (tareaError || !tarea || !tarea.org_id) {
        console.warn('[WALLET] No se pudo obtener org_id de la tarea:', tareaId);
        return;
      }

      const orgId = tarea.org_id || organizacionId;

      // 3. Registrar pago usando el servicio centralizado (pago en efectivo)
      await WalletService.registrarPagoPorTarea({
        tareaId,
        socioId,
        orgId,
        montoTotal,
        metodoPago: 'EFECTIVO',
        presupuestoId: presupuesto.id,
      });

      console.log('[WALLET] Movimientos creados exitosamente para tarea (efectivo):', tareaId);
    } catch (error) {
      console.error('[WALLET] Error creando movimientos de wallet:', error);
      // No lanzar error para no interrumpir el flujo de validación
    }
  }

  /**
   * Crea un evento
   */
  private static async crearEvento(data: {
    obraId?: string;
    tareaId?: string;
    tipoEvento: string;
    payloadJson: any;
    actorId?: string;
  }) {
    await prisma.evento.create({
      data: {
        obraId: data.obraId,
        tareaId: data.tareaId,
        tipoEvento: data.tipoEvento as any,
        payloadJson: data.payloadJson,
        actorId: data.actorId,
      },
    });
  }
}
