# Evidencia de las corridas (instancia de pruebas local, identidades ficticias)

Generada el 2026-11-16 contra `http://127.0.0.1:3100` (build de producción de `apps/web`) y la instancia
`supabase/pruebas` (Postgres + Auth + PostgREST + Storage). Semilla `20261116`.

| Archivo | Qué demuestra |
|---|---|
| `corrida-1.salida.txt`, `corrida-1/` | Primera corrida hasta el día simulado 19: 144 pasos aprobados y **corte simulado** del proceso justo después de enviar el pago del certificado 1 de la vivienda |
| `corrida-1.estado.txt`, `corrida-1.base.txt` | Tras el corte: el paso quedó `iniciado` en el estado local y el pago **ya existe** en la base (una clave de idempotencia, un pago) |
| `corrida-2.salida.txt`, `corrida-2/` | Segunda corrida: **retoma** el paso cortado (misma clave → mismo pago, `repetida: true`) y completa los tres escenarios (137 pasos) |
| `corrida-2.base.txt`, `estado-final.base.txt` | Lectura de control por SQL: un pago por certificado, un contrato por solicitud, rondas, caja, posiciones, evidencias en Storage = registradas |
| `corrida-3.salida.txt`, `corrida-3/` | Tercera corrida de control: 0 pasos ejecutados, nada se duplica |
| `navegador/` | 29 pasos en Chromium con login por formulario: inversor, contratistas, arquitecta, auditor y visitante sin sesión (capturas + `informe.md`) |
| `flujo-existente.txt` | Arreglos del flujo existente: tarea directa sin elemento de catálogo (201) y ruta `solicitar-presupuesto` del modal (201, repetición 400, contratista 403) |
| `pausa-reanudacion.txt` | Pausa manual: la corrida no ejecuta; reanudación |
| `programador.txt` | Programador activo (09:00 y 18:00 America/Argentina/Buenos_Aires), próximo disparo y un disparo manual |
| `tests-sql-existentes.txt` | Tests SQL que ya estaban en el repo contra la línea base reconstruida |

En cada `corrida-N/`: `reporte.md` (tabla por paso con ID de registro), `reporte.json` y `diario.jsonl`
(una línea por paso: obra, actor, fecha real, tiempo simulado, versión, semilla, acción, tipo, resultado,
clave de idempotencia, ID del registro, evidencia y siguiente paso).

Los pasos de tipo `producto` son acciones normales de un rol. Los de tipo `permiso`, `validacion`, `concurrencia`,
`idempotencia` y `recuperacion` son pruebas que esperan un rechazo o un comportamiento; `auditoria` relee lo persistido.
No se usaron dobles de prueba: todo corre contra servicios reales de la instancia local. Lo único preparado con acceso
administrativo son las identidades, el saldo ficticio de los inversores, el bucket y la limpieza.

Nota: en la corrida formal, el pedido HTTP que el paso `cert.obra-gruesa.1.doble-pago` intenta abortar a los 15 ms terminó
antes del aborto (`pedido_abortado: false`). La escritura interrumpida queda demostrada por el corte del proceso de la corrida 1.
