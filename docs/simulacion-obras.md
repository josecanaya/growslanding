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

## General y valor objetivo

El general de MCU integra valor de referencia, un único valor objetivo y su horizonte en la misma tarjeta. El gráfico une historial continuo con una proyección punteada hacia el objetivo. 3M/6M filtra solamente el historial y no cambia la valuación. La pantalla utiliza el caso base existente, sin seleccionar resultados más favorables ni forzar rendimientos positivos. Se retiraron del recorrido los escenarios alternativos, el editor de hipótesis y la tabla de retornos por escenario.

El potencial hasta objetivo compara contra valor de referencia; la posición personal compara contra el aporte aplicado al precio de ronda. La proyección sigue siendo una distribución hipotética al cierre, no una cotización negociada. El cálculo y sus costos quedan en un desplegable. Los comparables por m² permanecen disponibles con indicación de que son sintéticos.

El modelo conserva internamente sus cálculos y pruebas de escenarios y pérdidas. Distribución = máximo entre cero y (caja inicial + capital de rondas pendientes + ventas − comercialización − costos pendientes − deuda), dividido por las MCU después de las emisiones. Se supone suscripción completa, iguales derechos y ausencia de flujos intermedios; se excluyen impuestos personales, inflación, financiación adicional y liquidez secundaria. El valor objetivo no garantiza el resultado.