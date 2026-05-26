# ORGANIZATION_MIGRATION — `organizations` vs `organizaciones`

## Hallazgos

Referencias detectadas en `apps/web` (no exhaustivo de todo el monorepo):

| Área | Uso `organizations` | Uso `organizaciones` |
|------|-----------------------|---------------------|
| `lib/services/permiso.service.ts` | Primaria | Fallback `owner_user_id` |
| `lib/orgs.ts` | Listados accesibles | — |
| `lib/cliente-wallet-auth.ts` | Titular cliente | — |
| `lib/services/plan.service.ts` | Plan | Fallback legacy |
| `app/api/wallet/*.ts` (saldo/mov/debit/credit) | Resolver org | Fallback |
| `app/api/tareas-subtareas/[id]/enviar-validar/route.ts` | helper notif titular | fallback |
| Scripts Prisma (`clean-demo`, etc.) | SQL directo ambas tablas | Compat QA |

En **tipos Supabase gen** aparece **`organizations`** como relación oficial de FK (`supabase.gen.ts`).

## Decisión oficial (propuesta producto)

**Canónico:** tabla **`organizations`** como fuente única para `org_id`, `user_id` titular, nombre, plan (según columnas existentes).

**Fuente Legacy:** tabla **`organizaciones`** debe **desaparecer del código aplicación** después de migración BD one-shot.

## Por qué no se elimina en este cambio

- Requiere **migración SQL** que:
  - Copie filas huérfanas `organizaciones` → `organizations` (mapping id estable).
  - Actualice FKs en tablas hijas (`obras`, `tareas`, `socios`, etc.).
  - Reconcilie usuarios (`owner_user_id` → `user_id`).
- Borrar compatibilidad en código sin migración rompe sesiones/org_id en proyectos ya desplegados.

## Pasos ordenados

1. **Snapshot producción**: conteos por tabla, mismatches `organizations.id` vs `organizaciones.id`.
2. **Script único**: `migrate_organizaciones_to_organizations.sql` (transacción, rollback preparado).
3. **Ventana código:** Quitar todas las fallback queries `organizaciones` en mismo release que corrida migrate.
4. **Verificar:** `PermisoService`, rutas wallet, plan, onboarding, webhook auth.

## Estado en repo tras este plan doc

Compatibilidad **temporal mantenida** en código donde ya existía; **no nueva deuda**.
