# Arquitectura final socio / arquitecto

## 1. Resumen ejecutivo
- El material de referencia contiene 51 pantallas Stitch (`code.html`) del frente socio/arquitecto, con buena cobertura visual pero sin arquitectura funcional consolidada.
- El problema principal no es cantidad de pantallas sino desorden estructural: duplicados, variantes del mismo flujo, mezcla mobile/desktop y falta de criterio core vs accesorio.
- Decision general: convertir el material en una arquitectura modular, simple y ejecutable para frontend, con base responsive unica, estructura de carpetas definida y catalogacion explicita de material a conservar/fusionar/eliminar/revisar.

## 2. Inventario del material
### Mobile
- `home_acci_n_r_pida_mobile`
- `home_bauhaus_hub_green_mobile`
- `canvas_mobile`
- `validar_bloques_mobile_1`

### Desktop
- `home_bauhaus_central_hub_desktop`
- `home_centro_de_operaci_n_desktop`
- `canvas_desktop`
- `canvas_de_tareas_desktop`
- `paquetes_desktop`

### Compartido
- Obras/tablero/tareas: `listado_de_obras`, `obras`, `detalle_de_obra`, `tablero_de_obra`, `gesti_n_de_tareas`, `lista_de_tareas`, `historial_general`
- Validaciones: `validar_mobile`, `validar_block_evidence`, `validaciones_pendientes`, `validaci_n_de_obra`, `validaci_n_de_bloques_1`, `validaci_n_de_bloques_2`, `validar_bloques_mobile_2`
- Finanzas: `billetera`, `movimientos_de_billetera`, `dinero_y_escrow`, `liberar_pago`, `liberar_pago_escrow`
- Presupuestos/solicitudes: `comparar_presupuestos`, `presupuesto_recibido`, `builder_resumen_de_solicitud`, `detalle_de_solicitud`
- Socios/marketplace: `marketplace_de_socios`, `ficha_de_socio`, `seleccionar_socio`, `contratistas_mvp`
- Canvas/plan: `plan_de_obra_canvas`, `builder_canvas_de_obra`, `canvas_nivel_1_5_nodos`, `canvas_nivel_2_10_nodos`, `canvas_nivel_3_complejidad_alta`, `canvas_detalle_de_tarea_sub_nivel`

### Duplicados detectados
- Home: 5 variantes.
- Canvas: 8+ variantes para la misma capacidad.
- Validaciones: 8 variantes lista/detalle/decision.
- Obras: `obras` y `listado_de_obras` superpuestos.
- Escrow/liberacion: `liberar_pago` y `liberar_pago_escrow`.

## 3. Clasificación
### Conservar
- `home_centro_de_operaci_n_desktop`
- `home_bauhaus_hub_green_mobile` (canonica mobile inicial)
- `listado_de_obras`
- `detalle_de_obra`
- `tablero_de_obra`
- `gesti_n_de_tareas`
- `plan_de_obra_canvas`
- `canvas_desktop`
- `validaciones_pendientes`
- `validaci_n_de_bloques_2`
- `billetera`
- `dinero_y_escrow`
- `comparar_presupuestos`
- `presupuesto_recibido`
- `perfil_y_ajustes`

### Fusionar
- Home: `home_*` -> 1 modulo `panel/home`
- Obras: `obras` + `listado_de_obras`
- Canvas: `canvas_*` + `plan_de_obra_canvas` + `builder_canvas_de_obra`
- Validacion: `validar*` + `validaci_n*` + `validaciones_pendientes`
- Finanzas: `liberar_pago` + `liberar_pago_escrow`
- Socios: `marketplace_de_socios` + `contratistas_mvp`

### Eliminar
- `canvas_nivel_1_5_nodos`
- `canvas_nivel_2_10_nodos`
- `canvas_nivel_3_complejidad_alta`
- `home_proyectos_limpio`
- `trabajo_en_curso`
- `liberar_pago` (al quedar `liberar_pago_escrow`)
- `paquetes_desktop` (si paquetes no entra en core socio)

### Revisar manualmente
- `builder_crear_tarea`
- `cargar_plan_workflow_initial_step`
- `builder_resumen_de_solicitud`
- `detalle_de_solicitud`
- `movimientos_de_billetera` (aprovechar estado vacio)
- `paquetes_publicados` / `detalle_de_paquete`

### Faltante
- Modulo mensajes completo (inbox/hilo/composer)
- Modulo notificaciones completo (feed, filtros, acciones)
- Evidencias completo (lista, detalle, historial, estado de revision)
- Estados transversales: empty/loading/error/sin permisos/sin conexion

