import { z } from 'zod';

// ===========================================
// SCHEMAS DE ORGANIZACIÓN
// ===========================================

export const PlanSuscripcionSchema = z.enum(['STARTER', 'PRO', 'ENTERPRISE']);

export const RolUsuarioSchema = z.enum(['CLIENTE_TECNICO', 'SOCIO', 'ADMIN']);

export const CrearOrganizacionSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  plan: PlanSuscripcionSchema.default('STARTER'),
});

export const ActualizarOrganizacionSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  plan: PlanSuscripcionSchema.optional(),
  activa: z.boolean().optional(),
});

export const InvitarUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  rol: RolUsuarioSchema.default('CLIENTE_TECNICO'),
});

export const AceptarInvitacionSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export const CambiarRolSchema = z.object({
  usuarioId: z.string().uuid('ID de usuario inválido'),
  rol: RolUsuarioSchema,
});

// ===========================================
// SCHEMAS DE SUSCRIPCIÓN
// ===========================================

export const CrearSuscripcionSchema = z.object({
  organizacionId: z.string().uuid('ID de organización inválido'),
  plan: PlanSuscripcionSchema,
  fechaInicio: z.date().optional(),
  fechaFin: z.date().optional(),
});

export const ActualizarSuscripcionSchema = z.object({
  plan: PlanSuscripcionSchema.optional(),
  fechaFin: z.date().optional(),
  activa: z.boolean().optional(),
});

// ===========================================
// VALIDACIONES DE LÍMITES
// ===========================================

export const ValidarLimiteObrasSchema = z.object({
  organizacionId: z.string().uuid(),
  cantidadActual: z.number().int().min(0),
});

export const ValidarLimiteSociosSchema = z.object({
  organizacionId: z.string().uuid(),
  cantidadActual: z.number().int().min(0),
});

// ===========================================
// TIPOS TYPESCRIPT
// ===========================================

export type PlanSuscripcion = z.infer<typeof PlanSuscripcionSchema>;
export type RolUsuario = z.infer<typeof RolUsuarioSchema>;
export type CrearOrganizacion = z.infer<typeof CrearOrganizacionSchema>;
export type ActualizarOrganizacion = z.infer<typeof ActualizarOrganizacionSchema>;
export type InvitarUsuario = z.infer<typeof InvitarUsuarioSchema>;
export type AceptarInvitacion = z.infer<typeof AceptarInvitacionSchema>;
export type CambiarRol = z.infer<typeof CambiarRolSchema>;
export type CrearSuscripcion = z.infer<typeof CrearSuscripcionSchema>;
export type ActualizarSuscripcion = z.infer<typeof ActualizarSuscripcionSchema>;
export type ValidarLimiteObras = z.infer<typeof ValidarLimiteObrasSchema>;
export type ValidarLimiteSocios = z.infer<typeof ValidarLimiteSociosSchema>;
