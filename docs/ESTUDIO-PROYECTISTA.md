# Estudio del proyectista y carga automática

Implementación: 20/11/2026. Entorno de ensayo existente de GROWS; todas las obras generadas están identificadas como ficticias. Esta entrega agrega preparación de proyectos y contenido; no reemplaza el simulador de roles del workflow `grows-circuito-qa.yml`.

## Recorrido disponible

1. Ingresar con un usuario titular de la organización o coordinador con invitación aceptada.
2. Abrir `/obras/ID/estudio` desde el espacio de obra. El servidor verifica el permiso; seleccionar un perfil visual no concede acceso.
3. Completar equipo, intención, destinatarios, destino y fecha de entrega. La ficha del estudio es privada. La presentación pública se edita desde Publicación en `/obras/ID`.
4. Preparar tareas en el canvas existente o importar texto con ocho columnas separadas por `|`: código, etapa, tarea, cantidad, unidad, precio unitario USD, duración en días, códigos de predecesoras separados por coma. Se agregan tareas; no se reemplaza lo existente.
5. La importación persiste etapas, tareas, cómputos, pliegos, checklist y dependencias en las tablas existentes. Rechaza ciclos, códigos repetidos, dependencias inexistentes y cantidades inválidas. El XML exporta el texto ingresado, no el canvas completo. Planificación simplificada con dependencias fin-inicio y jornadas de 8 horas; no calcula feriados ni nivelación de recursos.
6. Revisar todo el conjunto antes del llamado. Para abrir una ronda se exigen tareas con plazo y presupuesto USD, agrupación en pliegos, dependencias sin ciclos, entrega posterior al cierre y condiciones escritas. El objetivo puede cubrir hasta el presupuesto cargado. No es una tasación ni una aprobación técnica.
7. La primera ronda de ensayo genera una copia inalterable con huella SHA-256 de obra, perfil, condiciones, nodos, conexiones, grupos y checklist. La descarga del expediente exige permiso de proyectista. El feed expone solo objetivo, versión, cierre, condiciones y huella.
8. La base de datos protege el alcance también frente a escrituras desde otros servicios. Conserva las actualizaciones operativas de avance/estado, asignación de ejecutores y checklist. El editor de canvas, cuyo guardado reemplaza relaciones, no guarda sobre un alcance congelado: usar adicionales. Las fotos y publicaciones se actualizan por una operación separada con control de revisión.
9. Registrar cambios como adicionales, sin alterar el expediente. Quedan pendientes de evaluación; no generan financiación automáticamente.
10. Publicar novedades con imágenes propias/autorizadas por URL HTTPS y vincular hasta 30 obras hermanas publicadas de la misma organización. Los vínculos son dirigidos y no comparten dinero ni documentación privada.

## Automatización de datos

Implementada en PostgreSQL con `pg_cron`. No depende de ChatGPT, una computadora personal ni una API de IA.

- 09:00 Argentina: agrega una obra de ensayo desde una de las 50 plantillas existentes, copiando su planificación y reiniciando estado/avance/checklists. La selección es reproducible según la clave de corrida.
- 18:00 Argentina: publica en una obra de ensayo existente una novedad que describe sus cantidades de tareas y pliegos. No afirma trabajos terminados ni fabrica fotos de avances.
- Horarios UTC de la base, verificados con `cron.timezone=GMT`: `0 12 * * *` y `0 21 * * *`.
- Límite inicial: 100 obras de ensayo de la organización configurada. Las publicaciones se detienen antes de superar el límite del feed.
- La obra inicial es carga de preparación de datos. No se presenta como una obra creada por un actor a través del flujo comercial de alta.
- Cada pasada queda en `project_automation_runs`. Hay bloqueo transaccional contra superposición, transacción atómica y claves de corrida únicas. El reintento de la misma clave completada devuelve `ya_ejecutada`.
- Timeout de cron: 45 segundos. Un error capturado se registra como `fallido` y no se reintenta indefinidamente. Corregir y ejecutar manualmente con una clave nueva. Ante interrupción/timeout antes del commit se revierte la transacción; el registro de infraestructura queda en `cron.job_run_details` y la misma clave puede volver a ejecutarse. No se ejecutó una caída forzada del servidor en esta validación.

