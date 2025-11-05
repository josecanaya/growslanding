import { z } from 'zod';

// ===========================================
// SCHEMAS DE TAREA
// ===========================================

export const EstadoTareaSchema = z.enum(['PROPUESTA', 'PRESUPUESTADA', 'ASIGNADA', 'EN_EJECUCION', 'TERMINADA', 'VALIDADA']);

export const TipoDependenciaSchema = z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH']);

export const TipoActorSchema = z.enum(['CLIENTE_TECNICO', 'SOCIO', 'ADMIN']);

export const TipoEvidenciaSchema = z.enum(['FOTO', 'VIDEO', 'DOCUMENTO', 'FIRMA']);

export const EstadoPresupuestoSchema = z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO']);

export const CrearTareaSchema = z.object({
  elementoId: z.string().uuid('ID de elemento inválido'),
  plantillaTareaId: z.string().uuid().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  descripcion: z.string().max(1000).optional(),
  etapa: z.enum(['ESTRUCTURA', 'OBRA_GRIS', 'TERMINACIONES']),
  cantidad: z.number().positive('La cantidad debe ser positiva'),
  unidad: z.enum(['m²', 'm³', 'ml', 'unidad', 'kg', 'l']),
  duracionEstimada: z.number().int().positive().optional(),
  costoEstimado: z.number().positive().optional(),
});

export const ActualizarTareaSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  descripcion: z.string().max(1000).optional(),
  etapa: z.enum(['ESTRUCTURA', 'OBRA_GRIS', 'TERMINACIONES']).optional(),
  cantidad: z.number().positive().optional(),
  unidad: z.enum(['m²', 'm³', 'ml', 'unidad', 'kg', 'l']).optional(),
  duracionEstimada: z.number().int().positive().optional(),
  costoEstimado: z.number().positive().optional(),
  costoReal: z.number().positive().optional(),
  responsable: z.string().optional(),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA']).optional(),
  fecha_inicio_estimada: z.string().optional(),
  fecha_fin_estimada: z.string().optional(),
  fecha_inicio_real: z.string().optional(),
  fecha_fin_real: z.string().optional(),
  avance: z.number().int().min(0).max(100).optional(),
});

export const AsignarSocioSchema = z.object({
  tareaId: z.string().uuid('ID de tarea inválido'),
  socioId: z.string().uuid('ID de socio inválido'),
});

export const CambiarEstadoTareaSchema = z.object({
  tareaId: z.string().uuid('ID de tarea inválido'),
  estadoNuevo: EstadoTareaSchema,
  motivo: z.string().max(500).optional(),
});

// ===========================================
// SCHEMAS DE PRECEDENCIAS
// ===========================================

export const CrearPrecedenciaSchema = z.object({
  tareaId: z.string().uuid('ID de tarea inválido'),
  tareaPredecesoraId: z.string().uuid('ID de tarea predecesora inválido'),
  tipoDependencia: TipoDependenciaSchema.default('FINISH_TO_START'),
  lagDias: z.number().int().min(0).default(0),
});

export const ActualizarPrecedenciaSchema = z.object({
  tipoDependencia: TipoDependenciaSchema.optional(),
  lagDias: z.number().int().min(0).optional(),
});

// ===========================================
// SCHEMAS DE PRESUPUESTOS
// ===========================================

export const CrearPresupuestoSchema = z.object({
  tareaId: z.string().uuid('ID de tarea inválido'),
  socioId: z.string().uuid('ID de socio inválido'),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().length(3, 'Código de moneda inválido').default('ARS'),
  notas: z.string().max(1000).optional(),
});

export const ActualizarPresupuestoSchema = z.object({
  monto: z.number().positive().optional(),
  moneda: z.string().length(3).optional(),
  estado: EstadoPresupuestoSchema.optional(),
  notas: z.string().max(1000).optional(),
});

export const AprobarPresupuestoSchema = z.object({
  presupuestoId: z.string().uuid('ID de presupuesto inválido'),
  aprobado: z.boolean(),
  motivo: z.string().max(500).optional(),
});

// ===========================================
// SCHEMAS DE EVIDENCIAS
// ===========================================

export const CrearEvidenciaSchema = z.object({
  tareaId: z.string().uuid('ID de tarea inválido'),
  tipo: TipoEvidenciaSchema,
  archivoUrl: z.string().url('URL de archivo inválida'),
  descripcion: z.string().max(500).optional(),
});

export const ActualizarEvidenciaSchema = z.object({
  tipo: TipoEvidenciaSchema.optional(),
  archivoUrl: z.string().url().optional(),
  descripcion: z.string().max(500).optional(),
});

// ===========================================
// SCHEMAS DE PAGOS
// ===========================================

export const EstadoPagoSchema = z.enum(['PENDIENTE', 'PAGADO', 'CANCELADO']);

