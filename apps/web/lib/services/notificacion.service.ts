// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { TipoEvento, TipoNotificacion, EstadoNotificacion } from '../schemas';

type PrismaWithNotificaciones = PrismaClient & {
  notificacion: any;
  obra?: any;
  tarea?: any;
};

const prisma = new PrismaClient() as PrismaWithNotificaciones;

export class NotificacionService {
  /**
   * Crea una notificación
   */
  static async crearNotificacion(data: {
    usuarioId: string;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    obraId?: string;
    tareaId?: string;
    datos?: any;
  }) {
    const notificacion = await prisma.notificacion.create({
      data: {
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        titulo: data.titulo,
        mensaje: data.mensaje,
        obraId: data.obraId,
        tareaId: data.tareaId,
        datos: data.datos || {},
        estado: 'PENDIENTE',
      },
    });

    // Enviar notificación según el tipo
    await this.enviarNotificacion(notificacion);

    return notificacion;
  }

  /**
   * Envía una notificación según su tipo
   */
  private static async enviarNotificacion(notificacion: any) {
    try {
      switch (notificacion.tipo) {
        case 'EMAIL':
          await this.enviarEmail(notificacion);
          break;
        case 'PUSH':
          await this.enviarPush(notificacion);
          break;
        case 'IN_APP':
          await this.enviarInApp(notificacion);
          break;
      }

      // Marcar como enviada
      await prisma.notificacion.update({
        where: { id: notificacion.id },
        data: {
          estado: 'ENVIADA',
          fechaEnvio: new Date(),
        },
      });

    } catch (error) {
      console.error('Error enviando notificación:', error);
      
      // Marcar como fallida
      await prisma.notificacion.update({
        where: { id: notificacion.id },
        data: {
          estado: 'FALLIDA',
          error: error instanceof Error ? error.message : 'Error desconocido',
        },
      });
    }
  }