### Operación

La pantalla `/proyectista/automatizacion` permite al titular ver las últimas 50 corridas, pausar/reanudar y disparar creación o publicación manual. Las acciones manuales usan un UUID que se conserva cuando falla la conexión para evitar duplicación.

API de la pantalla:

```text
GET /api/proyectista/automatizacion
POST /api/proyectista/automatizacion
{"action":"pause|resume|crear|publicar","requestId":"UUID"}
```

No requiere secretos nuevos en Vercel. Reutiliza Supabase y las credenciales existentes del servidor. Los clientes anónimos/autenticados no tienen acceso directo a las tablas privadas de esta entrega ni ejecución de los RPC administrativos. La ruta valida la sesión y la función vuelve a verificar al actor.

### Instalación en otra base de ensayo

Aplicar, en orden, `deploy/project-studio.sql` y `deploy/project-automation.sql` mediante migraciones. La segunda contiene la organización y el batch de plantillas del entorno actual: configurar otra organización y cargar plantillas ficticias antes de activarla en otra base. No aplicar a una base comercial sin revisar ese destino. Requiere pg_cron disponible y zona de cron GMT; si la zona del servidor es otra, ajustar horarios.

La pausa no elimina historial. Esta entrega no incluye borrado de expedientes congelados: es deliberadamente una operación de mantenimiento fuera del acceso del usuario. No ejecutar una limpieza global de obras.

## Validación registrada

- Corrida `manual:b0202026-1120-4000-8000-000000000002`: obra `02da4cb1-44ed-b57a-36a1-010aa1006723`, 24 tareas, 6 pliegos, avance 0. Repetir la clave devolvió `ya_ejecutada`.
- Corrida siguiente `...000003`: publicación sobre `a0182026-1118-4000-8000-000000000001`, consultando sus 24 tareas persistidas.
- Corrida `...000010`: obra `f0380c2c-b8c6-7c23-b1ef-e61219a4a71e`. Se importaron dos tareas con una dependencia; reintentar el mismo request dejó 26 tareas, 7 grupos, 24 conexiones y un solo registro de solicitud.
- Expediente de la primera obra: ronda `80e01cb8-6cd2-493a-a9cb-8e9e72327931`, versión 1, objetivo USD 127.256,80. Huella `493bf0b4f830a15d0a3361a0ded36fbbe476b6b784bb9b53bde3ae6f250a905e`, recomputada desde la copia persistida.
- Intento de cambiar títulos del alcance congelado: rechazado por la base. Actor sin autorización: rechazado. Permiso directo de ejecución RPC para `authenticated`: ausente.
- Adicional `2885704c-1a9f-46a9-98e1-be4fd4c5c47d` registrado sin tocar el expediente. Publicación y vínculo de obra hermana aceptados después del congelamiento.
- Pausa comprobada: una creación devolvió `pausada`; reanudación devolvió `activa`. Ambos jobs figuran activos.
- Primer intento `...000001` falló por una referencia genérica de trigger a un campo inexistente. Se corrigió y se preservó el fallo en el historial; no dejó una obra parcial.
- Pruebas de API verifican permisos, actor autenticado, revisión concurrente, validación del plan y conflictos de alcance. Las pruebas de base invocaron las mismas funciones de servicio; no equivalen a un recorrido autenticado completo en navegador.

## Pendientes explícitos

- Derechos de MCU, precio, devolución, liquidez, distribución de rentas, aprobación de adicionales y rondas sucesivas. No hay dinero real, emisión ni rentabilidad prometida en este nuevo circuito.
- El registro de adicionales todavía no se transforma en una segunda ronda. Solo se congela una primera versión por obra.
- Las imágenes automáticas son referencias conceptuales ya disponibles, no evidencias generadas de una obra ejecutada.
- Los cuatro métodos MCP no fueron ampliados. El agente existente conserva su mecanismo de propuesta y revisión; el nuevo importador textual usa la API del estudio.
- No se verificó una transacción financiera ni una obra real. La carga automática no adjudica, certifica ni paga trabajos.
