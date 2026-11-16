# Circuito de obra de punta a punta — entorno de pruebas

Arquitecto, contratista e inversor trabajan sobre los mismos datos: pliego → planificación → cotización →
adjudicación → avance → certificación → pago, con financiación por rondas de MCU. Todo el dinero es **ficticio**.
Evidencia de las corridas: [`docs/evidencia/`](evidencia/README.md).

## Operación

```bash
bash scripts/entorno-pruebas/levantar.sh
```
Genera claves propias, levanta Postgres + Auth + PostgREST + Storage en `127.0.0.1` (Docker), aplica línea base y
migraciones y siembra 9 identidades ficticias `@grows.test`. Es idempotente; con `--reiniciar` borra `public`.

```bash
bash scripts/entorno-pruebas/web.sh
```
Build de producción de `apps/web` y `next start` en `127.0.0.1:3100` contra la instancia (`--dev` para iterar).

```bash
node scripts/simulacion/ejecutor.mjs corrida --hasta-dia 19
```
Corrida manual. Opciones: `--escenarios vivienda,edificio,fallas`, `--avanzar N` (días simulados desde el cursor),
`--interrumpir-en escenario:paso` (corte simulado tras la escritura), `--id nombre`.

```bash
node scripts/simulacion/ejecutor.mjs estado
```
```bash
node scripts/simulacion/ejecutor.mjs pausar
```
```bash
node scripts/simulacion/ejecutor.mjs reanudar
```
```bash
node scripts/simulacion/ejecutor.mjs limpiar --escenario fallas
```
Limpieza selectiva (administrativa): borra la obra simulada, sus registros y sus evidencias en Storage. `--todo` o `--huerfanos`.

```bash
node scripts/simulacion/ejecutor.mjs reporte --corrida corrida-2 --salida docs/evidencia/corrida-2
```
```bash
node scripts/simulacion/navegador.mjs
```
Verificación en Chromium de los recorridos principales (requiere el build de producción arriba).

```bash
nohup node scripts/simulacion/programador.mjs > programador.log 2>&1 &
```
Programador: horarios y zona en `scripts/simulacion/config.json` (`09:00` y `18:00`, `America/Argentina/Buenos_Aires`).
Solo arranca con `programador.activo = true`; respeta la pausa; `--proximas` muestra los próximos disparos.
Cada disparo avanza `dias_por_corrida` días simulados; con los tres escenarios completos no hay pasos nuevos
hasta limpiar (`limpiar --todo`) o cambiar la semilla.

Aislamiento: todos los scripts pasan por `scripts/entorno-pruebas/entorno.mjs`, que se niega a correr si la URL no es
local. No hay SMTP, OAuth, MercadoPago ni WhatsApp configurados. Las acciones usan la sesión de cada actor
(cookie de Auth); la clave de servicio solo se usa en `sembrar.mjs` y en la limpieza.

## Qué hay en el código

| Pieza | Dónde |
|---|---|
| Instancia de pruebas | `supabase/pruebas/` (compose, gateway), `supabase/baseline/` (línea base reconstruida), `scripts/entorno-pruebas/` |
| Esquema del circuito | `supabase/migrations/20261115120000…123000_circuito_*.sql` (35 tablas con RLS sin políticas; funciones `circ_*`) |
| API | `POST /api/obras/:id/circuito/:accion` (36 acciones, `Idempotency-Key`), `GET /api/obras/:id/circuito`, `POST …/circuito/evidencias`, `GET /api/socio/circuito`, `GET /api/inversion/obras/:id`, `GET /api/inversion/posicion` |
| Lógica pura | `apps/web/lib/circuito/cronograma.ts` (ruta crítica, recursos, compras, inspecciones, curva S), `finanzas.ts` (necesidad de fondos, efecto de ronda, imputación) |
| Interfaz | `/obras/:id/circuito` (arquitecto, coordinador, auditor), `/socio/circuito` (contratista), `/inversores?obra=…&vista=inversor` y `/inversores/posicion` (inversor) |
| Simulación | `scripts/simulacion/` (motor, escenarios, auditor, reportes, programador, navegador) |

Reglas que garantiza la base (misma transacción que la escritura):

