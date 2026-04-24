# Arquitectura final socio

## 1. Resumen ejecutivo
- El material Stitch contiene muchas pantallas validas, pero no una arquitectura de producto cerrada para el usuario socio.
- El principal problema es estructural: hay duplicados, variantes visuales del mismo flujo y mezcla mobile/desktop sin canon.
- Decision final: construir una arquitectura **modular, responsive y centrada en flujo operativo del socio** con 10 modulos base:
  - panel
  - ahora
  - tareas
  - evidencias
  - validacion
  - presupuestos
  - mensajes
  - billetera
  - notificaciones
  - cuenta

## 2. Problemas del material original
- Duplicacion alta de home (`home_*`), canvas (`canvas_*`) y validaciones (`validar*`, `validaci_n*`).
- Variantes del mismo modulo con distinto branding y naming (Grows, ArchiFlow, Studio Alpha, etc.).
- Mezcla de capas: pantallas core junto con conceptos accesorios (paquetes, marketplace, builders) sin prioridad funcional.
- Flujos incompletos: hay vistas sueltas, pero faltan estados transaccionales y recorrido end-to-end.
- Falta de definicion de "modo socio": hay material compartido con arquitecto/gestor que no siempre aplica al socio operativo.

## 3. Modulos detectados
### Core (debe existir si o si)
- **panel/home**: punto de entrada operativo.
- **ahora**: tarea activa, estado actual, proximas acciones.
- **tareas**: lista, detalle y progreso.
- **evidencias**: carga y consulta de evidencias por tarea.
- **validacion**: respuesta a observaciones, aprobacion/rechazo.
- **presupuestos**: solicitudes recibidas/enviadas y estado.
- **billetera**: saldo, movimientos, liberaciones.
- **cuenta**: perfil y ajustes.

### Duplicado
- Home: `home_acci_n_r_pida_mobile`, `home_bauhaus_hub_green_mobile`, `home_bauhaus_central_hub_desktop`, `home_centro_de_operaci_n_desktop`, `home_proyectos_limpio`.
- Canvas/plan: `canvas_desktop`, `canvas_mobile`, `canvas_de_tareas_desktop`, `canvas_nivel_1_5_nodos`, `canvas_nivel_2_10_nodos`, `canvas_nivel_3_complejidad_alta`, `plan_de_obra_canvas`, `builder_canvas_de_obra`.
- Validaciones: `validar_mobile`, `validar_block_evidence`, `validar_bloques_mobile_1`, `validar_bloques_mobile_2`, `validaciones_pendientes`, `validaci_n_de_bloques_1`, `validaci_n_de_bloques_2`, `validaci_n_de_obra`.
- Finanzas: `liberar_pago`, `liberar_pago_escrow`.
- Obras: `obras`, `listado_de_obras`.

### Accesorio (no core socio inmediato)
- `paquetes_desktop`, `paquetes_publicados`, `detalle_de_paquete`.
- `marketplace_de_socios`, `seleccionar_socio`, `ficha_de_socio`, `contratistas_mvp`.
- `builder_crear_tarea`, `builder_resumen_de_solicitud`, `cargar_plan_workflow_initial_step`.

### Confuso (requiere redefinicion funcional antes de implementar)
- Toda la familia de `canvas_nivel_*` (parecen demos de densidad, no pantallas de producto).
- `trabajo_en_curso` (solapa con ahora/tareas/tablero).
- `detalle_de_solicitud` (no queda claro si es presupuesto, mensaje o marketplace).

### Faltante (critico para cerrar arquitectura socio)
- **mensajes** (bandeja, hilo, detalle).
- **notificaciones** (feed, filtros, marcado leido).
- **evidencias completas** (subida, historial, estado de revision por evidencia).
- **estado ahora** con errores/bloqueos y fallback.

## 4. Arquitectura final
- Arquitectura funcional final del socio:
  1. **Panel** (resumen del dia, alertas, accesos directos)
  2. **Ahora** (tarea en ejecucion, tiempo, bloqueos)
  3. **Tareas** (backlog, en curso, completadas)
  4. **Evidencias** (cargar/ver/revisar)
  5. **Validacion** (pendientes, observaciones, resolucion)
  6. **Presupuestos** (solicitudes, respuesta, estado)
  7. **Mensajes** (conversaciones vinculadas a obra/tarea)
  8. **Billetera** (saldo, movimientos, liberacion)
  9. **Notificaciones** (eventos operativos)
  10. **Cuenta** (perfil, seguridad, preferencias)

