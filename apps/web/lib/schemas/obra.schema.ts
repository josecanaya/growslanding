import { z } from 'zod';

// ===========================================
// SCHEMAS DE OBRA
// ===========================================

export const EstadoObraSchema = z.enum(['ACTIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA']);

export const EtapaObraSchema = z.enum(['ESTRUCTURA', 'OBRA_GRIS', 'TERMINACIONES']);

export const CrearObraSchema = z.object({
  organizacionId: z.string().uuid('ID de organización inválido'),
  clienteId: z.string().uuid('ID de cliente inválido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  localizacion: z.string().max(500).optional(),
  tipo: z.string().max(50).optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFinEstimada: z.coerce.date().optional(),
  presupuestoTotal: z.number().positive('El presupuesto debe ser positivo').optional(),
  numeroPermiso: z.string().max(100).optional(),
  descripcion: z.string().max(1000).optional(),
  clienteContacto: z.string().max(200).optional(),
});

export const ActualizarObraSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  localizacion: z.string().max(500).optional(),
  tipo: z.string().max(50).optional(),
  estado: EstadoObraSchema.optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFinEstimada: z.coerce.date().optional(),
  fechaFinReal: z.coerce.date().optional(),
  presupuestoTotal: z.number().positive().optional(),
  numeroPermiso: z.string().max(100).optional(),
  descripcion: z.string().max(1000).optional(),
  clienteContacto: z.string().max(200).optional(),
});

export const ObraQuerySchema = z.object({
  organizacionId: z.string().uuid().optional(),
  estado: EstadoObraSchema.optional(),
  clienteId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().max(100).optional(),
});

// ===========================================
// SCHEMAS DE ELEMENTO DE OBRA
// ===========================================

export const CrearElementoObraSchema = z.object({
  obraId: z.string().uuid('ID de obra inválido'),
  plantillaElementoId: z.string().uuid().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  categoria: z.string().min(1, 'La categoría es requerida').max(100),
  etapaPrincipal: EtapaObraSchema,
  unidad: z.enum(['m²', 'm³', 'ml', 'unidad', 'kg', 'l']),
  cantidad: z.number().positive('La cantidad debe ser positiva'),
  costoUnitario: z.number().positive().optional(),
  descripcion: z.string().max(1000).optional(),
});

export const ActualizarElementoObraSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  categoria: z.string().min(1).max(100).optional(),
  etapaPrincipal: EtapaObraSchema.optional(),
  unidad: z.enum(['m²', 'm³', 'ml', 'unidad', 'kg', 'l']).optional(),
  cantidad: z.number().positive().optional(),
  costoUnitario: z.number().positive().optional(),
  descripcion: z.string().max(1000).optional(),
});

export const CrearElementoFaseSchema = z.object({
  elementoId: z.string().uuid('ID de elemento inválido'),
  fase: EtapaObraSchema,
  cantidad: z.number().positive('La cantidad debe ser positiva'),
  unidad: z.enum(['m²', 'm³', 'ml', 'unidad', 'kg', 'l']),
  descripcion: z.string().max(500).optional(),
});

// ===========================================
// SCHEMAS DE PLANTILLAS
// ===========================================

export const CrearPlantillaElementoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  categoria: z.string().min(1, 'La categoría es requerida').max(100),
  version: z.string().max(20).default('1.0'),
  descripcion: z.string().max(1000).optional(),
});

export const CrearPlantillaTareaSchema = z.object({
  plantillaElementoId: z.string().uuid().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  etapa: EtapaObraSchema,
  unidad: z.enum(['m²', 'm³', 'ml', 'unidad', 'kg', 'l']),
  coefOperativo: z.number().positive('El coeficiente operativo debe ser positivo'),
  duracionDefecto: z.number().int().positive().optional(),
  descripcion: z.string().max(1000).optional(),
});

// ===========================================
// VALIDACIONES DE PRECEDENCIAS
// ===========================================

export const ValidarPrecedenciasSchema = z.object({
  tareaId: z.string().uuid(),
  precedencias: z.array(z.object({
    tareaPredecesoraId: z.string().uuid(),
    tipoDependencia: z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH']),
    lagDias: z.number().int().min(0).default(0),
  })),
});

// ===========================================
// TIPOS TYPESCRIPT
// ===========================================

export type EstadoObra = z.infer<typeof EstadoObraSchema>;
export type EtapaObra = z.infer<typeof EtapaObraSchema>;
export type CrearObra = z.infer<typeof CrearObraSchema>;
export type ActualizarObra = z.infer<typeof ActualizarObraSchema>;
export type ObraQuery = z.infer<typeof ObraQuerySchema>;
export type CrearElementoObra = z.infer<typeof CrearElementoObraSchema>;
export type ActualizarElementoObra = z.infer<typeof ActualizarElementoObraSchema>;
export type CrearElementoFase = z.infer<typeof CrearElementoFaseSchema>;
export type CrearPlantillaElemento = z.infer<typeof CrearPlantillaElementoSchema>;
export type CrearPlantillaTarea = z.infer<typeof CrearPlantillaTareaSchema>;
export type ValidarPrecedencias = z.infer<typeof ValidarPrecedenciasSchema>;

