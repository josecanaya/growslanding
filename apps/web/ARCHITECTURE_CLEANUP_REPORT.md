# ARCHITECTURE_CLEANUP_REPORT — Saneamiento arquitectónico Grows (`apps/web`)

Informe consolidado del plan QA (sin nuevas features, sin cambiar UX). Detalle extendido por frente:

- `MOCK_INVENTORY.md`
- `WALLET_ANALYSIS.md`
- `ORGANIZATION_MIGRATION.md`
- `PRISMA_USAGE_REPORT.md`

**Última actualización:** cliente home/mobile cableado a **`GET /api/obras`** (+ **`GET /api/tareas`** para KPI desde tareas); sin fixtures locales; **`app/cliente/obras`** usa **`useClienteObras`** compartido; `tsc` ok.

---

## Mocks eliminados / acotados

### Cantidad / alcance

- **Mocks / fixtures cliente home:** **eliminados** en código (sin `NODE_ENV`-fixtures); tres pantallas pasan por hooks compartidos y APIs reales.

### Hooks y utilidades nuevas

| Artefacto | Rol |
|-----------|-----|
| `lib/hooks/useClienteObras.ts` | Lista obras igual que página `/cliente/obras`; exporta **`fetchClienteObras`** opcional |
| `lib/hooks/useClienteObraTareasResumen.ts` | Tareas por obra+org |
| `lib/cliente/home/kpisFromTareas.ts` | Agregaciones puras desde filas `/api/tareas` |

### Archivos tocados (home cliente)

| Archivo | Comportamiento |
|---------|----------------|
| `components/cliente/home/HomeDesktop.tsx` | Obras desde API; error rojo si falla carga obras; aviso ámbar si fallan tareas; empty state creación obra; escrow en 0 |
| `components/cliente/home/HomeMobile.tsx` | Igual |
| `components/cliente/mobile/MobileHome.tsx` | Igual fuente datos; KPI móvil desde tareas; presupuesto semanal sin datos sintéticos |
| `app/cliente/obras/page.tsx` | Reutiliza **`useClienteObras`** |

### Pendientes explícitos

- Segundo pase sobre `MOCK_*` residual (ej. `DetalleObra`).
- Mover mocks puramente cosméticos a `app/demo/**`, `**/stories/**` o tests si aplican.

---

## Wallet

| Aspecto | Estado |
|---------|--------|
| **Modelo final (decisión código)** | Fachada única **`WalletService`** recomendada; **dos familias de tablas** siguen coexistiendo hasta migración física decidida por negocio |
| **Tablas finales físicas** | `cliente_wallets` / `cliente_wallet_movimientos` (cliente técnico / escrow org) **y** `wallet_saldos` / `wallet_movimientos` (socio ejecutable) |
| **Fuente única conceptual** | `WALLET_ANALYSIS.md` documenta uso, endpoints y plan de delegación |

**No migrado físicamente** en esta fase por riesgo al flujo Obra → … → Wallet → Pago.

---

## Organizaciones

| Aspecto | Estado |
|---------|--------|
| **Tabla oficial (objetivo)** | **`organizations`** |
| **Referencias legacy** | `organizaciones` puede seguir como fallback donde ya existía; eliminación de código cuando exista migración SQL one-shot |

Ver pasos ordenados en `ORGANIZATION_MIGRATION.md`.

---

## Prisma

| Aspecto | Estado |
|---------|--------|
| **Usos eliminados del core** | No retirados por completo; política definida sin nuevos endpoints con Prisma |
| **Usos pendientes** | Listados como críticos / legacy / roadmap en `PRISMA_USAGE_REPORT.md` |

**Repos:** guía esperada en `lib/repositories/README.md` (estructura sugerida: `ObrasRepository`, etc.) — implementación incremental cuando se migren rutas.

---

## Riesgos remanentes

1. **Cliente home KPI secundarios:** presupuesto/escrow en cards legacy siguen sin integrar billetera u obra económica; se muestra **cero/vacío** (no mocks). ModalActividad con semanas todas en **0** si no hay cerradas válidas histórico.
2. **Wallet:** doble modelo en BD hasta migración formal; inconsistencias solo mitigadas por política de servicios.
3. **`organizaciones`:** drift si no se ejecuta migración SQL única antes de borrar fallbacks en código.
4. **Prisma:** servicios compartidos (tareas/obra/evento) pueden seguir activando el cliente hasta migración línea por línea.

---

## Próximos pasos (prioridad alineada al plan QA)

1. Completar retirada/mock-gating residual (`grep` MOCK/FAKE/DEMO en rutas fuera de `demo|stories|tests`).
2. Implementar **`WalletService`** fachada y redirigir endpoints existentes solo a esa capa (sin unificar tablas aún si no hay decisión BD).
3. Ejecutar **migración SQL** organizaciones → `organizations` + limpieza de fallbacks en el mismo release.
4. Migrar **notificaciones** y rutas roadmap según `PRISMA_USAGE_REPORT`; añadir repositorios bajo `lib/repositories/`; eliminar Prisma cuando el grep sobre runtime quede vacío.
