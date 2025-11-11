// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { TipoEvento } from '../schemas';
import { NotificacionService } from './notificacion.service';

type PrismaWithEvento = PrismaClient & {
  evento: any;
};

const prisma = new PrismaClient() as PrismaWithEvento;

export class EventoService {
  /**
   * Crea un evento y procesa notificaciones automáticas
   */
  static async crearEvento(data: {
    obraId?: string;
    tareaId?: string;
    tipoEvento: TipoEvento;
    payloadJson: any;
    actorId?: string;
  }) {
    // Crear evento en la base de datos
    const evento = await prisma.evento.create({
      data: {
        obraId: data.obraId,
        tareaId: data.tareaId,
        tipoEvento: data.tipoEvento,
        payloadJson: data.payloadJson,
        actorId: data.actorId,
      },
    });

    // Procesar notificaciones automáticas
    await NotificacionService.procesarEvento({
      tipoEvento: data.tipoEvento,
      obraId: data.obraId,
      tareaId: data.tareaId,
      actorId: data.actorId,
      payloadJson: data.payloadJson,
    });

    return evento;
  }

  /**
   * Obtiene eventos con filtros
   */
  static async obtenerEventos(filtros: {
    obraId?: string;
    tareaId?: string;
    tipoEvento?: TipoEvento;
    fechaDesde?: Date;
    fechaHasta?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filtros.obraId) where.obraId = filtros.obraId;
    if (filtros.tareaId) where.tareaId = filtros.tareaId;
    if (filtros.tipoEvento) where.tipoEvento = filtros.tipoEvento;
    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.createdAt = {};
      if (filtros.fechaDesde) where.createdAt.gte = filtros.fechaDesde;
      if (filtros.fechaHasta) where.createdAt.lte = filtros.fechaHasta;
    }

    const [eventos, total] = await Promise.all([
      prisma.evento.findMany({
        where,
        include: {
          obra: {
            select: {
              id: true,
              nombre: true,
            },
          },
          actor: {
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
        take: filtros.limit || 20,
        skip: filtros.offset || 0,
      }),
      prisma.evento.count({ where }),
    ]);

    return {
      eventos,
      paginacion: {
        total,
        limit: filtros.limit || 20,
        offset: filtros.offset || 0,
        hasMore: (filtros.offset || 0) + (filtros.limit || 20) < total,
      },
    };
  }

  /**
   * Obtiene eventos de una obra específica
   */
  static async obtenerEventosObra(obraId: string, limit: number = 50) {
    return await this.obtenerEventos({
      obraId,
      limit,
      offset: 0,
    });
  }

  /**
   * Obtiene eventos de una tarea específica
   */
  static async obtenerEventosTarea(tareaId: string, limit: number = 20) {
    return await this.obtenerEventos({
      tareaId,
      limit,
      offset: 0,
    });
  }

  /**
   * Obtiene estadísticas de eventos
   */
  static async obtenerEstadisticasEventos(filtros: {
    obraId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }) {
    const where: any = {};

    if (filtros.obraId) where.obraId = filtros.obraId;
    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.createdAt = {};
      if (filtros.fechaDesde) where.createdAt.gte = filtros.fechaDesde;
      if (filtros.fechaHasta) where.createdAt.lte = filtros.fechaHasta;
    }

    const [
      totalEventos,
      eventosPorTipo,
      eventosPorDia,
    ] = await Promise.all([
      prisma.evento.count({ where }),
      prisma.evento.groupBy({
        by: ['tipoEvento'],
        where,
        _count: {
          tipoEvento: true,
        },
      }),
      prisma.evento.groupBy({
        by: ['createdAt'],
        where: {
          ...where,
          createdAt: {
            gte: filtros.fechaDesde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
          },
        },
        _count: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 30,
      }),
    ]);

    return {
      totalEventos,
      eventosPorTipo: eventosPorTipo.map((item: any) => ({
        tipo: item.tipoEvento,
        cantidad: item._count.tipoEvento,
      })),
      eventosPorDia: eventosPorDia.map((item: any) => ({
        fecha: item.createdAt,
        cantidad: item._count.createdAt,
      })),
    };
  }