## 4. Módulos funcionales finales
- **panel / home**: resumen operativo del socio, alertas y accesos rapidos.
- **ahora**: foco de ejecucion actual, bloqueos y proxima accion.
- **tareas**: backlog, en curso, terminadas, detalle por tarea.
- **evidencias**: carga de evidencia y seguimiento de revision.
- **validación**: pendientes, observaciones, aprobacion/rechazo.
- **presupuestos**: solicitudes, respuesta y estado.
- **mensajes**: comunicacion contextual obra/tarea.
- **billetera**: saldo, movimientos y liberacion.
- **notificaciones**: eventos y deep links operativos.
- **cuenta / perfil**: datos, preferencias, seguridad.
- **navegación compartida**: sidebar/topbar/bottom nav.
- **componentes compartidos**: estados base, filtros, tablas, modales, feedback transaccional.

## 5. Arquitectura final propuesta
### Navegación
- Primaria: `Panel`, `Ahora`, `Tareas`, `Presupuestos`, `Billetera`.
- Secundaria: `Evidencias`, `Validacion`, `Mensajes`, `Notificaciones`, `Cuenta`.

### Jerarquía
- `Panel` -> `Obra` -> `Tarea` -> `Evidencia` -> `Validacion`.
- `Presupuestos` y `Mensajes` conectan transversalmente por obra/tarea.
- `Notificaciones` orquesta entrada rapida a todos los modulos.

### Relación entre pantallas
- `Ahora` consume `Tareas` y dispara `Evidencias`.
- `Validacion` depende de `Evidencias`.
- `Presupuestos` impacta asignacion de `Tareas`.
- `Billetera` se nutre de hitos de `Validacion/Presupuestos`.

### Criterio mobile/desktop
- Arquitectura unica **responsive compartida**.
- Variantes de layout por dispositivo:
  - desktop: sidebar + topbar
  - mobile: topbar compacta + bottom nav
- Prohibido duplicar pantallas por device si el flujo es el mismo.

## 6. Estructura final de carpetas
```text
reforma/stitch_arquitectura_socio_existente/
  frontend_base/
    socio/
      panel/
      ahora/
      tareas/
      evidencias/
      validacion/
      presupuestos/
      mensajes/
      billetera/
      notificaciones/
      cuenta/
      navigation/
      components/
      shared/
  material_catalogado/
    conservar/
    fusionar/
    eliminar/
    revisar/
```

```text
apps/web/app/
  (socio-arquitecto)/
    socio/
      panel/
      ahora/
      tareas/
        [tareaId]/
      evidencias/
        [evidenciaId]/
      validacion/
        [validacionId]/
      presupuestos/
        [presupuestoId]/
      mensajes/
        [chatId]/
      billetera/
        movimientos/
      notificaciones/
      cuenta/
```

## 7. Material descartado o fusionado
- **Descartado por redundancia de demo**: `canvas_nivel_1_5_nodos`, `canvas_nivel_2_10_nodos`, `canvas_nivel_3_complejidad_alta`.
- **Descartado por solapamiento funcional**: `home_proyectos_limpio`, `trabajo_en_curso`, `liberar_pago`.
- **Fusionado por duplicidad de flujo**:
  - homes (`home_*`) -> `panel/home`
  - validaciones (`validar*`/`validaci_n*`) -> `validacion` unico
  - obras (`obras` + `listado_de_obras`) -> listado unico
  - canvas (`canvas_*` + `plan_de_obra_canvas`) -> canvas unico parametrizable
- Criterio: se elimina solo lo que no agrega capacidad funcional nueva.

## 8. Faltantes a pedir a Stitch
### Pantallas
- Mensajes (inbox, hilo, composer).
- Notificaciones (feed con filtros y acciones).
- Evidencias (detalle completo e historial por tarea).

### Estados
- Empty states por modulo.
- Loading/skeleton por listado y detalle.
- Error states (carga/accion/permisos/conectividad).

### Flows
- Flujo cerrado `Ahora -> Evidencia -> Validacion -> Resultado`.
- Flujo de rechazo y retrabajo.
- Flujo de bloqueo/incidente en ejecucion.

### Componentes
- Timeline de actividad por tarea.
- Centro de pendientes unificado.
- Feedback transaccional estandar (toast, confirm, retry).

