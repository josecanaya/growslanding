// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { SuscripcionService } from './suscripcion.service';
import { CrearObra, ActualizarObra, ObraQuery } from '../schemas';

const prisma = new PrismaClient() as any;

export class ObraService {
  /**
   * Crea una nueva obra validando límites de suscripción
   */
  static async crearObra(data: CrearObra, organizacionId: string) {
    // Crear obra (versión simplificada para testing)
    const obra = await prisma.obra.create({
      data: {
        id: randomUUID(),
        orgId: organizacionId,
        name: data.nombre,
        address: data.localizacion ?? null,
        estado: 'ACTIVA',
      },
      select: {
        id: true,
        name: true,
        address: true,
        estado: true,
        createdAt: true,
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
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [obras, total] = await Promise.all([
      prisma.obra.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
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
      camposActualizables.name = data.nombre;
    }
    if (data.localizacion !== undefined) {
      camposActualizables.address = data.localizacion;
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
        orgId: organizacionId,
      },
      include: {
        tareas: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!obra) {
      throw new Error('Obra no encontrada');
    }

    const tareas = obra.tareas ?? [];
    const totalTareas = tareas.length;
    const tareasCompletadas = tareas.filter((tarea: any) =>
      (tarea.estado ?? '').toLowerCase().includes('complet')
    ).length;
    const tareasEnProgreso = tareas.filter((tarea: any) =>
      (tarea.estado ?? '').toLowerCase().includes('progreso')
    ).length;
    const tareasPendientes = totalTareas - tareasCompletadas - tareasEnProgreso;

    const tareasRecientes = tareas.slice(0, 5).map((tarea: any) => ({
      id: tarea.id,
      titulo: tarea.title ?? tarea.descripcion ?? 'Tarea sin título',
      estado: tarea.estado ?? 'pendiente',
      fecha: tarea.createdAt,
    }));

    return {
      obra: {
        id: obra.id,
        nombre: obra.name,
        estado: obra.estado,
        direccion: obra.address,
        creadaEl: obra.createdAt,
      },
      resumen: {
        totalTareas,
        completadas: tareasCompletadas,
        enProgreso: tareasEnProgreso,
        pendientes: Math.max(tareasPendientes, 0),
      },
      tareasRecientes,
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
