// ===========================================
// EXPORTAR TODOS LOS SCHEMAS
// ===========================================

// Organización
export * from './organizacion.schema';

// Obra
export * from './obra.schema';

// Tarea
export * from './tarea.schema';

// Evento
export * from './evento.schema';

// ===========================================
// SCHEMAS COMUNES
// ===========================================

import { z } from 'zod';

export const PaginacionSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const OrdenSchema = z.object({
  campo: z.string().min(1),
  direccion: z.enum(['ASC', 'DESC']).default('ASC'),
});

export const BusquedaSchema = z.object({
  query: z.string().min(1).max(100),
  campos: z.array(z.string()).optional(),
});

export const FiltroFechaSchema = z.object({
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
});

export const RespuestaApiSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  paginacion: z.object({
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    hasMore: z.boolean(),
  }).optional(),
});

// ===========================================
// TIPOS COMUNES
// ===========================================

export type Paginacion = z.infer<typeof PaginacionSchema>;
export type Orden = z.infer<typeof OrdenSchema>;
export type Busqueda = z.infer<typeof BusquedaSchema>;
export type FiltroFecha = z.infer<typeof FiltroFechaSchema>;
export type RespuestaApi = z.infer<typeof RespuestaApiSchema>;