- Solo se publica un pliego si cada partida tiene alcance, cantidad, unidad, fuente y revisión, evidencia, criterio y responsable.
- Una oferta queda ligada a la revisión recibida; publicar una revisión nueva desactualiza solicitudes y ofertas abiertas.
- Una adjudicación por solicitud (bloqueo de fila) y una partida en un solo contrato (`unique (pliego_id, partida_codigo)`): la estructura común se contrata una vez.
- Certificado ≤ avance físico aceptado; aceptar avances y aprobar certificados exige evidencia de la versión vigente.
- Quien ejecuta no aprueba su propio trabajo; el coordinador planifica pero no adjudica, aprueba ni paga.
- Un certificado genera como máximo un pago (`unique (certificado_id)`); un pago no puede dejar la caja por debajo de la reserva.
- Lo prometido no es caja: solo lo integrado en una ronda cerrada con éxito entra a la caja de obra.
- Comprar una MCU existente mueve la posición y paga al vendedor; la caja de obra no cambia.
- Idempotencia: la clave se reserva en la misma transacción; un reintento devuelve el mismo registro.

## Escenarios (279 pasos)

1. **Vivienda** (81): pliego, plan, ronda única por el 100% (terreno, obra, honorarios, reserva), tres ofertas, dos
   adjudicaciones simultáneas (200/409), certificado rechazado → corregido → aprobado, pago único, salida sin comprador.
2. **Edificio** (112): estructura común en tres frentes con recursos compartidos, tres paquetes, dos rondas a distinto
   precio (dilución de quien no suscribe), posición vinculada a unidad, imputación de costos comunes, transferencia entre inversores, distribución.
3. **Fallas** (86): ronda fallida y devolución, reprogramación, ronda incompleta, evidencia observada, atraso por compra,
   cambio de alcance con adenda, nueva ronda fallida, pago bloqueado por caja, proceso de cierre y liquidación con pérdida.

El auditor (45 a 60 controles por obra) relee por la API con la sesión de cada rol y contrasta montos, estados y permisos.

## Supuestos económicos del ensayo (reversibles)

Viven en `SUPUESTOS_ENSAYO` (`apps/web/lib/circuito/finanzas.ts`), se muestran en la ficha del inversor y **no** son
configuración comercial:

| Tema | Supuesto |
|---|---|
| Derecho | La MCU es una fracción del resultado del proyecto completo; vincularla a una unidad no crea un segundo derecho |
| Dilución | Cada ronda emite MCU nuevas; sin derecho de preferencia |
| Precio por ronda | Lo fija el responsable; la valuación previa es informativa |
| Devoluciones | Si lo integrado no alcanza el umbral, se devuelve el 100%; lo prometido se cancela |
| Prioridad de cobro | En un cierre cobran primero los certificados aprobados; el remanente se liquida a prorrata |
| Votación | No hay: reprogramar o cerrar lo decide el responsable, con motivo registrado |
| Liquidez | Sin salida garantizada; solo transferencia si hay comprador |
| Costos comunes | Se imputan a unidades por superficie; los resultados se reparten por MCU |
| Retención | 5% por certificado; su devolución no está modelada |

Efectos medidos en las corridas: en el edificio, quien no suscribió la ronda 2 pasó de 46,51% a 34,26% con las mismas
1.200 MCU y la caja subió USD 106.145; en fallas, el inversor que quiso salir aportó USD 37.260 y recuperó USD 273,78.

## Pendiente o no probado

- **Rama `laboratorio/obra-2c` y commit `a34fb76`**: no existen en el remoto; el ejecutor se rehízo en `scripts/simulacion/`.
- **Línea base real**: ver `supabase/baseline/README.md` (qué falta y el comando de volcado que requiere acceso al proyecto).
- **Solo por API, sin pantalla**: editar el plan (tareas, dependencias, restricciones), costos y reserva, crear y abrir rondas,
  adendas, distribuciones, estado de obra, unidades y participantes.
- **No ejecutado**: wallet y bloques del flujo anterior, MercadoPago, WhatsApp; el modal `SolicitarPresupuestoModal` en navegador
  (su ruta sí se probó por API); el cambio de `listar_obras_vivas` contra un servidor MCP en marcha (solo tipado y tests existentes).
- **No modelado**: devolución del fondo de reparo, pagos parciales, calendario laboral (el cronograma usa días corridos), votación.
- **Corpus de `grows-conocimiento`** (AGENTS.md): el repositorio hermano no está disponible en este entorno; no se agregaron patrones ni bitácora.
- **Programador**: corre como proceso dentro del contenedor de pruebas; para que sobreviva a un reinicio hay que lanzarlo
  desde un servicio del host (systemd o cron `@reboot`) con el comando de arriba.
