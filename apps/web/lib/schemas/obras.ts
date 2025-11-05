import { z } from 'zod';

/**
 * Schema para crear obra en Supabase
 * Incluye todos los campos capturados en el wizard
 */
export const obraSchema = z.object({
  org_id: z.string().uuid('org_id debe ser un UUID válido'),
  nombre: z.string().min(2, 'Nombre muy corto').max(200),
  localizacion: z.string().min(3, 'Dirección muy corta').optional(),
  // Campos del wizard - Paso 1 (Datos básicos)
  propietario: z.string().optional(),
  tipo_obra: z.string().optional(), // Permite cualquier string, incluyendo los tipos del enum
  latitud: z.number().min(-90).max(90).optional().nullable(),
  longitud: z.number().min(-180).max(180).optional().nullable(),
  // Campos del wizard - Paso 2 (Superficies y estructura)
  plantas: z.number().int().min(1).max(5).optional(),
  terreno: z.number().min(0).optional().nullable(),
  superficies: z.array(z.object({
    planta: z.number().int().min(1),
    cubiertos: z.number().min(0),
    descubiertos: z.number().min(0),
  })).optional(),
  // Estado (opcional, default en la BD)
  estado: z.string().optional(),
});

export type ObraInput = z.infer<typeof obraSchema>;

