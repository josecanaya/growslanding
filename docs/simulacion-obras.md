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

Cada obra tiene un símbolo MCU, valor de referencia, historial de seis meses, emisión y tres rondas ficticias. El escenario financiero está fechado al 9 de noviembre de 2026. El valor de referencia se distingue del precio de emisión. El buscador combina obra, símbolo, ciudad y rondas abiertas o próximas. La calculadora usa cantidades enteras y centavos; no ejecuta compras. El seguimiento de rondas es local a la sesión. Estos datos no acreditan acciones societarias ni cotizaciones reales.
