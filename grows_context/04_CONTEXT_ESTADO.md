# Estado actual

**Actualizado:** 2026-04-26

---

## Ahora

- App web Next.js: rutas socio y cliente, APIs, Supabase, servicios de dominio.
- Flujo de negocio: `obra → tarea → bloque → evidencia → validación → pago → wallet`.
- Conviene convivencia con datos legacy (nombres de estado viejos) mapeados en servicios.
- Riesgo activo: más de un camino de datos (Supabase vs capa legacy) si ambos escriben lo mismo.

---

## Problemas concretos

| ID | Problema | Impacto |
|----|----------|---------|
| P1 | Dos vías de verdad posible (Supabase vs legacy) | Alto |
| P2 | Estados legacy vs oficiales en UI o payloads | Medio |
| P3 | Auth: confiar en cabeceras o IDs sin sesión/pertenencia | Alto |
| P4 | Rama local desalineada del remoto / cambios sin mergear | Medio |

---

## Prioridades

1. No romper FSM, wallet ni validación en cambios laterales.
2. Unificar escritura de datos hacia una vía cuando el trabajo lo permita.
3. Endurecer mutaciones críticas (obra, tarea, pago).
4. UI estable sin meter negocio solo en el cliente.

---

## Regla de prioridad

Si un cambio:

- mejora UI pero rompe flujo → **no** se hace;
- mejora estructura pero toca pagos → **no** se hace.

El flujo core tiene siempre prioridad máxima.

---

## Riesgos inmediatos

- UI que llama acción sin la misma validación en API.
- Migración sin revisar RLS.
- Toque de triggers o constraints de negocio sin revisar efecto en flujo.

---

## Bloqueos

- Ninguno registrado hoy.

---

## Nota de mantenimiento

Actualizar **Problemas** y **Prioridades** cuando cambie la situación real. No acumular aquí historial de reglas: eso corresponde solo al archivo de memoria de esta carpeta.

---

## Qué está funcionando hoy

- creación de obra  
- creación de tareas  
- bloques / subtareas  
- wallet base y movimientos  

---

## Qué está roto o incompleto

- validación **inconsistente** entre capas o con datos legacy  
- pagos / liberación **sin** QA completo en todos los caminos  
- **mezcla** de vías de datos (Supabase vs legacy) si ambas escriben  

---

## Qué necesita la app para ser usable

- flujo **completo** estable de punta a punta  
- validación **confiable**  
- pagos **correctos** y auditables  
- UI **clara** para socio y cliente  

---

## Qué significa “app lista”

La app está lista cuando:

- se puede **ejecutar una obra real** de principio a fin  
- se puede **validar trabajo real** del lado cliente  
- se pueden **registrar pagos reales** (según el modelo: efectivo u online)  

---

## Regla de actualización

Este archivo refleja **solo el estado actual** operativo.

- no agregar historia narrativa  
- no registrar decisiones de negocio (eso va en el archivo de **memoria** de esta carpeta)
