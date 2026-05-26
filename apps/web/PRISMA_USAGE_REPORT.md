# PRISMA_USAGE_REPORT — Grows (`apps/web`)

Objetivo final: stack **solo Supabase Auth + Postgres + Storage** en el core runtime.

## Archivos usando `PrismaClient` / `prisma.`

### A. Crítico (impacto datos producto si se usa desde UI)

| Archivo | Motivo | Reemplazo Supabase objetivo |
|---------|--------|----------------------------|
| `lib/services/tarea.service.ts` | CRUD legado prisma `tarea`, presupuesto, evidencia, eventos | YA existe API Supabase `/api/tareas` — migrar llamadas residual |
| `lib/services/obra.service.ts` | CRUD prisma `obra` | `/api/obras`, queries direct |
| `lib/services/evento.service.ts` | `evento` prisma | tabla `eventos` via service supabase existente |

### B. Legacy / interno MVP

| Archivo | Motivo | Acción |
|---------|--------|--------|
| `lib/services/notificacion.service.ts` | dual Prisma + supabase `.from('notificaciones')` | Unificar sólo Supabase inserts |
| `lib/services/tareas.service.ts` | Lista prisma | Auditoría usages |
| `lib/services/cpm.service.ts` | `tarea` / cache obra | Migración larga Canvas/CPM |
| `lib/services/suscripcion.service.ts` | `organizacion` prisma | Ya hay `organizations` supabase |

### C. Roadmap aparte producto obra/tarea principal

| Archivo | Tablas prisma |
|---------|---------------|
| `app/api/roadmap/tareas/route.ts` | `roadmapTarea`, `roadmapObjetivo` |
| `app/api/roadmap/objetivos/route.ts` | idem |
| `scripts/seed-roadmap.ts` | Seeds |

Aislar en módulo `roadmap` o migrar lectura a vistas Supabase.

### D. Scripts / infra (mantener hasta retirada Prisma)

| Archivo |
|---------|
| `lib/prisma.ts`, `scripts/*.ts`, `prisma/*.ts` |

### E. Imports indirectos

`lib/audit.ts` → prisma evento crear.

---

## Política

1. **Ningún nuevo endpoint HTTP** debe instanciar `PrismaClient` (regla equipo).
2. Repositorios sugeridos: ver `lib/repositories/README.md` (solo guía este PR si existe).
3. Retirada `prisma` del `package.json` cuando **grep** sobre `apps/web` excluding scripts = 0 y build ok.
