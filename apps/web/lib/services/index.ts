// ===========================================
// EXPORTAR TODOS LOS SERVICIOS
// ===========================================

export { SuscripcionService } from './suscripcion.service';
export { ObraService } from './obra.service';
export { TareaService } from './tarea.service';
export { EventoService } from './evento.service';
export { NotificacionService } from './notificacion.service';
export { CPMService } from './cpm.service';

// ===========================================
// SERVICIOS ADICIONALES
// ===========================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CacheService {
  /**
   * Actualiza el cache de una obra
   */
  static async actualizarCacheObra(obraId: string) {
    const obra = await prisma.obra.findUnique({
      where: { id: obraId },
      include: {
        elementos: {
          include: {
            tareas: true,
          },
        },
      },
    });

    if (!obra) return;

    const totalTareas = obra.elementos.reduce((acc, elemento) => acc + elemento.tareas.length, 0);
    const tareasCompletadas = obra.elementos.reduce((acc, elemento) => {
      return acc + elemento.tareas.filter(tarea => tarea.estado === 'VALIDADA').length;
    }, 0);

    const progreso = totalTareas > 0 ? (tareasCompletadas / totalTareas) * 100 : 0;

    await prisma.obraCache.upsert({
      where: { obraId },
      create: {
        obraId,
        totalTareas,
        tareasCompletadas,
        progreso,
        ultimaActualizacion: new Date(),
      },
      update: {
        totalTareas,
        tareasCompletadas,
        progreso,
        ultimaActualizacion: new Date(),
      },
    });
  }

  /**
   * Obtiene el cache de una obra
   */
  static async obtenerCacheObra(obraId: string) {
    return await prisma.obraCache.findUnique({
      where: { obraId },
    });
  }
}

export class PermisosService {
  /**
   * Verifica si un usuario tiene permisos para una acción
   */
  static async verificarPermiso(
    usuarioId: string,
    organizacionId: string,
    accion: string,
    recurso?: string
  ): Promise<boolean> {
    const miembro = await prisma.miembroOrganizacion.findFirst({
      where: {
        usuarioId,
        organizacionId,
        activo: true,
      },
    });

    if (!miembro) return false;

    // Admin tiene todos los permisos
    if (miembro.rol === 'ADMIN') return true;

    // Permisos específicos por rol
    switch (miembro.rol) {
      case 'CLIENTE_TECNICO':
        return this.verificarPermisoClienteTecnico(accion, recurso);
      case 'SOCIO':
        return this.verificarPermisoSocio(accion, recurso);
      default:
        return false;
    }
  }

  private static verificarPermisoClienteTecnico(accion: string, recurso?: string): boolean {
    const permisos = [
      'crear_obra',
      'actualizar_obra',
      'eliminar_obra',
      'crear_elemento',
      'actualizar_elemento',
      'crear_tarea',
      'actualizar_tarea',
      'asignar_socio',
      'aprobar_presupuesto',
      'rechazar_presupuesto',
      'validar_tarea',
      'crear_pago',
      'actualizar_pago',
    ];

    return permisos.includes(accion);
  }

  private static verificarPermisoSocio(accion: string, recurso?: string): boolean {
    const permisos = [
      'ver_tarea',
      'actualizar_tarea',
      'crear_presupuesto',
      'actualizar_presupuesto',
      'iniciar_tarea',
      'finalizar_tarea',
      'subir_evidencia',
    ];

    return permisos.includes(accion);
  }
}