  /**
   * Envía notificación por email
   */
  private static async enviarEmail(notificacion: any) {
    // Aquí integrarías con un servicio de email como SendGrid, AWS SES, etc.
    console.log(`📧 Email enviado a usuario ${notificacion.usuarioId}: ${notificacion.titulo}`);
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Envía notificación push
   */
  private static async enviarPush(notificacion: any) {
    // Aquí integrarías con Firebase Cloud Messaging, OneSignal, etc.
    console.log(`📱 Push enviado a usuario ${notificacion.usuarioId}: ${notificacion.titulo}`);
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Envía notificación in-app
   */
  private static async enviarInApp(notificacion: any) {
    // Las notificaciones in-app se almacenan en la DB y se consultan desde el frontend
    console.log(`🔔 Notificación in-app creada para usuario ${notificacion.usuarioId}: ${notificacion.titulo}`);
  }

  /**
   * Obtiene notificaciones de un usuario
   */
  static async obtenerNotificacionesUsuario(
    usuarioId: string,
    options: {
      limit?: number;
      offset?: number;
      soloNoLeidas?: boolean;
    } = {}
  ) {
    const where: any = { usuarioId };

    if (options.soloNoLeidas) {
      where.leida = false;
    }

    const [notificaciones, total] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: options.limit || 20,
        skip: options.offset || 0,
      }),
      prisma.notificacion.count({ where }),
    ]);

    return {
      notificaciones,
      paginacion: {
        total,
        limit: options.limit || 20,
        offset: options.offset || 0,
        hasMore: (options.offset || 0) + (options.limit || 20) < total,
      },
    };
  }

  /**
   * Marca una notificación como leída
   */
  static async marcarComoLeida(notificacionId: string, usuarioId: string) {
    const notificacion = await prisma.notificacion.findFirst({
      where: {
        id: notificacionId,
        usuarioId,
      },
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    return await prisma.notificacion.update({
      where: { id: notificacionId },
      data: {
        leida: true,
        fechaLectura: new Date(),
      },
    });
  }

  /**
   * Procesa eventos y crea notificaciones automáticas
   */
  static async procesarEvento(evento: {
    tipoEvento: TipoEvento;
    obraId?: string;
    tareaId?: string;
    actorId?: string;
    payloadJson: any;
  }) {
    try {
      // Determinar usuarios a notificar según el tipo de evento
      const usuariosANotificar = await this.obtenerUsuariosANotificar(evento);

      // Crear notificaciones para cada usuario
      for (const usuarioId of usuariosANotificar) {
        const notificacion = await this.generarNotificacionPorEvento(evento, usuarioId);
        
        if (notificacion) {
          await this.crearNotificacion({
            usuarioId,
            tipo: 'IN_APP',
            titulo: notificacion.titulo,
            mensaje: notificacion.mensaje,
            obraId: evento.obraId,
            tareaId: evento.tareaId,
            datos: evento.payloadJson,
          });
        }
      }

    } catch (error) {
      console.error('Error procesando evento:', error);
    }
  }

  /**
   * Obtiene usuarios a notificar según el tipo de evento
   */
  private static async obtenerUsuariosANotificar(evento: {
    tipoEvento: TipoEvento;
    obraId?: string;
    tareaId?: string;
    actorId?: string;
  }): Promise<string[]> {
    const usuarios: string[] = [];

    switch (evento.tipoEvento) {
      case 'TAREA_CREADA':
      case 'TAREA_ESTADO_CAMBIADO':
      case 'PRESUPUESTO_SUBIDO':
        // Notificar al cliente técnico de la obra
        if (evento.obraId) {
          const clienteId = await this.obtenerClienteTecnicoDeObra(evento.obraId);
          if (clienteId) usuarios.push(clienteId);
        }
        break;

      case 'PRESUPUESTO_APROBADO':
      case 'PRESUPUESTO_RECHAZADO':
      case 'SOCIO_ASIGNADO':
        // Notificar al socio asignado
        if (evento.tareaId) {
          const socioId = await this.obtenerSocioAsignadoDeTarea(evento.tareaId);
          if (socioId) usuarios.push(socioId);
        }
        break;

      case 'TAREA_INICIADA':
      case 'TAREA_FINALIZADA':
      case 'EVIDENCIA_SUBIDA':
        // Notificar al cliente técnico
        if (evento.obraId) {
          const clienteId = await this.obtenerClienteTecnicoDeObra(evento.obraId);
          if (clienteId) usuarios.push(clienteId);
        }
        break;

      case 'TAREA_VALIDADA':
      case 'PAGO_GENERADO':
        // Notificar al socio
        if (evento.tareaId) {
          const socioId = await this.obtenerSocioAsignadoDeTarea(evento.tareaId);
          if (socioId) usuarios.push(socioId);
        }
        break;
    }

    // Excluir al actor del evento
    if (evento.actorId) {
      return usuarios.filter(id => id !== evento.actorId);
    }

    return usuarios;
  }

  private static async obtenerClienteTecnicoDeObra(obraId: string): Promise<string | null> {
    const obraDelegate = prisma.obra;
    if (!obraDelegate?.findUnique) {
      console.warn('[Notificaciones] Delegado de obra no disponible, omitiendo notificacion al cliente', { obraId });
      return null;
    }

    try {
      const obra = await obraDelegate.findUnique({
        where: { id: obraId },
        select: { clienteId: true },
      });
      return obra?.clienteId ?? null;
    } catch (error) {
      console.warn('[Notificaciones] No se pudo obtener clienteId para la obra', { obraId, error });
      return null;
    }
  }

  private static async obtenerSocioAsignadoDeTarea(tareaId: string): Promise<string | null> {
    const tareaDelegate = prisma.tarea;
    if (!tareaDelegate?.findUnique) {
      console.warn('[Notificaciones] Delegado de tarea no disponible, omitiendo notificacion al socio', { tareaId });
      return null;
    }

    try {
      const tarea = await tareaDelegate.findUnique({
        where: { id: tareaId },
        select: { socioId: true },
      });
      return tarea?.socioId ?? null;
    } catch (error) {
      console.warn('[Notificaciones] No se pudo obtener socioId para la tarea', { tareaId, error });
      return null;
    }
  }

  /**
   * Genera el contenido de la notificación según el evento
   */
  private static async generarNotificacionPorEvento(
    evento: { tipoEvento: TipoEvento; payloadJson: any },
    usuarioId: string
  ): Promise<{ titulo: string; mensaje: string } | null> {
    const { tipoEvento, payloadJson } = evento;

    switch (tipoEvento) {
      case 'TAREA_CREADA':
        return {
          titulo: 'Nueva tarea creada',
          mensaje: `Se ha creado una nueva tarea: ${payloadJson.nombre}`,
        };

      case 'TAREA_ESTADO_CAMBIADO':
        return {
          titulo: 'Estado de tarea actualizado',
          mensaje: `La tarea ha cambiado de ${payloadJson.estadoAnterior} a ${payloadJson.estadoNuevo}`,
        };

      case 'PRESUPUESTO_SUBIDO':
        return {
          titulo: 'Nuevo presupuesto disponible',
          mensaje: 'Un socio ha subido un presupuesto para una tarea',
        };

      case 'PRESUPUESTO_APROBADO':
        return {
          titulo: 'Presupuesto aprobado',
          mensaje: 'Tu presupuesto ha sido aprobado',
        };

      case 'PRESUPUESTO_RECHAZADO':
        return {
          titulo: 'Presupuesto rechazado',
          mensaje: 'Tu presupuesto ha sido rechazado',
        };

      case 'SOCIO_ASIGNADO':
        return {
          titulo: 'Tarea asignada',
          mensaje: `Te han asignado una nueva tarea: ${payloadJson.tareaNombre || 'Tarea'}`,
        };

      case 'TAREA_INICIADA':
        return {
          titulo: 'Tarea iniciada',
          mensaje: 'El socio ha iniciado el trabajo en la tarea',
        };

      case 'TAREA_FINALIZADA':
        return {
          titulo: 'Tarea finalizada',
          mensaje: 'El socio ha finalizado la tarea y subido evidencias',
        };

      case 'EVIDENCIA_SUBIDA':
        return {
          titulo: 'Nueva evidencia',
          mensaje: 'Se ha subido nueva evidencia para la tarea',
        };

      case 'TAREA_VALIDADA':
        return {
          titulo: 'Tarea validada',
          mensaje: 'Tu tarea ha sido validada y se ha generado el pago',
        };

      case 'PAGO_GENERADO':
        return {
          titulo: 'Pago generado',
          mensaje: `Se ha generado un pago por $${payloadJson.monto}`,
        };

      default:
        return null;
    }
  }
}
