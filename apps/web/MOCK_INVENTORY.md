# MOCK_INVENTORY — Grows (`apps/web`)

Inventario de datos ficticios, fixtures y modo demo detectados por búsqueda (`MOCK_`, `USE_MOCK`, `DEMO`, `STUB`, `FIXTURE`, `FAKE`) y revisión puntual.

**Última actualización:** saneamiento inicial aplicado — ver `ARCHITECTURE_CLEANUP_REPORT.md`.

| Archivo | Componente / módulo | Activación | Impacto |
|---------|---------------------|------------|---------|
| `lib/mocks/socioMockData.ts` | Origen mocks socio | ~~`NEXT_PUBLIC_SOCIO_USE_MOCK`~~ Ahora **`NODE_ENV !== 'production'`** + mismo flag | Ahora/desbloqueados en prod |
| `lib/mocks/demoVideoData.ts` | Video demo cliente | ~~`NEXT_PUBLIC_DEMO_VIDEO` / `?demo=1`~~ Desactivado en **`production`** | TareasSection / Organiza / Asignar |
| `lib/mocks/obrasDemoVideo.ts` | Reexport demo | Depende `isDemoVideoEnabled()` | Listados demo |
| `app/socio/ahora/demo/page.tsx` | Pantalla demo explícita | Ruta `/socio/ahora/demo` | ✅ Mock permitido por ruta |
| `components/socio/ahora/AhoraJornadaActivaStitch.tsx` | Stitch | `mode==='demo'` usa `MOCK_AHORA_STITCH` | Solo demo route / props |
| `components/socio/sections/AhoraSection.tsx` | Ahora vivo | `USE_MOCK_DATA` | Bloqueado mock en prod |
| `components/socio/home/HomeSolicitudesSection.tsx` | Panel home | `USE_MOCK_DATA` | Prod sin mock |
| `components/socio/home/TrabajosHoySection.tsx` | Home | `USE_MOCK_DATA` | Prod sin mock |
| `components/socio/home/AccesosRapidosGrid.tsx` | Accesos | `USE_MOCK_DATA` para lista inicial | Sin mock prod |
| `components/socio/MensajeriaSocio.tsx` | Chat | `USE_MOCK_DATA` | Sin mock prod |
| `components/socio/oportunidades/SolicitudOportunidadCard.tsx` | Cards | ramas si `USE_MOCK_DATA` | Sin mock prod |
| `app/socio/oportunidades/page.tsx` | Oportunidades | `USE_MOCK_DATA` | Sin mock prod |
| `app/socio/presupuestos/page.tsx` | Presupuestos | `USE_MOCK_DATA \|\| FORCE_PRESUPUESTOS_MOCK` (force también gated prod) | Sin mock prod |
| `app/socio/billetera/page.tsx` | Billetera | `USE_MOCK_DATA` | Sin mock prod |
| `app/socio/presupuestos/ejemplo/page.tsx` | Ejemplo UI | Fixtures locales | **Ruta ejemplo** — no productiva |
| `components/cliente/TareasSection.tsx` | Tareas cliente | `isDemoVideoEnabled()` | Off en prod |
| `components/cliente/AsignarSection.tsx` | Asignar | `DEMO_OBRA_CASA_ID` + `isDemoVideoEnabled()` | Demo solo no-prod explícito |
| `components/clienteTecnico/OrganizaSection.tsx` | Organiza | `DEMO_OBRA_CASA_ID` + `isDemoVideoEnabled()` | Atajos demo off prod |
| `components/cliente/home/HomeDesktop.tsx` | Home cliente | **`useClienteObras`** (`GET /api/obras`) + **`useClienteObraTareasResumen`** (`GET /api/tareas`) | Sin fixtures; errores explícitos; escrow sin datos inventados (0 hasta integrar fuente financiera) |
| `components/cliente/home/HomeMobile.tsx` | idem | idem | idem |
| `components/cliente/mobile/MobileHome.tsx` | Home móvil | idem (`lib/cliente/home/kpisFromTareas.ts` agrupa KPIs reales desde tareas) | Presupuesto semanal placeholder vacío hasta API presupuesto (no mocks) |
| `components/cliente/CargaElementosPanel.tsx` | Elementos | Mock solo con `isDemoVideoEnabled()` | Prod: no inyecta filas |
| `components/cliente/Legajo/LegajoSection.tsx` | Legajo | Categorías mock solo demo habilitado | Prod: fetch real |
| `components/obras/resumen/ObraResumenContainer.tsx` | Resumen obra | Pisos/categorías demo solo `isDemoVideoEnabled()` | Prod: datos reales |
| `components/cliente/DetalleObra.tsx` | Detalle | `MOCK_PLANTAS_DEMO` (revisar en siguientes iteraciones) | Pendiente acotar |
| `scripts/seed-demo.ts` | Seed CLI | Script | ✅ No es runtime productivo |
| `web/__tests__/**` | Vitest | Tests | ✅ Permitido |

## Regla operativa

- **Producción:** ningún flag público activa mocks de negocio; `isDemoVideoEnabled()` es `false`.
- **Desarrollo:** opcional `NEXT_PUBLIC_SOCIO_USE_MOCK`, `NEXT_PUBLIC_DEMO_VIDEO`, `?demo=1` donde aún existan demos aisladas (el home cliente consumido desde `/api/obras` ya no usa fixtures locales).

### Home cliente (`HomeDesktop`, `HomeMobile`, `MobileHome`)

- Lista: **`useClienteObras`** (misma `fetch` que `app/cliente/obras/page.tsx`).
- KPI tareas/actividad: **`useClienteObraTareasResumen`** + `lib/cliente/home/kpisFromTareas.ts` (derivado de `/api/tareas`). Presupuesto móvil permanece sin serie inventada (arrays vacíos / cero hasta API de obra/presupuesto).

## Pendiente (próxima iteración)

- Mover componentes puramente mock a `app/demo/**` o `stories/**` si siguen sin usarse en rutas productivas.
- `DetalleObra` / otros `MOCK_*` menores no listados arriba: segundo pase `grep`.