  /**
   * Crea eventos específicos para diferentes acciones
   */
  static async crearEventoObraCreada(obraId: string, actorId: string, nombreObra: string) {
    return await this.crearEvento({
      obraId,
      tipoEvento: 'OBRA_CREADA',
      payloadJson: {
        obraId,
        nombre: nombreObra,
        actorId,
      },
      actorId,
    });
  }

  static async crearEventoObraActualizada(obraId: string, actorId: string, cambios: any) {
    return await this.crearEvento({
      obraId,
      tipoEvento: 'OBRA_ACTUALIZADA',
      payloadJson: {
        obraId,
        cambios,
        actorId,
      },
      actorId,
    });
  }

  static async crearEventoElementoAgregado(obraId: string, elementoId: string, nombre: string, categoria: string) {
    return await this.crearEvento({
      obraId,
      tipoEvento: 'ELEMENTO_AGREGADO',
      payloadJson: {
        elementoId,
        nombre,
        categoria,
      },
    });
  }

  static async crearEventoTareaCreada(obraId: string, tareaId: string, nombre: string, elementoId: string) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'TAREA_CREADA',
      payloadJson: {
        tareaId,
        nombre,
        elementoId,
      },
    });
  }

  static async crearEventoTareaEstadoCambiado(
    obraId: string,
    tareaId: string,
    estadoAnterior: string,
    estadoNuevo: string,
    actorId: string,
    motivo?: string
  ) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'TAREA_ESTADO_CAMBIADO',
      payloadJson: {
        tareaId,
        estadoAnterior,
        estadoNuevo,
        motivo,
      },
      actorId,
    });
  }

  static async crearEventoPresupuestoSubido(
    obraId: string,
    tareaId: string,
    presupuestoId: string,
    socioId: string,
    monto: number
  ) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'PRESUPUESTO_SUBIDO',
      payloadJson: {
        tareaId,
        presupuestoId,
        socioId,
        monto,
      },
    });
  }

  static async crearEventoPresupuestoAprobado(
    obraId: string,
    tareaId: string,
    presupuestoId: string,
    actorId: string
  ) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'PRESUPUESTO_APROBADO',
      payloadJson: {
        tareaId,
        presupuestoId,
      },
      actorId,
    });
  }

  static async crearEventoPresupuestoRechazado(
    obraId: string,
    tareaId: string,
    presupuestoId: string,
    actorId: string,
    motivo?: string
  ) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'PRESUPUESTO_RECHAZADO',
      payloadJson: {
        tareaId,
        presupuestoId,
        motivo,
      },
      actorId,
    });
  }

  static async crearEventoSocioAsignado(
    obraId: string,
    tareaId: string,
    socioId: string,
    socioNombre: string
  ) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'SOCIO_ASIGNADO',
      payloadJson: {
        tareaId,
        socioId,
        socioNombre,
      },
    });
  }

  static async crearEventoTareaIniciada(obraId: string, tareaId: string, socioId: string) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'TAREA_INICIADA',
      payloadJson: {
        tareaId,
        socioId,
      },
    });
  }

  static async crearEventoTareaFinalizada(obraId: string, tareaId: string, socioId: string) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'TAREA_FINALIZADA',
      payloadJson: {
        tareaId,
        socioId,
      },
    });
  }

  static async crearEventoEvidenciaSubida(
    obraId: string,
    tareaId: string,
    evidenciaId: string,
    tipo: string,
    actorId: string
  ) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'EVIDENCIA_SUBIDA',
      payloadJson: {
        tareaId,
        evidenciaId,
        tipo,
      },
      actorId,
    });
  }

  static async crearEventoTareaValidada(obraId: string, tareaId: string, actorId: string) {
    return await this.crearEvento({
      obraId,
      tareaId,
      tipoEvento: 'TAREA_VALIDADA',
      payloadJson: {
        tareaId,
      },
      actorId,
    });
  }

  static async crearEventoPagoGenerado(tareaId: string, monto: number, presupuestoId: string) {
    return await this.crearEvento({
      tareaId,
      tipoEvento: 'PAGO_GENERADO',
      payloadJson: {
        tareaId,
        monto,
        presupuestoId,
      },
    });
  }

  static async crearEventoPagoRealizado(tareaId: string, pagoId: string, actorId: string) {
    return await this.crearEvento({
      tareaId,
      tipoEvento: 'PAGO_REALIZADO',
      payloadJson: {
        tareaId,
        pagoId,
      },
      actorId,
    });
  }
}
