# DATA_UNIFICATION_REPORT

## Objetivo
Unificar fuente de verdad en Supabase y sacar Prisma del flujo principal.

## Estado actual

### Flujo principal obras
- `GET /api/obras`: Supabase.
- `POST /api/obras`: Supabase.
- `PATCH /api/obras`: **migrado en esta reforma a Supabase**.
- `DELETE /api/obras`: **migrado en esta reforma a Supabase**.

Resultado: CRUD principal de obras queda alineado con Supabase.

## Estrategia `organizations` vs `organizaciones`
- Canónico elegido: `organizations` (tipado en `supabase.gen.ts`).
- Fallback legacy mantenido solo donde todavía es necesario para compatibilidad:
  - `plan.service`
  - resolución de owner en wallet
  - `PermisoService` (temporal)

## Prisma en flujo principal
- Removido de mutaciones de `api/obras`.
- Sigue fuera del flujo core en módulos roadmap/legacy/scripts.

## Tipos y `as any`
- Se mantiene uso de `as any` en zonas con esquemas legacy y tablas parcialmente tipadas.
- Recomendación próxima: regenerar tipos y reducir cast gradual por dominio.

## Comando recomendado para regenerar tipos
- `supabase gen types typescript --project-id <PROJECT_ID> --schema public > apps/web/lib/types/supabase.gen.ts`

## Riesgo residual
- Mezcla de capas legacy puede seguir consultando `organizaciones` en endpoints secundarios.
