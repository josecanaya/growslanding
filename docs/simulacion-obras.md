# Laboratorio de obras compartidas

Ruta: `/inversores/simulacion`. También accesible desde «Explorar 15 obras ficticias» en el feed.

Los escenarios se mantienen en memoria del navegador y se reinician al recargar. No hay escrituras en Supabase, cuentas creadas, inversiones ni envíos externos. El perfil de presentación no reemplaza los permisos de producción por obra.

## Recorrido

El feed es público. Al tocar una obra se comprueba la identidad con Supabase y, si falta sesión, se presenta el acceso al login conservando `?obra=demo-N`. El callback retorna a la misma obra.

Después del login, se recupera la preferencia `grows_feed_profile` de la cuenta. Para cuentas existentes, los perfiles operativos emitidos por el servidor se traducen a profesional o contratista. Si no hay perfil, se elige profesional, contratista o inversor y se guarda como preferencia de presentación.

Los profesionales y contratistas entran en Trabajos; los inversores en Inversión. Los tres conservan el mismo espacio de obra y sus conversaciones habilitadas. Se puede editar la preferencia desde Mi perfil. Elegir un perfil para estas obras ficticias no concede permisos sobre obras reales.

Contratista presenta evidencia → profesional valida → inversor consulta el avance validado. Las acciones del escenario siguen en memoria y se reinician al recargar; la identidad y la preferencia se conservan en Supabase.

## Escenarios

| Obra | Localidad | Interacción central |
|---|---|---|
| Casa Patio | Rosario | Estructura → mampostería |
| Ribera Norte | Santa Fe | Ensayo → cubierta |
| Taller del Sur | Córdoba | Trazado → cableado |
| Los Aromos | Funes | Medidas → fabricación |
| Distrito Parque | Mendoza | Excavación → fundaciones |
| Escuela Horizonte | La Plata | Accesibilidad → rampas |
| Mercado Central | Paraná | Recepción → montaje |
| Casa del Lago | Bariloche | Aislación → revestimiento |
| Clínica Alameda | Buenos Aires | Prueba hidráulica → cierre |
| Dúplex Encuentro | Neuquén | Validación de losa → muros |
| Hotel del Valle | Salta | Modelo → repetición |
| Centro Semilla | Tucumán | Inspección → entrega |
| Galpón Logístico | Pilar | Compactación → piso |
| Pasaje Olivos | Vicente López | Protecciones → demolición |
| Terrazas del Este | Mar del Plata | Barandas → habilitación |

## Alcance y siguiente integración

La simulación comprueba una experiencia compartida y reglas de transición, no valida la operación técnica de una construcción. El avance es la proporción de bloques validados, con igual peso. No es avance físico ponderado ni certificado económico.

Las quince obras ejercitan variantes del circuito evidencia-validación-dependencia. No simulan aún una contratación completa, pagos, un cronograma real, permisos de base de datos, concurrencia multiusuario ni interpretación libre mediante LLM. Para pasar a producción se requiere conectar participaciones por obra y permisos de servidor, eventos persistentes y bloques/tareas existentes. El canvas, los presupuestos y el puente actual permanecen sin cambios.

## Inversión MCU

Cada obra tiene un símbolo MCU, valor de referencia, historial de seis meses, emisión y tres rondas ficticias. El escenario financiero está fechado al 9 de noviembre de 2026. El valor de referencia se distingue del precio de emisión. El buscador combina obra, símbolo, ciudad y rondas abiertas o próximas. La calculadora recibe USD, devuelve MCU enteras y muestra el importe aplicado y la diferencia sin aplicar; opera en centavos y admite coma o punto decimal. No ejecuta compras. El seguimiento de rondas es local a la sesión. Estos datos no acreditan acciones societarias ni cotizaciones reales.

## Paquetes para una unidad completa

La pestaña Paquetes permite explorar viviendas completas dentro de la misma obra. En obras residenciales hay dos unidades ficticias con superficie, ambientes y precio total. Las demás obras muestran que no hay viviendas publicadas. El precio se divide en cinco etapas: proyecto/documentación 20%, fundaciones/estructura 30%, cerramientos/instalaciones 25%, terminaciones 20%, inspección/entrega 5%. Los importes suman exactamente el precio, ajustando centavos en la última etapa.

Es un esquema ilustrativo asociado a hitos, sin cuotas cobradas ni fechas contractuales. Los paquetes no se convierten automáticamente desde MCU. Consultar por una unidad prepara un borrador en la conversación de la obra; el usuario lo revisa y publica. No se crea una reserva ni se realiza un pago.

## Análisis financiero y proyecciones

La vista Inversión incluye comparación de m², historia y tres escenarios futuros, supuestos editables de venta/costos/plazo, resultado de la posición MCU, equivalente anualizado y desglose de valuación. Los comparables son cuatro referencias sintéticas por obra y se muestran con su media simple; no proceden de avisos ni de ventas reales. El m² publicado usa precios y áreas de los paquetes disponibles.

El modelo supone cierre de todas las rondas pendientes e igualdad de derechos de las MCU. Distribución = máximo entre cero y (caja inicial + capital de rondas pendientes + superficie vendible × precio de venta − gastos de comercialización − costos pendientes − deuda). MCU al cierre = distribución / todas las MCU previstas. La caja inicial excluye fondos de rondas abiertas; el capital de esas rondas se suma una sola vez. El capital de rondas ya cerradas no vuelve a sumarse. Retorno = MCU al cierre / precio de entrada de la ronda − 1. Anualizado = (MCU al cierre / precio de entrada)^(12 / meses) − 1. Se supone un aporte inicial y una distribución final, sin flujos intermedios; no es una TIR de obra con aportes por etapas.

Adverso: venta −20%, costos +20%, plazo +6 meses. Favorable: venta +12%, costos −5%, plazo −3 meses (mínimo uno). El precio de equilibrio recupera el precio de entrada bajo esos mismos supuestos. Si falta caja para terminar antes de vender, se muestra el faltante como financiación adicional no modelada. Se excluyen impuestos personales, inflación, costo financiero adicional y liquidez secundaria. El gráfico punteado une referencia con distribución terminal: no representa transacciones ni una predicción de precios intermedios. No se asignan probabilidades ni se garantiza un resultado.