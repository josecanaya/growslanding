# Informe consolidado - Perfiles GROWS

## Introduccion

GROWS es una plataforma digital B2B para la gestion inteligente de obras pequenas y medianas. Su objetivo es conectar clientes tecnicos (arquitectos o coordinadores de obra) con socios constructores (cuadrillas o profesionales de oficio) dentro de un ecosistema centralizado y trazable. Este informe resume los dos perfiles nucleares y la relacion operativa que sostiene el flujo digital de GROWS.

---

## Rol 1: Cliente tecnico (Arquitecto / Coordinador de obra)

### Descripcion general

El Cliente Tecnico es el usuario suscriptor principal de la plataforma. Representa estudios de arquitectura, arquitectos independientes o pequenas constructoras. Administra obras, asigna cuadrillas y valida resultados finales dentro del flujo digital de GROWS.

### Perfil demografico

- Tipo de empresa: estudio o constructora pequena (1-15 personas).
- Proyectos activos: 2-10 obras simultaneas.
- Ticket promedio: USD 50 000 - 500 000.
- Zona principal: Argentina (espanol rioplatense) con proyeccion LATAM.

### Problemas que enfrenta

- Falta de planificacion sistematica y cronogramas claros.
- Desconexion entre cuadrillas, socios y supervisores.
- Ausencia de registros confiables y trazabilidad tecnica.
- Herramientas digitales inadecuadas o excesivamente complejas.
- Dependencia de WhatsApp y hojas de calculo para la gestion diaria.

### Funciones dentro de GROWS

- Administra obras y tareas mediante panel B2B multi tenant.
- Crea y aplica plantillas constructivas (mas de 1800 tareas) con dependencias automaticas.
- Supervisa avances mediante cronogramas CPM y maquina de estados (FSM).
- Valida entregas y autoriza pagos automaticos a socios.
- Accede a metricas de costos, productividad y reputacion.
- Interactua con GrowsBot (IA) para consultas tecnicas, calculos o sugerencias.
- Integra sistemas externos (Supabase, n8n, analitica, pagos, calendarios).

### Beneficios clave

- Control integral del proceso constructivo.
- Registro auditable de decisiones y evidencias.
- Optimiza tiempos y reduce conflictos operativos.
- Mayor profesionalizacion y escalabilidad del estudio.

### Panel del Cliente Tecnico

El panel web del cliente tecnico (`/cliente-tecnico`) concentra la operacion diaria y se organiza en modulos navegables desde una barra lateral adaptable. Cada bloque responde a casos de uso concretos:

- **Chat con GrowsBot**: integra el asistente conectado a flujos n8n para resolver consultas tecnicas, obtener recomendaciones y disparar automatizaciones sin salir del panel.
- **Obras**: gestiona el portfolio completo con filtros, KPI por obra, tarjetas de estado, aperturas de detalle y formularios para crear, editar o pausar proyectos incluyendo presupuesto, cronograma y legajo tecnico.
- **Tareas**: ofrece un tablero de seguimiento con dependencias, timeline interactivo, priorizacion y editor visual de plantillas para ajustar el camino critico y las asignaciones.
- **Cuadrillas**: centraliza la administracion de equipos externos mediante KPIs, grilla por especialidad, tablero kanban, visores de cumplimiento y flujos para asignar socios a obras.
- **Notificaciones e informes**: presenta un feed accionable para validar avances, detectar incidentes y emitir reportes formales hacia socios o clientes finales.
- **Calendario**: alinea eventos, hitos y rangos de tareas en vistas semana/mes, permitiendo supervisar recursos y coordinar reuniones o entregas.
- **Cuenta y preferencias**: guarda datos profesionales, requisitos fiscales, idioma, notificaciones y accesos rapidos a configuraciones de seguridad para la organizacion.

---

## Rol 2: Socio constructor

### Descripcion general

El Socio Constructor es el rol operativo responsable de ejecutar tareas en obra, documentar avances y preservar su reputacion dentro del ecosistema. Puede ser un profesional independiente o un lider de cuadrilla especializada (albanil, plomero, yesero, electricista, etc.).

### Caracteristicas del usuario

- Profesional u oficio con cuadrilla propia o microequipo (hasta 4 personas).
- Usuario mobile first: trabaja principalmente desde smartphone.
- Accede de forma gratuita al ecosistema.
- Busca visibilidad, reputacion y pagos rapidos.

### Funcionalidades principales

- Gestiona obras y tareas asignadas mediante checklist digital.
- Sube presupuestos con evidencia fotografica geolocalizada.
- Controla progreso y cumplimiento de etapas.
- Participa en el sistema de reputacion y niveles (Hierro -> Bronce -> Plata -> Platino -> Oro).
- Consulta y recibe notificaciones automaticas sobre validaciones, pagos o alertas.
- Se comunica con el Cliente Tecnico a traves del flujo FSM.

### Reputacion y validacion

Cada tarea avanza por los estados: Propuesta -> Presupuestada -> Asignada -> En ejecucion -> Terminada -> Validada. Solo el Cliente Tecnico puede validar tareas finalizadas; esa accion dispara el pago automatico y la actualizacion de reputacion para el socio.

### Soporte inteligente

GrowsBot ofrece soporte 24/7: responde dudas tecnicas (por ejemplo, rendimientos de materiales), sugiere optimizaciones operativas y conserva contexto de conversaciones para seguimiento continuo.

### Panel del Socio Constructor

El panel mobile-first del socio (`/panel`) prioriza operaciones rapidas desde obra, con una experiencia pensada para smartphone:

- **Tareas en curso**: muestra una cola accionable con estados deslizable, inicio y cierre con evidencia, indicadores de tiempo y accesos directos a checklist, evidencias y chat. Un boton “swipe up” dispara la camara para documentar avances.
- **Mi cuadrilla**: consolida integrantes, roles, vigencia de seguros, alertas y documentacion, e incluye acciones rapidas para sumar personal o subir certificados.
- **Notificaciones**: agrupa avisos por tipo (exito, alerta, error, info), permite marcarlos como leidos, ejecutar acciones sugeridas y cuantificar pendientes.
- **Perfil y cuenta**: resume nivel, rating, ingresos, seguros, certificados y configuraciones basicas, ademas de ofrecer salida de sesion segura.
- **Navegacion superior**: un menu lateral emergente concentra la navegacion y el acceso a cierre de sesion con identidad del socio y etiqueta de rol sincronizada con permisos.

---

## Relacion entre roles

| Rol                | Tipo de usuario          | Responsabilidad central              | Interaccion principal            |
|--------------------|--------------------------|--------------------------------------|----------------------------------|
| Cliente tecnico    | Suscriptor principal     | Planificacion, aprobacion y control  | Asigna, valida y paga            |
| Socio constructor  | Usuario operativo gratuito | Ejecucion, documentacion y reputacion | Reporta avances y presupuestos   |

Ambos roles estan integrados en la GROWS Control Tower, que orquesta datos, estados y automatizaciones para mantener trazabilidad entre la planificacion (cliente) y la ejecucion (socio).

---

## Conclusion

El Cliente Tecnico disena, planifica y valida. El Socio Constructor ejecuta, reporta y potencia su reputacion digital. El equilibrio entre ambos asegura un flujo de trabajo auditable, eficiente y escalable, combinando IA, trazabilidad y gestion moderna para obras pequenas y medianas.