export const MetodoPagoSchema = z.enum(['TRANSFERENCIA', 'EFECTIVO', 'CHEQUE', 'TARJETA']);

export const CrearPagoSchema = z.object({
  tareaId: z.string().uuid('ID de tarea inválido'),
  monto: z.number().positive('El monto debe ser positivo'),
  metodoPago: MetodoPagoSchema.optional(),
  fechaVencimiento: z.date().optional(),
  observaciones: z.string().max(1000).optional(),
});

export const ActualizarPagoSchema = z.object({
  monto: z.number().positive().optional(),
  estadoPago: EstadoPagoSchema.optional(),
  metodoPago: MetodoPagoSchema.optional(),
  fechaPago: z.date().optional(),
  fechaVencimiento: z.date().optional(),
  observaciones: z.string().max(1000).optional(),
});

// ===========================================
// SCHEMAS DE LAYOUT
// ===========================================

export const ActualizarLayoutSchema = z.object({
  tareaId: z.string().uuid('ID de tarea inválido'),
  x: z.number().finite(),
  y: z.number().finite(),
  zoom: z.number().positive().default(1.0),
});

// ===========================================
// VALIDACIONES DE FSM
// ===========================================

export const TransicionEstadoSchema = z.object({
  estadoAnterior: EstadoTareaSchema.optional(),
  estadoNuevo: EstadoTareaSchema,
  actorRol: TipoActorSchema,
});

// Validaciones específicas para cada transición
export const ValidarTransicionSchema = z.object({
  tareaId: z.string().uuid(),
  estadoNuevo: EstadoTareaSchema,
  actorRol: TipoActorSchema,
}).refine((data) => {
  // PROPUESTA → PRESUPUESTADA: socio sube presupuesto o cliente lo acepta
  if (data.estadoNuevo === 'PRESUPUESTADA') {
    return data.actorRol === 'SOCIO' || data.actorRol === 'CLIENTE_TECNICO';
  }
  // PRESUPUESTADA → ASIGNADA: cliente asigna
  if (data.estadoNuevo === 'ASIGNADA') {
    return data.actorRol === 'CLIENTE_TECNICO';
  }
  // ASIGNADA → EN_EJECUCION: socio inicia
  if (data.estadoNuevo === 'EN_EJECUCION') {
    return data.actorRol === 'SOCIO';
  }
  // EN_EJECUCION → TERMINADA: socio finaliza
  if (data.estadoNuevo === 'TERMINADA') {
    return data.actorRol === 'SOCIO';
  }
  // TERMINADA → VALIDADA: cliente valida (se genera Pago)
  if (data.estadoNuevo === 'VALIDADA') {
    return data.actorRol === 'CLIENTE_TECNICO';
  }
  return false;
}, {
  message: 'Transición de estado no válida para el rol del actor',
});

// ===========================================
// TIPOS TYPESCRIPT
// ===========================================

export type EstadoTarea = z.infer<typeof EstadoTareaSchema>;
export type TipoDependencia = z.infer<typeof TipoDependenciaSchema>;
export type TipoActor = z.infer<typeof TipoActorSchema>;
export type TipoEvidencia = z.infer<typeof TipoEvidenciaSchema>;
export type EstadoPresupuesto = z.infer<typeof EstadoPresupuestoSchema>;
export type EstadoPago = z.infer<typeof EstadoPagoSchema>;
export type MetodoPago = z.infer<typeof MetodoPagoSchema>;
export type CrearTarea = z.infer<typeof CrearTareaSchema>;
export type ActualizarTarea = z.infer<typeof ActualizarTareaSchema>;
export type AsignarSocio = z.infer<typeof AsignarSocioSchema>;
export type CambiarEstadoTarea = z.infer<typeof CambiarEstadoTareaSchema>;
export type CrearPrecedencia = z.infer<typeof CrearPrecedenciaSchema>;
export type ActualizarPrecedencia = z.infer<typeof ActualizarPrecedenciaSchema>;
export type CrearPresupuesto = z.infer<typeof CrearPresupuestoSchema>;
export type ActualizarPresupuesto = z.infer<typeof ActualizarPresupuestoSchema>;
export type AprobarPresupuesto = z.infer<typeof AprobarPresupuestoSchema>;
export type CrearEvidencia = z.infer<typeof CrearEvidenciaSchema>;
export type ActualizarEvidencia = z.infer<typeof ActualizarEvidenciaSchema>;
export type CrearPago = z.infer<typeof CrearPagoSchema>;
export type ActualizarPago = z.infer<typeof ActualizarPagoSchema>;
export type ActualizarLayout = z.infer<typeof ActualizarLayoutSchema>;
export type TransicionEstado = z.infer<typeof TransicionEstadoSchema>;
export type ValidarTransicion = z.infer<typeof ValidarTransicionSchema>;
