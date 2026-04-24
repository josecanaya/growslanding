# CHECKLIST_QA_CORE

## Uso
Checklist obligatorio al cierre de cada fase y validación final.

Estados permitidos: `PENDIENTE | OK | BLOQUEADO | N/A`

## Core de negocio

| Item | Estado | Evidencia | Notas |
|---|---|---|---|
| Login cliente | PENDIENTE |  |  |
| Login socio | PENDIENTE |  |  |
| Crear obra | PENDIENTE |  |  |
| Listar obra | PENDIENTE |  |  |
| Crear tarea | PENDIENTE |  |  |
| Asignar socio | PENDIENTE |  |  |
| Socio ve tarea | PENDIENTE |  |  |
| Socio inicia tarea/bloque | PENDIENTE |  |  |
| Socio sube evidencia | PENDIENTE |  |  |
| Cliente valida bloque | PENDIENTE |  |  |
| Tarea cierra si corresponde | PENDIENTE |  |  |
| Wallet registra movimiento | PENDIENTE |  |  |
| No hay pagos duplicados | PENDIENTE |  |  |
| No hay mocks en producción | PENDIENTE |  |  |
| No hay acceso cruzado entre organizaciones | PENDIENTE |  |  |
| Build/lint sin errores nuevos | OK | Linter de archivos modificados | Build full pendiente |

## Validaciones técnicas por fase

| Fase | Validación | Estado | Notas |
|---|---|---|---|
| Fase 1 | Estados tarea/bloque consistentes (`validada`/`validado`) | OK | Corregida comparación en transition + servicios |
| Fase 1 | Cierre automático de tarea con bloques validados | OK | Validación de cierre usa estado final de bloque `validado` |
| Fase 1 | Wallet sin duplicación de movimientos | OK | Guard existente por subtarea/origen mantenido |
| Fase 2 | GET/POST obras usan misma fuente (Supabase) | OK | GET migrado a Supabase; POST ya estaba en Supabase |
| Fase 2 | PATCH/DELETE obras usan Supabase | OK | Prisma eliminado de mutaciones de obras |
| Fase 2 | Obras GET/PATCH/DELETE con sesión y scope por organización | OK | Se corrigió acceso cruzado: ahora exige sesión y filtra por organizaciones permitidas |
| Fase 3 | Handlers críticos no confían solo en headers | OK | `/api/tareas` migrado a sesión real; hardening en permisos |
| Fase 3 | `tareas/[id]` y `asignar-cuadrilla` con sesión real | OK | Eliminado uso de headers legacy |
| Fase 3 | `wallet/creditos` y `wallet/debitos` validan ownership | OK | Bloqueo de mutación cruzada por owner_id |
| Fase 4 | Estados centralizados y sin duplicados | OK | Nuevo módulo `lib/domain/estados-core.ts` |
| Fase 4 | `validar subtarea` usa constante de estado compartida | OK | `ESTADO_BLOQUE_PARA_VALIDAR` aplicado |
| Fase 5 | Legacy/mocks/documentación de deuda actualizada | OK | Mock socio global desactivado + handoff de deuda |
| Fase 6 | Socio alineado con Stitch, sin mocks invisibles | BLOQUEADO | Mensajes y estados transversales incompletos en Stitch |
| Fase 7 | Cliente estabilizado y rutas canónicas claras | BLOQUEADO | Persisten rutas cliente con mock/demo |

## Cierre QA

- Riesgos residuales:
  - Front cliente con fuerte acople a mocks.
  - Handlers legacy con headers inseguros todavía presentes fuera de rutas tocadas.
- Bloqueantes:
  - Falta material canónico de mensajes en Stitch.
  - QA funcional E2E completo aún no ejecutado.
- Decisión final:
  - `READY FOR MANUAL QA` (no GO productivo aún).

## QA estática final (2026-04-23)

| Control | Resultado | Evidencia |
|---|---|---|
| TypeScript (`tsc --noEmit`) | OK | Compila sin errores luego de fix de rutas tipadas en `SolicitudOportunidadCard.tsx` |
| Revisión estática endpoints críticos listados | OK | Sin imports rotos ni constantes inconsistentes en handlers revisados |
| Búsqueda `NEXT_PUBLIC_DEV_MODE` | Aceptable temporal | Queda en `middleware.ts`/`lib/config.ts` como guardas de entorno, sin activar bypass productivo |
| Búsqueda `x-organizacion-id` / `x-usuario-id` | Pendiente documentado | Persisten en rutas secundarias legacy (`socios`, `mensajes`, `notificaciones`, `cuadrillas`) |
| Búsqueda `prisma.` | Pendiente documentado | Persisten usos en módulos legacy/no-core y scripts |
| Búsqueda `as any` | Aceptable temporal | Uso extendido para compatibilidad tipada Supabase, deuda registrada |
