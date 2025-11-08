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

    return tareaActualizada;
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

    // Si se valida la tarea, crear pago
    if (data.estadoNuevo === 'VALIDADA') {
      await this.crearPagoAutomatico(data.tareaId, actorId);
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
