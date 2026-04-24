# REFORMA_ESTADO_ACTUAL

## Resumen de barrido
Barrido ejecutado sobre `apps/web` con foco en:

- `x-organizacion-id` / `x-usuario-id`
- `USE_MOCK_DATA`, `mock`, `demo`
- `prisma.`
- `NEXT_PUBLIC_DEV_MODE`
- `tarea.service`
- `validada` / `validado`
- `organizaciones` / `organizations`
- `as any`

## Hallazgos clasificados

### Crítico y corregible ahora
- **Headers inseguros en handlers core**: persisten usos de `x-organizacion-id` y `x-usuario-id` en rutas de tareas/socios/obras auxiliares.
- **Mutaciones wallet sin validación de ownership de wallet**: `wallet/creditos` y `wallet/debitos` aceptaban `owner_id` del body sin verificar pertenencia del usuario.
- **Prisma en flujo productivo de obras**: `PATCH`/`DELETE` de `api/obras` seguían con Prisma cuando `GET/POST` ya usan Supabase.
- **Webhook de pagos sin control opcional de secreto**: endpoint aceptaba POST sin validación de origen configurable.

### Importante pero riesgoso
- **`api/socios/invitar` y `api/socios/[id]/tareas` con dependencia fuerte de headers** y mucha lógica legacy acoplada.
- **Uso amplio de `as any` en servicios y handlers**; requiere refactor incremental para no romper tipado/runtime.
- **Mezcla `organizations`/`organizaciones`** en múltiples capas (API, servicios, componentes).

### Legacy documentable
- **`lib/services/tarea.service.ts` y `lib/services/tareas.service.ts`**: marcados como deprecated, con alto acoplamiento a Prisma legacy.
- **`api/roadmap/*`**: usa Prisma, fuera del flujo core obra/tarea/bloque/wallet.
- **Múltiples scripts de seed/sanity** con Prisma para datos de soporte/demo.

### Falso positivo o no bloqueante inmediato
- Coincidencias en `.md`, `.txt`, logs y archivos de contexto que no impactan runtime productivo.
- `NEXT_PUBLIC_DEV_MODE` aparece en docs y config, pero middleware ya limita bypass en producción.

## Decisión de ejecución aplicada
- Priorizar correcciones seguras en **core + seguridad + datos**.
- No forzar migraciones masivas riesgosas en handlers legacy altamente acoplados.
- Dejar deuda restante explícita en reportes para siguiente pase.
