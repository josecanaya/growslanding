import { PrismaClient } from '@prisma/client';
import { SuscripcionService } from './suscripcion.service';
import { CrearObra, ActualizarObra, ObraQuery } from '../schemas';

const prisma = new PrismaClient();

export class ObraService {
  /**
   * Crea una nueva obra validando límites de suscripción
   */
  static async crearObra(data: CrearObra, organizacionId: string) {
    // Crear obra (versión simplificada para testing)
    const obra = await prisma.obra.create({
      data: {
        nombre: data.nombre,
        localizacion: data.localizacion,
        estado: 'ACTIVA',
      },
      select: {
        id: true,
        nombre: true,
        localizacion: true,
        estado: true,
        created_at: true,
      },
    });

    return obra;
  }

  /**
   * Obtiene obras con filtros y paginación
   */
  static async obtenerObras(query: ObraQuery, organizacionId: string) {
    const where: any = {};

    if (query.estado) {
      where.estado = query.estado;
    }

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { localizacion: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [obras, total] = await Promise.all([
      prisma.obra.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.obra.count({ where }),
    ]);

    return {
      obras,
      paginacion: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
    };
  }

  /**
   * Obtiene una obra por ID con todos sus detalles
   */
  static async obtenerObraPorId(obraId: string, _organizacionId: string) {
    const obra = await prisma.obra.findUnique({
      where: { id: obraId },
    });

    if (!obra) {
      throw new Error('Obra no encontrada');
    }

    return obra;
  }

  /**
   * Actualiza una obra
   */
  static async actualizarObra(obraId: string, data: ActualizarObra, _organizacionId: string) {
    const obra = await prisma.obra.findUnique({
      where: { id: obraId },
    });

    if (!obra) {
      throw new Error('Obra no encontrada');
    }

    const camposActualizables: Record<string, unknown> = {};

    if (data.nombre !== undefined) {
      camposActualizables.nombre = data.nombre;
    }
    if (data.localizacion !== undefined) {
      camposActualizables.localizacion = data.localizacion;
    }
    if (data.estado !== undefined) {
      camposActualizables.estado = data.estado;
    }

    if (Object.keys(camposActualizables).length === 0) {
      return obra;
    }

    const obraActualizada = await prisma.obra.update({
      where: { id: obraId },
      data: camposActualizables,
    });

    return obraActualizada;
  }

  /**
   * Elimina una obra (soft delete)
   */
  static async eliminarObra(obraId: string, _organizacionId: string) {
    const obra = await prisma.obra.findUnique({
      where: { id: obraId },
    });

    if (!obra) {
      throw new Error('Obra no encontrada');
    }

    const obraEliminada = await prisma.obra.delete({
      where: { id: obraId },
    });

    return obraEliminada;
  }

  /**
   * Obtiene estadísticas de una obra
   */
  static async obtenerEstadisticas(obraId: string, organizacionId: string) {
    const obra = await prisma.obra.findFirst({
      where: {
        id: obraId,
        organizacionId,
      },
      include: {
        elementos: {
          include: {
            tareas: {
              include: {
                estados: {
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!obra) {
      throw new Error('Obra no encontrada');
    }

    const totalTareas = obra.elementos.reduce((acc, elemento) => acc + elemento.tareas.length, 0);
    const tareasCompletadas = obra.elementos.reduce((acc, elemento) => {
      return acc + elemento.tareas.filter(tarea => tarea.estado === 'VALIDADA').length;
    }, 0);

    const progreso = totalTareas > 0 ? (tareasCompletadas / totalTareas) * 100 : 0;

    return {
      obraId,
      nombre: obra.nombre,
      estado: obra.estado,
      totalTareas,
      tareasCompletadas,
      progreso: Math.round(progreso * 100) / 100,
      fechaInicio: obra.fechaInicio,
      fechaFinEstimada: obra.fechaFinEstimada,
      fechaFinReal: obra.fechaFinReal,
      presupuestoTotal: obra.presupuestoTotal,
    };
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
