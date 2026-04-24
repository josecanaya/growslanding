# FRONT_BLOCKERS

## Bloqueos frontend socio (Stitch)

1. **Mensajes (`_07_mensajes`) sin referencia visual canónica completa**
   - Stitch documenta faltante explícito.
   - Impacto: no se puede cerrar módulo de mensajería sin decisión de UX o material adicional.

2. **Estados transversales incompletos (empty/loading/error/offline)**
   - La biblioteca actual no cubre todos los estados operativos para cada módulo.
   - Impacto: faltan pantallas de fallback homogéneas para producción.

3. **Contratos backend parciales en módulos de notificaciones/mensajes/billetera**
   - No toda la matriz de payloads y deep-links está formalizada en docs.
   - Impacto: riesgo de implementar UI sin contrato final.

## Bloqueos frontend cliente

1. **Dashboard con alto acoplamiento a mocks**
   - `app/cliente/dashboard/page.tsx` mantiene múltiples bloques demo/mock.
   - Impacto: la estabilización total requiere refactor focalizado fuera del alcance seguro de este pase.

2. **Rutas cliente con datos hardcodeados**
   - `app/cliente/page.tsx` y rutas de tareas/timeline/editor usan datos de demostración.
   - Impacto: no se puede declarar “sin mocks” hasta migrar esas rutas.

## Estado del pase actual
- No se introdujeron mocks nuevos.
- Se mantuvo `USE_MOCK_DATA=false` en la base de socio.
- Queda pendiente saneamiento incremental de mocks en cliente.
