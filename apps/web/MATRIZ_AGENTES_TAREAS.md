# MATRIZ_AGENTES_TAREAS

## Matriz ejecutiva

| Fase | Agente | Prioridad | Dependencias | Riesgo principal | Criterio de terminado |
|---|---|---|---|---|---|
| 0 | PM_ORQUESTADOR_SENIOR | P0 | Ninguna | Ambigüedad de alcance | Plan + matriz + checklist base creados |
| 1 | BACKEND_CORE_SENIOR | P0 | Fase 0 | Estados inconsistentes y cierre roto | Flujo tarea/bloque/validación/pago estable |
| 2 | SUPABASE_DATA_SENIOR | P0 | Fase 1 | Doble fuente de verdad | GET/POST obras alineados a Supabase |
| 3 | SECURITY_AUTH_SENIOR | P0 | Fase 2 | Acceso horizontal por headers | Mutaciones críticas validadas por sesión+pertenencia |
| 4 | BACKEND_CORE_SENIOR | P1 | Fase 3 | Divergencia futura de estados | Estados unificados y sin strings duplicados |
| 5 | TECH_DEBT_CLEANUP_SENIOR | P1 | Fase 4 | Legacy engañoso en productivo | Legacy aislado/documentado, sin borrados riesgosos |
| 6 | FRONTEND_SOCIO_STITCH_SENIOR | P1 | Fase 5 | UI inconsistente y mocks invisibles | Socio alineado a Stitch y sin mocks silenciosos |
| 7 | FRONTEND_CLIENTE_APP_SENIOR | P1 | Fase 6 | Dashboard/rutas inestables | Cliente estabilizado y real/mock documentado |
| 8 | QA_CORE_SENIOR | P0 | Fases 1-7 | Regresiones de flujo | Checklist core completo + GO/NO-GO |

## Tareas por agente

### PM_ORQUESTADOR_SENIOR
- Mantener plan de fases y dependencias.
- Verificar que no se mezcle backend/frontend en una fase.
- Consolidar handoffs.

### BACKEND_CORE_SENIOR (Fase 1)
- Corregir `validada` vs `validado`.
- Confirmar cierre de tarea por bloques validados.
- Revisar `TareaFsmService`, `SubtareaMvpService`, `WalletMvpService`.
- Confirmar no duplicación de movimientos wallet.

### SUPABASE_DATA_SENIOR
- Detectar Prisma en flujo principal.
- Migrar/confirmar `GET /api/obras` en Supabase.
- Resolver `organizations` vs `organizaciones`.
- Revisar y documentar tipos Supabase.

### SECURITY_AUTH_SENIOR
- Endurecer `PermisoService` y middleware.
- Evitar confianza en `x-organizacion-id`/`x-usuario-id` sin validación.
- Validar patrón `usuario -> organización -> recurso`.

### BACKEND_CORE_SENIOR (Fase 4)
- Centralizar constantes de estados.
- Alinear FSM de tareas y bloques.
- Eliminar strings duplicados de estado.

### TECH_DEBT_CLEANUP_SENIOR
- Aislar `tarea.service.ts` deprecated.
- Detectar endpoints 410, mocks productivos y dev flags riesgosos.
- Documentar Prisma restante.

### FRONTEND_SOCIO_STITCH_SENIOR
- Mapear pantallas reales vs Stitch (`reforma/stitch_socio`).
- Ordenar módulos en `app/socio` y `components/socio`.
- Eliminar mocks invisibles y documentar bloqueos API.

### FRONTEND_CLIENTE_APP_SENIOR
- Auditar `app/cliente`.
- Separar datos reales/mocks.
- Estabilizar dashboard y rutas canónicas.

### QA_CORE_SENIOR
- Ejecutar checklist core E2E funcional.
- Registrar bloqueantes y decisión GO/NO-GO.
