// ?? DEPRECATED ? No usar. Reemplazado por servicios Supabase.
// @ts-nocheck
// DEPRECATED: Wrapper sobre TareaService legacy. Usar servicios Supabase directos.
// ===========================================
// SERVICIO DE TAREAS
// ===========================================

import { PrismaClient } from '@prisma/client';
import { TareaService } from './tarea.service';

const prisma = new PrismaClient();

export class TareasService {
  /**
   * Crea una nueva tarea
   */
  static async crearTarea(data: {
    obraId: string;
    elementoId: string;
    plantillaTareaId: string;
    nombre: string;
    descripcion?: string;
    unidad: string;
    cantidad: number;
    precioUnitario: number;
    fechaInicio?: Date;
    fechaFin?: Date;
    socioId?: string;
  }) {
    return await TareaService.crearTarea(data);
  }

  /**
   * Actualiza una tarea
   */
  static async actualizarTarea(
    tareaId: string,
    data: {
      nombre?: string;
      descripcion?: string;
      cantidad?: number;
      precioUnitario?: number;
      fechaInicio?: Date;
      fechaFin?: Date;
    }
  ) {
    return await TareaService.actualizarTarea(tareaId, data);
  }

  /**
   * Asigna un socio a una tarea
   */
  static async asignarSocio(tareaId: string, socioId: string) {
    return await TareaService.asignarSocio(tareaId, socioId);
  }

  /**
   * Cambia el estado de una tarea
   */
  static async cambiarEstadoTarea(
    tareaId: string,
    nuevoEstado: string,
    usuarioId: string,
    observaciones?: string
  ) {
    return await TareaService.cambiarEstadoTarea(tareaId, nuevoEstado, usuarioId, observaciones);
  }

  /**
   * Crea un presupuesto para una tarea
   */
  static async crearPresupuesto(
    tareaId: string,
    data: {
      monto: number;
      descripcion?: string;
      archivos?: string[];
    }
  ) {
    return await TareaService.crearPresupuesto(tareaId, data);
  }

  /**
   * Aprueba un presupuesto
   */
  static async aprobarPresupuesto(presupuestoId: string, usuarioId: string) {
    return await TareaService.aprobarPresupuesto(presupuestoId, usuarioId);
  }

  /**
   * Crea evidencia para una tarea
   */
  static async crearEvidencia(
    tareaId: string,
    data: {
      tipo: string;
      descripcion?: string;
      archivos: string[];
    }
  ) {
    return await TareaService.crearEvidencia(tareaId, data);
  }

  /**
   * Valida una transición de estado
   */
  static async validarTransicionEstado(
    estadoActual: string,
    estadoNuevo: string
  ): Promise<boolean> {
    return await TareaService.validarTransicionEstado(estadoActual, estadoNuevo);
  }

  /**
   * Crea un estado de tarea
   */
  static async crearEstadoTarea(
    tareaId: string,
    estado: string,
    usuarioId: string,
    observaciones?: string
  ) {
    return await TareaService.crearEstadoTarea(tareaId, estado, usuarioId, observaciones);
  }

  /**
   * Crea un pago automático
   */
  static async crearPagoAutomatico(tareaId: string, monto: number) {
    return await TareaService.crearPagoAutomatico(tareaId, monto);
  }

  /**
   * Verifica una tarea
   */
  static async verificarTarea(tareaId: string, usuarioId: string) {
    return await TareaService.verificarTarea(tareaId, usuarioId);
  }

  /**
   * Crea un evento
   */
  static async crearEvento(
    tipo: string,
    actorId: string,
    obraId?: string,
    tareaId?: string,
    datos?: any
  ) {
    return await TareaService.crearEvento(tipo, actorId, obraId, tareaId, datos);
  }
}