## 9. Handoff para agente frontend
### Qué debe hacer primero
1. Tomar `frontend_base/socio` como estructura de trabajo inicial.
2. Usar `referencias_visuales_organizadas/` como fuente visual ordenada por módulo.
3. Implementar navegacion compartida (desktop/mobile) y estados base.
4. Implementar modulos core en orden:
   - `panel` -> `ahora` -> `tareas` -> `evidencias` -> `validacion`
   - luego `presupuestos` -> `billetera` -> `mensajes` -> `notificaciones` -> `cuenta`

### Qué debe respetar
- No tocar landing.
- No tocar backend.
- No agregar features nuevas.
- No duplicar mobile/desktop por pantalla.
- Reutilizacion primero: `shared`, `components`, `navigation`.

### Qué no debe tocar
- Material Stitch original fuera de catalogacion.
- Lógica de dominio backend/core existente.
- Estructura de app fuera del alcance socio/arquitecto.

## 10. Recomendación final
- Paso inmediato: usar esta arquitectura como contrato de implementación frontend, con backlog por modulo y criterios de aceptación por flujo.
- Paso siguiente: pedir a Stitch solo faltantes funcionales y estados (no nuevas variantes de diseño).
- Resultado esperado: base front socio/arquitecto coherente, reutilizable y lista para iterar sin fragmentar producto.
# Arquitectura final socio / arquitecto

## 1. Resumen ejecutivo
- La carpeta contiene 51 propuestas Stitch (1 `code.html` por subcarpeta), enfocadas en socio/arquitecto con material mezclado entre home, obras, tareas, canvas, validaciones, socios, presupuestos, paquetes, billetera, escrow y perfil.
- El problema actual no es falta de pantallas, sino exceso de variantes solapadas: hay duplicados de home, canvas y validaciones; además hay mezcla de branding, mezcla mobile/desktop y poca definicion de estados (empty/loading/error).
- Decision arquitectonica general: pasar de "muchas pantallas sueltas" a una arquitectura por modulos funcionales con una base responsive canonica, minimizando duplicacion y conservando variantes solo donde realmente cambie el layout.

## 2. Inventario del material encontrado
- Total detectado: 51 carpetas funcionales, cada una con `code.html`.
- Tipos de material:
  - Mobile explicito: `home_acci_n_r_pida_mobile`, `home_bauhaus_hub_green_mobile`, `canvas_mobile`, `validar_bloques_mobile_1`.
  - Desktop explicito: `home_bauhaus_central_hub_desktop`, `home_centro_de_operaci_n_desktop`, `canvas_desktop`, `canvas_de_tareas_desktop`, `paquetes_desktop`.
  - Compartido (responsive o ambiguo): el resto.

### Carpetas relevantes por dominio
- **Acceso**: `acceso_login`
- **Home / centro operativo**: `home_acci_n_r_pida_mobile`, `home_bauhaus_hub_green_mobile`, `home_bauhaus_central_hub_desktop`, `home_centro_de_operaci_n_desktop`, `home_proyectos_limpio`
- **Obras y tablero**: `listado_de_obras`, `obras`, `detalle_de_obra`, `tablero_de_obra`, `historial_general`, `trabajo_en_curso`
- **Tareas y planificacion**: `gesti_n_de_tareas`, `lista_de_tareas`, `checklist tareas`, `cargar_plan_workflow_initial_step`, `builder_crear_tarea`
- **Canvas / plan de obra**: `canvas_desktop`, `canvas_mobile`, `canvas_de_tareas_desktop`, `canvas_nivel_1_5_nodos`, `canvas_nivel_2_10_nodos`, `canvas_nivel_3_complejidad_alta`, `canvas_detalle_de_tarea_sub_nivel`, `plan_de_obra_canvas`, `builder_canvas_de_obra`
- **Socios / marketplace**: `marketplace_de_socios`, `ficha_de_socio`, `seleccionar_socio`, `contratistas_mvp`
- **Solicitudes / presupuestos**: `builder_resumen_de_solicitud`, `detalle_de_solicitud`, `comparar_presupuestos`, `presupuesto_recibido`
- **Validaciones / evidencias**: `validar_mobile`, `validar_block_evidence`, `validaciones_pendientes`, `validaci_n_de_obra`, `validaci_n_de_bloques_1`, `validaci_n_de_bloques_2`, `validar_bloques_mobile_1`, `validar_bloques_mobile_2`
- **Finanzas / escrow**: `billetera`, `movimientos_de_billetera`, `dinero_y_escrow`, `liberar_pago`, `liberar_pago_escrow`
- **Paquetes**: `paquetes_desktop`, `paquetes_publicados`, `detalle_de_paquete`
- **Cuenta**: `perfil_y_ajustes`