### Navegacion y jerarquia
- Nivel 1: `Panel`, `Ahora`, `Tareas`, `Presupuestos`, `Billetera`.
- Nivel 2: `Evidencias`, `Validacion`, `Mensajes`, `Notificaciones`, `Cuenta`.
- Relaciones clave:
  - `Ahora` enlaza a `Tareas` y `Evidencias`.
  - `Validacion` consume evidencias y devuelve acciones a `Tareas/Ahora`.
  - `Presupuestos` impacta carga de trabajo en `Tareas`.
  - `Notificaciones` es transversal y deep-linkea a todos los modulos.

### Mobile vs Desktop (decision final)
- **Una sola arquitectura base responsive**.
- Variantes de layout por breakpoint (sidebar/topbar en desktop, bottom nav en mobile), sin duplicar pantallas por dispositivo.
- Solo se permiten componentes de presentacion diferentes cuando el caso de uso lo justifique (canvas denso, tablas complejas).

## 5. Estructura de carpetas
```text
/socio
  /panel
    page.tsx
  /ahora
    page.tsx
  /tareas
    page.tsx
    /[tareaId]
      page.tsx
  /evidencias
    page.tsx
    /[evidenciaId]
      page.tsx
  /validacion
    page.tsx
    /[validacionId]
      page.tsx
  /presupuestos
    page.tsx
    /[presupuestoId]
      page.tsx
  /mensajes
    page.tsx
    /[chatId]
      page.tsx
  /billetera
    page.tsx
    /movimientos
      page.tsx
  /notificaciones
    page.tsx
  /cuenta
    page.tsx
  /components
    /layout
    /cards
    /forms
    /tables
  /shared
    /states
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
    /ui
    /hooks
    /types
```

## 6. Que eliminar
- Eliminar del baseline (no implementar como pantallas finales):
  - `canvas_nivel_1_5_nodos`
  - `canvas_nivel_2_10_nodos`
  - `canvas_nivel_3_complejidad_alta`
  - `home_proyectos_limpio`
  - `trabajo_en_curso`
  - `liberar_pago` (conservar `liberar_pago_escrow`)
  - `paquetes_desktop` (si no se prioriza paquetes en MVP socio)
- Eliminar duplicados por fusion:
  - una sola home mobile (`home_bauhaus_hub_green_mobile` **o** `home_acci_n_r_pida_mobile`)
  - una sola pantalla de listado obras (`listado_de_obras` como canon)
  - una sola familia de validacion (lista + detalle + decision)

## 7. Que falta
- **Pantallas faltantes**
  - Mensajes: inbox, hilo, composer.
  - Notificaciones: feed, filtros, centro de acciones.
  - Evidencias: historial por tarea, detalle con versionado y estado.
- **Estados faltantes**
  - empty/loading/error en todos los modulos core.
  - estados de permisos/rol y estados de conectividad.
  - estados sin datos por filtro/busqueda.
- **Flows faltantes**
  - flujo completo de `Ahora -> Evidencia -> Validacion -> Resultado`.
  - flujo de rechazo y re-trabajo con trazabilidad.
  - flujo de incidente/bloqueo desde tarea activa.
- **Componentes faltantes**
  - timeline de actividad por tarea.
  - bandeja unificada de acciones pendientes.
  - componentes de feedback transaccional (toast, confirmacion, retry).

## 8. Recomendacion final
- Congelar inmediatamente la arquitectura de 10 modulos socio y dejar fuera todo lo accesorio.
- Implementar en dos etapas:
  1. core operativo: panel, ahora, tareas, evidencias, validacion, presupuestos, billetera, cuenta.
  2. transversales: mensajes y notificaciones.
- Pedir a Stitch solo lo que falta para cerrar flujo real (mensajes/notificaciones/evidencias/estados), no nuevas variantes visuales del mismo modulo.
- No diseñar todavia:
  - optimizaciones de canvas avanzado por densidad
  - variantes de paquetes/marketplace
  - extensiones de arquitectura que dependan de reglas backend no estabilizadas

