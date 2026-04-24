# RESUMEN_REFORMA_PROFUNDA

## Cambios reales aplicados

### Backend core y seguridad
- `api/tareas/[id]/route.ts`
  - GET/PATCH migrados de headers legacy a sesión real de Supabase.
  - Validación por organizaciones permitidas del usuario.
- `api/tareas/[id]/asignar-cuadrilla/route.ts`
  - Migrado a sesión real + validación de rol cliente en organización de la tarea.
- `api/tareas-subtareas/[id]/validar/route.ts`
  - Validación de estado con constante de dominio compartida.
- `api/wallet/creditos/route.ts`
  - Bloqueo de mutaciones si el `owner_id` no pertenece al usuario autenticado.
- `api/wallet/debitos/route.ts`
  - Misma validación de ownership para evitar mutaciones cruzadas.
- `api/payments/webhook/route.ts`
  - Validación opcional de secreto (`MP_WEBHOOK_SECRET`).

### Datos / Supabase
- `api/obras/route.ts`
  - `PATCH` y `DELETE` migrados de Prisma a Supabase.
  - CRUD principal de obras queda alineado a una sola fuente.
  - QA final: `GET/PATCH/DELETE` ahora requieren sesión y filtran por organizaciones permitidas del usuario.

### Dominio de estados
- `lib/domain/estados-core.ts`
  - Nuevo `ESTADO_BLOQUE_PARA_VALIDAR`.
- `lib/services/subtarea-mvp.service.ts`
  - Uso de constantes de estado compartidas.

### Corrección QA final (estática)
- `components/socio/oportunidades/SolicitudOportunidadCard.tsx`
  - Ajuste de tipado de rutas (`Route`) para eliminar error TypeScript.
  - `tsc --noEmit` queda en verde en `apps/web`.

## Archivos de documentación creados/actualizados
- `REFORMA_ESTADO_ACTUAL.md`
- `HANDOFF_BACKEND_CORE_REFORMA_PROFUNDA.md`
- `DATA_UNIFICATION_REPORT.md`
- `PRISMA_REMAINING_USAGE.md`
- `SECURITY_REVIEW_GROWS.md`
- `HANDOFF_SECURITY_AUTH_REFORMA_PROFUNDA.md`
- `MOCKS_REMAINING_REPORT.md`
- `LEGACY_REMAINING_REPORT.md`
- `TECH_DEBT_REPORT.md`
- `FRONT_SOCIO_IMPLEMENTATION_PLAN.md`
- `FRONT_BLOCKERS.md` (actualizado)
- `HANDOFF_FRONTEND_SOCIO_REFORMA_PROFUNDA.md`
- `FRONT_CLIENTE_AUDIT.md`
- `HANDOFF_FRONTEND_CLIENTE_REFORMA_PROFUNDA.md`
- `CHECKLIST_QA_CORE.md` (actualizado)
- `GO_NO_GO.md` (actualizado)

## Riesgos corregidos
- Reducción de riesgo de acceso horizontal en mutaciones críticas de tareas/wallet.
- Eliminación de Prisma en mutaciones principales de obras.
- Control de estado compartido para validación de subtareas.

## Riesgos restantes
- Endpoints secundarios aún dependen de `x-organizacion-id`/`x-usuario-id`.
- Módulos cliente/socio con deuda de mocks.
- Servicios legacy Prisma (`tarea.service`, `tareas.service`) siguen presentes (documentados).

## Clasificación de búsquedas finales QA
- **Crítico (corregido):**
  - `api/obras/route.ts` permitía operaciones amplias sin scope por org en `GET/PATCH/DELETE`; corregido con sesión + `resolveAllowedOrgIds`.
- **Aceptable temporal:**
  - `NEXT_PUBLIC_DEV_MODE` presente en `middleware.ts`/`lib/config.ts` como control de entorno (sin bypass productivo activo).
  - `as any` en handlers Supabase para compatibilidad de tipado; deuda registrada.
- **Pendiente documentado:**
  - `x-organizacion-id` / `x-usuario-id` en rutas secundarias no-core.
  - `prisma.` en módulos legacy/no-core y scripts.
  - coexistencia `organizaciones` / `organizations` por estrategia de transición de datos.
- **Falso positivo / esperado de dominio:**
  - coexistencia `validada` (tarea) y `validado` (bloque) es correcta por semántica del flujo.

## Qué quedó pendiente
- Migración de seguridad en rutas secundarias (`socios`, `notificaciones`, `mensajes`, `cuadrillas`).
- Reducción progresiva de `as any`.
- Limpieza/migración total de Prisma fuera de módulos legacy/no-core.

## Qué debe hacer QA
1. Ejecutar `CHECKLIST_QA_CORE.md` completo en entorno integrado.
2. Verificar específicamente:
   - cierre tarea por último bloque validado,
   - no duplicación de pagos,
   - permisos cruzados entre organizaciones,
   - CRUD de obras (GET/POST/PATCH/DELETE) en Supabase.
3. Emitir `QA_PHASE_REPORT.md` con evidencia.

## Estado final
**READY FOR MANUAL QA**

## Próximo paso recomendado
Siguiente iteración enfocada en: seguridad de endpoints secundarios + saneamiento de mocks cliente.