## 3. Analisis de duplicados y solapamientos
- **Home duplicado**: cinco variantes (`home_*`) con mismo objetivo y estilos distintos.
- **Obras duplicado**: `listado_de_obras` y `obras` representan el mismo modulo (listado/proyectos).
- **Canvas superpuesto**: `canvas_*`, `plan_de_obra_canvas` y `builder_canvas_de_obra` describen la misma capacidad con distinta densidad o enfoque.
- **Validaciones muy duplicado**: familia `validar*` + `validaci_n*` + `validaciones_pendientes` repite lista/detalle/aprobacion.
- **Finanzas redundante**: `liberar_pago` y `liberar_pago_escrow` son variaciones del mismo paso.
- **Paquetes duplicado**: `paquetes_desktop` y `paquetes_publicados` compiten por la misma pantalla de listado.

### Que se fusiona
- Home: consolidar en 1 base desktop + 1 variante mobile (mismo modulo).
- Canvas: consolidar en 1 modulo con estados de complejidad (no 3 carpetas separadas por numero de nodos).
- Validaciones: consolidar en flujo unico lista -> detalle -> decision.
- Obras: consolidar listado unico y detalle unico.
- Finanzas: consolidar billetera + escrow + liberar pago en un modulo de finanzas.

### Que se descarta del baseline
- Variantes que solo cambian estilo visual sin cambiar comportamiento.
- Nombres/brand alternativos que no pertenezcan a Grows operativo.

## 4. Modulos funcionales detectados
- **Home operativo**: resumen, accesos rapidos, estado global.
- **Obras**: listado de obras, detalle de obra, tablero.
- **Tareas**: lista, gestion, checklist, estado de ejecucion.
- **Plan / Canvas**: orden tecnico de bloques/tareas y dependencias.
- **Validaciones y evidencias**: revision de entregables y aprobacion/rechazo.
- **Socios / marketplace**: busqueda, comparacion y seleccion de socios.
- **Solicitudes y presupuestos**: emision, seguimiento y comparacion de propuestas.
- **Finanzas (wallet/escrow)**: movimientos, fondos, liberacion de pago.
- **Paquetes**: publicacion y detalle de paquetes de obra.
- **Perfil y ajustes**: configuracion de cuenta.
- **Historial**: trazabilidad de obras y eventos.

## 5. Arquitectura final propuesta
- Arquitectura orientada a modulos funcionales (no por mock suelto).
- Una navegacion principal para socio/arquitecto:
  - Home
  - Obras
  - Tareas
  - Validaciones
  - Socios
  - Presupuestos
  - Finanzas
  - Perfil
- Flujo jerarquico recomendado:
  - `Home` -> `Obras` -> `Detalle de obra` -> (`Tablero` / `Tareas` / `Canvas` / `Validaciones` / `Finanzas obra`)
- Presupuestos y socios quedan como modulos de soporte transversal vinculados a obra/tarea.
- Historial queda como transversal para auditoria y trazabilidad.
- Decision de arquitectura UI: **base responsive unica con variantes de layout por breakpoint**, evitando dos arboles paralelos mobile/desktop.

## 6. Estructura de carpetas recomendada
- Objetivo: reflejar dominios reales del producto y permitir convivencia con el core actual.

```text
apps/web/
  app/
    (auth)/
      login/
        page.tsx

    (socio-arquitecto)/
      home/
        page.tsx

      obras/
        page.tsx
        [obraId]/
          page.tsx
          tablero/
            page.tsx
          tareas/
            page.tsx
            [tareaId]/
              page.tsx
          canvas/
            page.tsx
            [nodoId]/
              page.tsx
          validaciones/
            page.tsx
            [bloqueId]/
              page.tsx
          finanzas/
            page.tsx

      socios/
        page.tsx
        seleccionar/
          page.tsx
        [socioId]/
          page.tsx

      presupuestos/
        page.tsx
        comparar/
          page.tsx
        [solicitudId]/
          page.tsx

      paquetes/
        page.tsx
        [paqueteId]/
          page.tsx

      historial/
        page.tsx

      perfil/
        page.tsx

  components/
    socio-arquitecto/
      layout/
        Sidebar.tsx
        Topbar.tsx
        BottomNavMobile.tsx
      shared/
        EmptyState.tsx
        LoadingState.tsx
        ErrorState.tsx
        KPIBlock.tsx
      obras/
      tareas/
      canvas/
      validaciones/
      socios/
      presupuestos/
      finanzas/
      paquetes/
```

