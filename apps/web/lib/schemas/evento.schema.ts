import { z } from 'zod';

// ===========================================
// SCHEMAS DE EVENTOS
// ===========================================

export const TipoEventoSchema = z.enum([
  'OBRA_CREADA',
  'OBRA_ACTUALIZADA',
  'ELEMENTO_AGREGADO',
  'TAREA_CREADA',
  'TAREA_ESTADO_CAMBIADO',
  'PRESUPUESTO_SUBIDO',
  'PRESUPUESTO_APROBADO',
  'PRESUPUESTO_RECHAZADO',
  'SOCIO_ASIGNADO',
  'TAREA_INICIADA',
  'TAREA_FINALIZADA',
  'EVIDENCIA_SUBIDA',
  'TAREA_VALIDADA',
  'PAGO_GENERADO',
  'PAGO_REALIZADO'
]);

export const CrearEventoSchema = z.object({
  obraId: z.string().uuid().optional(),
  tareaId: z.string().uuid().optional(),
  tipoEvento: TipoEventoSchema,
  payloadJson: z.record(z.any()),
  actorId: z.string().uuid().optional(),
});

export const EventoQuerySchema = z.object({
  obraId: z.string().uuid().optional(),
  tareaId: z.string().uuid().optional(),
  tipoEvento: TipoEventoSchema.optional(),
  actorId: z.string().uuid().optional(),
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ===========================================
// SCHEMAS DE NOTIFICACIONES
// ===========================================

export const TipoNotificacionSchema = z.enum([
  'EMAIL',
  'PUSH',
  'IN_APP'
]);

export const EstadoNotificacionSchema = z.enum([
  'PENDIENTE',
  'ENVIADA',
  'ENTREGADA',
  'FALLIDA'
]);

export const CrearNotificacionSchema = z.object({
  usuarioId: z.string().uuid('ID de usuario inválido'),
  tipo: TipoNotificacionSchema,
  titulo: z.string().min(1).max(200),
  mensaje: z.string().min(1).max(1000),
  obraId: z.string().uuid().optional(),
  tareaId: z.string().uuid().optional(),
  datos: z.record(z.any()).optional(),
});

export const ActualizarNotificacionSchema = z.object({
  estado: EstadoNotificacionSchema.optional(),
  fechaEnvio: z.date().optional(),
  fechaEntrega: z.date().optional(),
  error: z.string().max(500).optional(),
});

// ===========================================
// SCHEMAS DE AUDITORÍA
// ===========================================

export const AuditoriaQuerySchema = z.object({
  entidad: z.enum(['OBRA', 'TAREA', 'ELEMENTO', 'PAGO']),
  entidadId: z.string().uuid(),
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
  actorId: z.string().uuid().optional(),
  accion: z.string().max(50).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const CrearAuditoriaSchema = z.object({
  entidad: z.enum(['OBRA', 'TAREA', 'ELEMENTO', 'PAGO']),
  entidadId: z.string().uuid(),
  accion: z.string().min(1).max(50),
  actorId: z.string().uuid(),
  datosAnteriores: z.record(z.any()).optional(),
  datosNuevos: z.record(z.any()).optional(),
  ip: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
});

// ===========================================
// TIPOS TYPESCRIPT
// ===========================================

export type TipoEvento = z.infer<typeof TipoEventoSchema>;
export type CrearEvento = z.infer<typeof CrearEventoSchema>;
export type EventoQuery = z.infer<typeof EventoQuerySchema>;
export type TipoNotificacion = z.infer<typeof TipoNotificacionSchema>;
export type EstadoNotificacion = z.infer<typeof EstadoNotificacionSchema>;
export type CrearNotificacion = z.infer<typeof CrearNotificacionSchema>;
export type ActualizarNotificacion = z.infer<typeof ActualizarNotificacionSchema>;
export type AuditoriaQuery = z.infer<typeof AuditoriaQuerySchema>;
export type CrearAuditoria = z.infer<typeof CrearAuditoriaSchema>;
