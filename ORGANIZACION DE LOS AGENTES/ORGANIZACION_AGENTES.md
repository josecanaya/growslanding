========================================================
🟦 SEMANA 1 — ESTABILIZACIÓN DEL SISTEMA

Días 1 al 7

Meta:
Dejar estable toda la base operativa: Backend + Validación Cliente + Evidencias Socio.

📅 DÍA 1 — Backend + Lógica de Negocio
Backend

Auditoría de modelos (tareas, subtareas, wallet)

Limpieza de legacy

Verificación de consistencia de columnas críticas

Preparación técnica para FSM

Lógica de Negocio

Entregar definición final de:

Tabla de planes + comisiones

Saldo negativo

FSM final

Reglas de subtareas

Flujo AHORA

Resultado Día 1: Backend recibe reglas definitivas y puede implementar FSM.

📅 DÍA 2 — Backend (EXCLUSIVO)
Backend

Implementación completa de la FSM

Validación estricta de transiciones

Roles SOCIO/CLIENTE aplicados correctamente

Registro de eventos por transición

Resultado: FSM estable, sin saltos inválidos ni loops.

📅 DÍA 3 — Backend + Front Cliente
Backend

Generación automática de subtareas

Idempotencia

Orden de pago por bloque

Sin duplicación de bloques

Front Cliente

Refactor de la UI de validación

Mostrar evidencia, nombre del bloque, montos

Eliminar fallos silenciosos

Resultado: Bloques generados y el cliente los visualiza correctamente.

📅 DÍA 4 — Backend + Front Socio
Backend

Endpoint de validación parcial de subtareas

evidencia

pago

comisión

estado

Front Socio

Vista /socio/evidencias completa

Filtros

Lightbox

Subida asíncrona con compresión

Resultado: Evidencias funcionales end-to-end.

📅 DÍA 5 — Backend + Front Cliente
Backend

Validación final automática

Registro de eventos

Aplicación de comisiones

Consolidación de wallet

Front Cliente

Modales de confirmación

Toasters unificados

Feedback claro en todas las acciones

Resultado: Cliente puede validar tareas completas sin errores.

📅 DÍA 6 — Front Socio (EXCLUSIVO)
Front Socio

AHORA estable mostrando:

Tareas activas (máx. 2)

Tareas pendientes

Progreso por subtarea

Bloqueo visual + lógico de 3ra tarea

Errores unificados y consistentes

Resultado: AHORA listo para uso real en campo.

📅 DÍA 7 — QA GENERAL
Backend

Test E2E: obra → tarea → subtareas → validación → wallet

Corrección de inconsistencias

Documentación semanal

Front Cliente

Eliminación completa de logs

Prueba exhaustiva del flujo

Resultado Semana 1:
Base del sistema 100% estable.

=========================================================
🟧 SEMANA 2 — INTEGRACIÓN + ESTABILIDAD

Días 8 al 15

Meta:
Realtime + economía + jornadas + permisos + test piloto

📅 DÍA 8 — Front Socio + Negocio
Front Socio

Realtime Supabase Channels

Actualización automática de tareas/subtareas

Manejo de reconexión

Negocio

Manual operativo socio (versión final)

Reglas de bloqueo por saldo negativo

📅 DÍA 9 — Backend (EXCLUSIVO)
Backend

Consolidar wallet

Eliminar duplicados

Comisiones finales

Ajustes en obra.service

Revisión integración tareas–elementos

📅 DÍA 10 — Front Cliente + Front Socio
Front Cliente

Implementación de banners de plan

Bloqueos correctos según plan

Confirmaciones adicionales

Front Socio

Historial simple de jornadas

Dashboard inicial de ganancias

📅 DÍA 11 — Backend + Front Socio
Backend

Separación backend del frontend

Eliminación total de Prisma legacy

Endpoints estables y limpios

Front Socio

Ajustes generales de UI/UX

Optimización de realtime

Correcciones visuales menores

📅 DÍA 12 — Front Cliente (EXCLUSIVO)
Front Cliente

Empty states correctos

Loading states consistentes

Integración con endpoints nuevos

Correcciones de UX en ValidarSection

📅 DÍA 13 — INTEGRACIÓN FULL STACK
Backend

Pruebas de consistencia FSM + wallet

Front Cliente + Socio

Test completo real:

Socio finaliza bloque

Cliente valida

Wallet actualiza

Resultado: Flujo completo funcionando sin errores.

📅 DÍA 14 — Correcciones Finales
Todos los equipos

Fixes finales

Limpieza

Ultima revisión de errores

Optimización ligera

📅 DÍA 15 — Preparación Test Piloto
Lógica de Negocio

Guión del test piloto

Métricas

Tablero mínimo

Equipos técnicos

Demo final

Checklist MVP

Última verificación E2E

🎯 META FINAL (DÍA 15)

El sistema queda listo para:

Test piloto real con cuadrillas

Demo inversores pre-seed

Inicio de adopción comercial controlada