- Componentes compartidos clave:
  - navegacion (sidebar/topbar/bottom-nav)
  - estados base (empty/loading/error)
  - tarjetas, tablas, filtros, modales de confirmacion
- Componentes especificos:
  - canvas/nodos/dependencias
  - validacion de evidencia
  - comparacion de presupuestos
  - escrow/liberacion

## 7. Que se conserva / que se elimina
### Conservar
- `home_centro_de_operaci_n_desktop`
- `home_bauhaus_hub_green_mobile` (o `home_acci_n_r_pida_mobile`, elegir uno)
- `listado_de_obras`
- `detalle_de_obra`
- `gesti_n_de_tareas`
- `tablero_de_obra`
- `plan_de_obra_canvas`
- `canvas_desktop`
- `marketplace_de_socios`
- `ficha_de_socio`
- `seleccionar_socio`
- `comparar_presupuestos`
- `presupuesto_recibido`
- `billetera`
- `dinero_y_escrow`
- `liberar_pago_escrow`
- `perfil_y_ajustes`

### Fusionar
- Homes: `home_*` -> modulo unico Home
- Obras: `obras` + `listado_de_obras`
- Canvas: `canvas_*` + `plan_de_obra_canvas` + `builder_canvas_de_obra`
- Validaciones: `validar*` + `validaci_n*` + `validaciones_pendientes` + `validar_block_evidence`
- Finanzas: `liberar_pago` + `liberar_pago_escrow`
- Paquetes: `paquetes_desktop` + `paquetes_publicados`

### Eliminar
- Carpetas claramente descartables tras fusion:
  - `canvas_nivel_1_5_nodos`
  - `canvas_nivel_2_10_nodos`
  - `home_proyectos_limpio`
  - `trabajo_en_curso`
  - `liberar_pago` (si se adopta `liberar_pago_escrow`)
  - `paquetes_desktop` (si se adopta `paquetes_publicados`)
  - una de estas dos: `home_bauhaus_hub_green_mobile` o `home_acci_n_r_pida_mobile`
  - una de estas dos: `obras` o `listado_de_obras` (recomendado conservar `listado_de_obras`)

### Revisar manualmente
- `builder_resumen_de_solicitud` (definir si va en flujo final o como wizard interno)
- `builder_crear_tarea` y `cargar_plan_workflow_initial_step` (ver si quedan como onboarding o admin interno)
- `detalle_de_solicitud` (alinear con flujo real de presupuestos)
- `contratistas_mvp` (validar si se fusiona con `marketplace_de_socios`)
- `movimientos_de_billetera` (aprovechar su estado vacio, pero unificar visualmente con billetera)
- toda la familia de validaciones para elegir un solo lenguaje visual y un solo flujo

## 8. Faltantes a pedir a Stitch
- **Pantallas faltantes funcionales**
  - estado vacio de obras/tareas/validaciones/presupuestos/socios
  - vista de detalle de tarea completa con timeline de eventos
  - flujo de reasignacion de tarea/socio
  - version final de centro de notificaciones
- **Variantes faltantes**
  - mobile de detalle de obra y detalle de presupuesto con la misma informacion que desktop
  - tablet/intermedio para canvas y validaciones
- **Estados faltantes**
  - loading/skeleton en listas y detalle
  - error de carga, error de accion, error de permisos
  - sin resultados en filtros/busquedas
- **Componentes faltantes**
  - filtros avanzados reutilizables
  - paginacion/listado estandar
  - componentes de estado transaccional (toast, confirmaciones, banners)
- **Faltantes de navegacion**
  - mapa de rutas consistente socio/arquitecto
  - breadcrumbs consistentes por modulo

## 9. Recomendacion final
- **Siguiente paso concreto**
  - congelar canonicamente: 1 home desktop + 1 home mobile, 1 listado obras, 1 canvas base, 1 flujo validaciones, 1 flujo finanzas.
  - convertir estas decisiones en backlog de implementacion por modulo (sin tocar landing ni backend).
- **Riesgos**
  - implementar varias variantes en paralelo volveria a fragmentar el producto.
  - mezclar branding y naming reduce coherencia y aumenta deuda de UX.
  - duplicar mobile/desktop por separado aumenta costo de mantenimiento.
- **Decisiones que conviene congelar ya**
  - arquitectura responsive unica con variantes de layout (no doble app).
  - nomenclatura oficial de modulos/rutas.
  - flujo oficial de validaciones y flujo oficial de canvas.
  - criterio de descarte de carpetas redundantes antes de pedir nuevas pantallas a Stitch.

