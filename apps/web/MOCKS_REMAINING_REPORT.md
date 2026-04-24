# MOCKS_REMAINING_REPORT

## Estado
Se mantuvo `USE_MOCK_DATA=false` en `lib/mocks/socioMockData.ts` para evitar mocks silenciosos en socio.

## Mocks remanentes detectados

### Socio
- Persisten imports de `USE_MOCK_DATA` en:
  - `app/socio/page.tsx`
  - `app/socio/oportunidades/page.tsx`
  - `app/socio/presupuestos/page.tsx`
  - `app/socio/billetera/page.tsx`
  - componentes de `components/socio/home/*` y `components/socio/sections/AhoraSection.tsx`

### Cliente
- Fuerte presencia demo/mock en:
  - `app/cliente/dashboard/page.tsx`
  - `app/cliente/page.tsx`
  - `app/cliente/tareas/**`
  - `app/cliente/obras/[obraId]/timeline/page.tsx`

## Acción aplicada en esta reforma
- No se forzó borrado masivo de mocks para evitar romper UX actual.
- Se dejó visibilidad explícita de deuda para limpieza incremental.

## Próximo paso seguro
1. Encapsular todos los mocks detrás de feature flag de desarrollo.
2. Reemplazar primero rutas de cliente con mayor impacto (`dashboard` y `home`).
