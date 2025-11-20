# Auditoría Completa de Elementos GROWS

**Fecha de auditoría:** 2025-01-XX  
**Versión del catálogo:** 1.0.0  
**Archivo fuente principal:** `apps/web/lib/catalogos/catalogo-elementos-constructivos.json`

---

## 📋 Resumen Ejecutivo

- **Total de categorías:** 7
- **Total de subcategorías:** 21
- **Total de elementos:** ~103 elementos
- **Fuente de datos:** JSON estático (`catalogo-elementos-constructivos.json`)
- **Integración con Supabase:** Sí (tabla `elementos`)
- **Generación automática de tareas:** Sí (vía `ExpansorElementos`)

---

## 🗂️ Estructura de Datos

### Archivos Principales

1. **`apps/web/lib/catalogos/catalogo-elementos-constructivos.json`**
   - Catálogo completo en formato JSON
   - Estructura: `categorias[] → subcategorias[] → elementos[]`
   - Cada elemento incluye: `id`, `nombre`, `unidad`, `opciones`, `tareas[]`

2. **`apps/web/lib/catalogos/elementos.ts`**
   - Exporta `catalogoCompletoJson`
   - Función `mapearTareasAFases()` para clasificar tareas en fases

3. **`apps/web/lib/services/expansorElementos.ts`**
   - Servicio que genera tareas automáticamente desde elementos
   - Usa `elementos-vivienda.ts` y `tareas-construccion.ts` como fuente
   - Mapea códigos cortos (R01, H01) a códigos largos (REP001, HOR005)

4. **`apps/web/components/cliente/CargaElementosPanel.tsx`**
   - Componente principal que consume el catálogo
   - Muestra categorías, subcategorías y elementos
   - Permite cargar elementos a obras

### Base de Datos (Supabase)

**Tabla: `elementos`**
- `id` (UUID, PK)
- `obra_id` (UUID, FK → obras)
- `nombre` (string)
- `categoria` (string, nullable)
- `subcategoria` (string, nullable)
- `cantidad` (number, nullable)
- `unidad` (string, nullable)
- `descripcion` (string, nullable)
- `costo_unitario` (number, nullable)
- `duracion_estimada` (number, nullable)
- `orden` (number, nullable)
- `plantilla_elemento_id` (UUID, nullable)
- `created_at` (timestamp)

**Relación con tareas:**
- Tabla `tareas` tiene `elemento_id` (FK → elementos)
- Las tareas se generan automáticamente al crear un elemento (si `crearTareas=true`)

---

## 📊 CATEGORÍAS Y ELEMENTOS COMPLETOS

### CATEGORÍA 1: Fundación y Estructura
**ID:** `fundacion_estructura`  
**Orden:** 1

#### Subcategoría 1.1: Excavación
**ID:** `excavacion`

- **Elemento:** Excavación de fundación manual
  - **ID:** `excavacion_manual`
  - **Unidad:** m³
  - **Opciones:**
    - `profundidad`: ["0.5m", "0.8m", "1.0m", "1.2m"]
    - `tipo_suelo`: ["normal", "tosca", "arcilloso"]
  - **Tareas:** ["replanteo", "excavación manual", "nivelación", "compactación"]
  - **Fase:** Estructura

- **Elemento:** Excavación de fundación mecánica
  - **ID:** `excavacion_mecanica`
  - **Unidad:** m³
  - **Opciones:**
    - `profundidad`: ["0.5m", "0.8m", "1.0m", "1.2m", "1.5m"]
    - `tipo_suelo`: ["normal", "tosca", "arcilloso", "roca"]
    - `maquinaria`: ["retroexcavadora", "pala cargadora"]
  - **Tareas:** ["replanteo", "excavación mecánica", "nivelación", "compactación"]
  - **Fase:** Estructura

#### Subcategoría 1.2: Fundaciones
**ID:** `fundaciones`

- **Elemento:** Platea de fundación
  - **ID:** `platea_fundacion`
  - **Unidad:** m³
  - **Opciones:**
    - `espesor`: ["15cm", "20cm", "25cm"]
    - `resistencia`: ["H17", "H21", "H30"]
    - `armadura`: ["malla 15x15 Ø6", "malla 15x15 Ø8", "doble malla"]
    - `aislacion`: ["sin aislación", "polietileno 200μ", "membrana geotextil"]
  - **Tareas:** ["nivelación terreno", "encofrado", "colocación armadura", "hormigonado", "curado", "desencofrado"]
  - **Fase:** Estructura

- **Elemento:** Zapatas aisladas
  - **ID:** `zapatas_aisladas`
  - **Unidad:** m³
  - **Opciones:**
    - `dimensiones`: ["60x60cm", "80x80cm", "100x100cm", "120x120cm"]
    - `profundidad`: ["40cm", "50cm", "60cm"]
    - `resistencia`: ["H17", "H21", "H30"]
    - `armadura`: ["Ø8", "Ø10", "Ø12"]
  - **Tareas:** ["excavación puntual", "encofrado", "armado", "hormigonado", "curado"]
  - **Fase:** Estructura

- **Elemento:** Vigas de fundación
  - **ID:** `vigas_fundacion`
  - **Unidad:** m
  - **Opciones:**
    - `sección`: ["20x40cm", "25x40cm", "30x40cm"]
    - `resistencia`: ["H17", "H21", "H30"]
    - `armadura`: ["4Ø10", "4Ø12", "6Ø12"]
  - **Tareas:** ["encofrado", "armado", "hormigonado", "curado", "desencofrado"]
  - **Fase:** Estructura

#### Subcategoría 1.3: Hormigón Armado
**ID:** `hormigon_armado`

- **Elemento:** Bases de hormigón armado
  - **ID:** `bases_hormigon`
  - **Unidad:** m³
  - **Opciones:**
    - `tipo`: ["base corrida", "base aislada"]
    - `resistencia`: ["H17", "H21", "H30"]
    - `armadura`: ["Ø8", "Ø10", "Ø12"]
  - **Tareas:** ["encofrado", "colocación armadura", "hormigonado", "vibrado", "curado"]
  - **Fase:** Estructura

- **Elemento:** Columnas de hormigón armado
  - **ID:** `columnas_hormigon`
  - **Unidad:** m
  - **Opciones:**
    - `sección`: ["20x20cm", "25x25cm", "30x30cm", "20x40cm"]
    - `resistencia`: ["H21", "H30"]
    - `armadura_longitudinal`: ["4Ø10", "4Ø12", "6Ø12", "8Ø12"]
    - `estribos`: ["Ø6@15cm", "Ø6@20cm", "Ø8@15cm"]
  - **Tareas:** ["encofrado", "armado longitudinal", "colocación estribos", "hormigonado", "vibrado", "curado", "desencofrado"]
  - **Fase:** Estructura

- **Elemento:** Columnas metálicas
  - **ID:** `columnas_metalicas`
  - **Unidad:** m
  - **Opciones:**
    - `perfil`: ["HEB 160", "HEB 180", "HEB 200", "IPE 200", "IPE 240"]
    - `terminacion`: ["sin pintura", "antióxido", "pintura epoxi"]
    - `base`: ["con placa de anclaje", "sin placa"]
  - **Tareas:** ["replanteo", "montaje", "aplomado", "soldadura/bulonado", "pintura"]
  - **Fase:** Estructura

- **Elemento:** Vigas de hormigón armado
  - **ID:** `vigas_hormigon`
  - **Unidad:** m
  - **Opciones:**
    - `sección`: ["20x40cm", "25x40cm", "30x50cm"]
    - `resistencia`: ["H21", "H30"]
    - `armadura_superior`: ["2Ø10", "2Ø12", "4Ø12"]
    - `armadura_inferior`: ["2Ø10", "2Ø12", "4Ø12"]
    - `estribos`: ["Ø6@15cm", "Ø6@20cm", "Ø8@15cm"]
  - **Tareas:** ["encofrado", "armado", "hormigonado", "vibrado", "curado", "desencofrado"]
  - **Fase:** Estructura

- **Elemento:** Vigas metálicas
  - **ID:** `vigas_metalicas`
  - **Unidad:** m
  - **Opciones:**
    - `perfil`: ["IPE 160", "IPE 180", "IPE 200", "IPE 240", "IPE 270"]
    - `terminacion`: ["sin pintura", "antióxido", "pintura epoxi"]
    - `conexion`: ["soldada", "bulonada"]
  - **Tareas:** ["replanteo", "montaje", "nivelación", "soldadura/bulonado", "pintura"]
  - **Fase:** Estructura

- **Elemento:** Losa maciza de hormigón armado
  - **ID:** `losa_maciza`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor`: ["12cm", "15cm", "18cm", "20cm"]
    - `resistencia`: ["H21", "H30"]
    - `armadura`: ["malla Ø8@15cm", "malla Ø10@15cm", "doble malla"]
    - `aislacion`: ["sin aislación", "EPS 2cm", "EPS 3cm", "lana de vidrio"]
  - **Tareas:** ["encofrado", "armado", "instalaciones embutidas", "hormigonado", "vibrado", "curado", "desencofrado"]
  - **Fase:** Estructura

- **Elemento:** Losa alivianada
  - **ID:** `losa_alivianada`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor_total`: ["18cm", "20cm", "22cm"]
    - `alivianamiento`: ["bovedillas cerámicas", "EPS", "cajones recuperables"]
    - `nervios`: ["cada 50cm", "cada 60cm"]
    - `resistencia`: ["H21", "H30"]
  - **Tareas:** ["encofrado", "colocación nervios", "colocación alivianamiento", "malla superior", "hormigonado", "curado", "desencofrado"]
  - **Fase:** Estructura

- **Elemento:** Losa pretensada
  - **ID:** `losa_pretensada`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo`: ["viguetas pretensadas + bovedilla", "placas pretensadas"]
    - `espesor`: ["18cm", "20cm", "22cm"]
    - `luz`: ["hasta 4m", "hasta 5m", "hasta 6m"]
    - `capa_compresion`: ["4cm", "5cm"]
  - **Tareas:** ["replanteo", "montaje viguetas", "colocación bovedillas", "malla superior", "capa de compresión", "curado"]
  - **Fase:** Estructura

---

### CATEGORÍA 2: Muros y Cerramientos
**ID:** `muros_cerramientos`  
**Orden:** 2

#### Subcategoría 2.1: Muros Exteriores
**ID:** `muros_exteriores`

- **Elemento:** Muro de ladrillo común 15 cm
  - **ID:** `muro_ladrillo_comun_15`
  - **Unidad:** m²
  - **Opciones:**
    - `configuracion`: ["simple", "con aislación intramuro"]
    - `aislacion`: ["sin aislación", "EPS 2cm", "EPS 3cm", "lana de vidrio 5cm", "poliuretano proyectado"]
    - `terminacion_exterior`: ["revoque + pintura", "ladrillo visto", "revestimiento piedra", "siding vinílico", "siding cementicio"]
    - `terminacion_interior`: ["revoque + pintura", "yeso", "durlock sobre muro"]
  - **Tareas:** ["replanteo", "levantar muro", "colocar aislación (si aplica)", "revoque grueso exterior", "revoque fino exterior", "revoque grueso interior", "revoque fino interior", "terminación elegida"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Muro de ladrillo común 30 cm (doble muro)
  - **ID:** `muro_ladrillo_comun_30`
  - **Unidad:** m²
  - **Opciones:**
    - `configuracion`: ["doble muro con cámara de aire", "doble muro con aislación"]
    - `aislacion`: ["sin aislación", "EPS 3cm", "EPS 5cm", "lana de vidrio 5cm", "poliuretano proyectado"]
    - `terminacion_exterior`: ["revoque + pintura", "ladrillo visto", "revestimiento piedra", "siding vinílico", "siding cementicio"]
    - `terminacion_interior`: ["revoque + pintura", "yeso", "durlock sobre muro"]
  - **Tareas:** ["replanteo", "levantar muro exterior", "colocar aislación", "levantar muro interior", "revoque grueso exterior", "revoque fino exterior", "revoque grueso interior", "revoque fino interior", "terminación elegida"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Muro de ladrillo cerámico hueco 18 cm
  - **ID:** `muro_ladrillo_ceramico_18`
  - **Unidad:** m²
  - **Opciones:**
    - `configuracion`: ["simple", "con aislación exterior", "con aislación interior"]
    - `aislacion`: ["sin aislación", "EPS 2cm", "EPS 3cm", "lana de vidrio"]
    - `terminacion_exterior`: ["revoque + pintura", "revestimiento", "siding"]
    - `terminacion_interior`: ["revoque + pintura", "yeso"]
  - **Tareas:** ["replanteo", "levantar muro", "colocar aislación (si aplica)", "revoque grueso", "revoque fino", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Muro de ladrillo cerámico hueco 20 cm
  - **ID:** `muro_ladrillo_ceramico_20`
  - **Unidad:** m²
  - **Opciones:**
    - `configuracion`: ["simple", "con aislación"]
    - `aislacion`: ["sin aislación", "EPS 3cm", "lana de vidrio 5cm"]
    - `terminacion_exterior`: ["revoque + pintura", "revestimiento", "siding"]
    - `terminacion_interior`: ["revoque + pintura", "yeso"]
  - **Tareas:** ["replanteo", "levantar muro", "colocar aislación (si aplica)", "revoque grueso", "revoque fino", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Muro de bloque de hormigón 15 cm
  - **ID:** `muro_bloque_hormigon_15`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo_bloque`: ["común", "portante", "visto"]
    - `aislacion`: ["sin aislación", "EPS 2cm", "EPS 3cm"]
    - `terminacion_exterior`: ["revoque + pintura", "bloque visto", "revestimiento"]
    - `terminacion_interior`: ["revoque + pintura", "yeso"]
  - **Tareas:** ["replanteo", "levantar muro", "colocar aislación (si aplica)", "revoque (si aplica)", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Muro de bloque de hormigón 20 cm
  - **ID:** `muro_bloque_hormigon_20`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo_bloque`: ["común", "portante", "visto"]
    - `aislacion`: ["sin aislación", "EPS 3cm"]
    - `terminacion_exterior`: ["revoque + pintura", "bloque visto", "revestimiento"]
    - `terminacion_interior`: ["revoque + pintura", "yeso"]
  - **Tareas:** ["replanteo", "levantar muro", "colocar aislación (si aplica)", "revoque (si aplica)", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Muro de bloque de hormigón 30 cm
  - **ID:** `muro_bloque_hormigon_30`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo_bloque`: ["portante reforzado"]
    - `relleno`: ["sin relleno", "con hormigón", "con aislación"]
    - `terminacion_exterior`: ["revoque + pintura", "revestimiento"]
    - `terminacion_interior`: ["revoque + pintura"]
  - **Tareas:** ["replanteo", "levantar muro", "relleno (si aplica)", "revoque", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Muro de Retak / bloque celular 15 cm
  - **ID:** `muro_retak_15`
  - **Unidad:** m²
  - **Opciones:**
    - `aislacion`: ["sin aislación", "EPS 2cm"]
    - `terminacion_exterior`: ["revoque + pintura", "revestimiento", "siding"]
    - `terminacion_interior`: ["revoque fino + pintura", "yeso"]
  - **Tareas:** ["replanteo", "levantar muro", "colocar aislación (si aplica)", "revoque especial", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Muro de Retak / bloque celular 20 cm
  - **ID:** `muro_retak_20`
  - **Unidad:** m²
  - **Opciones:**
    - `aislacion`: ["sin aislación", "EPS 3cm"]
    - `terminacion_exterior`: ["revoque + pintura", "revestimiento", "siding"]
    - `terminacion_interior`: ["revoque fino + pintura", "yeso"]
  - **Tareas:** ["replanteo", "levantar muro", "colocar aislación (si aplica)", "revoque especial", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Panel sándwich metálico con aislación
  - **ID:** `panel_sandwich_metalico`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor_total`: ["50mm", "80mm", "100mm"]
    - `nucleo`: ["EPS", "poliuretano", "lana de roca"]
    - `exterior`: ["chapa prepintada", "chapa galvanizada pintada"]
    - `interior`: ["chapa prepintada", "chapa blanca"]
  - **Tareas:** ["replanteo", "montaje estructura soporte", "colocación paneles", "sellado juntas", "terminaciones"]
  - **Fase:** Obra gris

- **Elemento:** Muro cortina de vidrio (con DVH)
  - **ID:** `muro_cortina_vidrio`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo_vidrio`: ["DVH 4+9+4", "DVH 6+12+6", "laminado 3+3"]
    - `carpinteria`: ["aluminio estándar", "aluminio premium", "PVC"]
    - `control_solar`: ["sin control", "film", "vidrio bajo emisivo"]
    - `apertura`: ["fija", "proyectante", "oscilo-batiente"]
  - **Tareas:** ["replanteo", "montaje estructura", "colocación carpintería", "colocación vidrios", "sellado", "limpieza"]
  - **Fase:** Terminaciones

#### Subcategoría 2.2: Muros Interiores
**ID:** `muros_interiores`

- **Elemento:** Tabique de ladrillo cerámico 8 cm
  - **ID:** `tabique_ladrillo_8`
  - **Unidad:** m²
  - **Opciones:**
    - `terminacion`: ["revoque + pintura", "yeso + pintura", "cerámico", "madera"]
  - **Tareas:** ["replanteo", "levantar tabique", "revoque grueso", "revoque fino", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Tabique de ladrillo cerámico 12 cm
  - **ID:** `tabique_ladrillo_12`
  - **Unidad:** m²
  - **Opciones:**
    - `terminacion`: ["revoque + pintura", "yeso + pintura", "cerámico", "madera"]
  - **Tareas:** ["replanteo", "levantar tabique", "revoque grueso", "revoque fino", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Tabique de durlock placa simple
  - **ID:** `tabique_durlock_simple`
  - **Unidad:** m²
  - **Opciones:**
    - `estructura`: ["perfiles 70mm", "perfiles 100mm"]
    - `placa`: ["estándar 12.5mm", "resistente humedad (RH)", "resistente fuego (RF)"]
    - `aislacion_acustica`: ["sin aislación", "lana de vidrio 50mm", "lana de vidrio 80mm"]
    - `terminacion`: ["pintura", "empapelado", "revestimiento"]
  - **Tareas:** ["replanteo", "montaje estructura", "instalaciones", "colocación aislación", "colocación placas", "masillado", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Tabique de durlock placa doble
  - **ID:** `tabique_durlock_doble`
  - **Unidad:** m²
  - **Opciones:**
    - `estructura`: ["perfiles 70mm", "perfiles 100mm"]
    - `placa`: ["estándar 12.5mm", "resistente humedad (RH)", "resistente fuego (RF)"]
    - `aislacion_acustica`: ["sin aislación", "lana de vidrio 50mm", "lana de vidrio 80mm", "lana de roca"]
    - `terminacion`: ["pintura", "empapelado", "revestimiento"]
  - **Tareas:** ["replanteo", "montaje estructura", "instalaciones", "colocación aislación", "1ra capa placas", "2da capa placas", "masillado", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Tabique de durlock con aislación acústica
  - **ID:** `tabique_durlock_acustico`
  - **Unidad:** m²
  - **Opciones:**
    - `estructura`: ["doble estructura independiente 70mm", "doble estructura independiente 100mm"]
    - `placa`: ["doble placa 12.5mm", "doble placa RF"]
    - `aislacion_acustica`: ["lana de vidrio 80mm", "lana de roca 80mm"]
    - `terminacion`: ["pintura", "empapelado"]
  - **Tareas:** ["replanteo", "montaje 1ra estructura", "montaje 2da estructura", "instalaciones", "aislación", "placas lado 1", "placas lado 2", "masillado", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Tabique de Retak interior 10 cm
  - **ID:** `tabique_retak_10`
  - **Unidad:** m²
  - **Opciones:**
    - `terminacion`: ["revoque fino + pintura", "yeso + pintura", "cerámico"]
  - **Tareas:** ["replanteo", "levantar tabique", "revoque fino", "terminación"]
  - **Fase:** Obra gris + Terminaciones

---

### CATEGORÍA 3: Instalaciones
**ID:** `instalaciones`  
**Orden:** 3

#### Subcategoría 3.1: Instalación Sanitaria
**ID:** `sanitaria`

- **Elemento:** Instalación sanitaria 1 baño
  - **ID:** `instalacion_sanitaria_1_bano`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo_bano`: ["completo (inodoro + lavabo + ducha)", "medio baño (inodoro + lavabo)"]
    - `artefactos`: ["línea económica", "línea estándar", "línea premium"]
    - `grifería`: ["monocomando", "dos llaves"]
    - `desagües`: ["PVC Ø110", "PVC Ø63"]
  - **Tareas:** ["replanteo", "cañerías agua fría", "cañerías agua caliente", "desagües cloacales", "desagües pluviales", "colocación artefactos", "prueba hidráulica"]
  - **Fase:** Obra gris

- **Elemento:** Instalación sanitaria 2 baños
  - **ID:** `instalacion_sanitaria_2_banos`
  - **Unidad:** unidad
  - **Opciones:**
    - `distribucion`: ["baños separados", "baños contiguos"]
    - `artefactos`: ["línea económica", "línea estándar", "línea premium"]
    - `grifería`: ["monocomando", "dos llaves"]
  - **Tareas:** ["replanteo", "cañerías agua fría", "cañerías agua caliente", "desagües", "colocación artefactos", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Instalación sanitaria 3 baños
  - **ID:** `instalacion_sanitaria_3_banos`
  - **Unidad:** unidad
  - **Opciones:**
    - `distribucion`: ["baños independientes", "baños agrupados"]
    - `artefactos`: ["línea económica", "línea estándar", "línea premium"]
    - `grifería`: ["monocomando", "dos llaves"]
  - **Tareas:** ["replanteo", "cañerías", "desagües", "colocación artefactos", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Instalación sanitaria cocina
  - **ID:** `instalacion_cocina`
  - **Unidad:** unidad
  - **Opciones:**
    - `pileta`: ["simple", "doble", "con escurridor"]
    - `grifería`: ["monocomando", "monocomando con ducha extraíble"]
    - `desagüe`: ["PVC Ø63", "PVC Ø110"]
  - **Tareas:** ["cañerías agua", "desagüe", "ventilación", "colocación pileta", "grifería"]
  - **Fase:** Obra gris

- **Elemento:** Instalación sanitaria lavadero
  - **ID:** `instalacion_lavadero`
  - **Unidad:** unidad
  - **Opciones:**
    - `pileta`: ["pileta lavadero fibrocemento", "pileta acero inoxidable"]
    - `provision_lavarropas`: ["sí", "no"]
    - `desagüe`: ["PVC Ø63", "PVC Ø110"]
  - **Tareas:** ["cañerías", "desagüe", "colocación pileta", "conexión lavarropas"]
  - **Fase:** Obra gris

- **Elemento:** Tanque de agua superior
  - **ID:** `tanque_agua_superior`
  - **Unidad:** unidad
  - **Opciones:**
    - `capacidad`: ["500 litros", "750 litros", "1000 litros", "1500 litros"]
    - `material`: ["polietileno tricapa", "fibrocemento"]
    - `estructura_soporte`: ["columnas mampostería", "columnas hormigón", "metálica"]
  - **Tareas:** ["construcción soporte", "montaje tanque", "cañería alimentación", "cañería distribución", "ventilación", "rebose"]
  - **Fase:** Obra gris

- **Elemento:** Cisterna
  - **ID:** `cisterna`
  - **Unidad:** m³
  - **Opciones:**
    - `capacidad`: ["3 m³", "5 m³", "10 m³", "15 m³"]
    - `tipo`: ["hormigón armado in situ", "prefabricada"]
    - `bomba`: ["con bomba presurizadora", "sin bomba"]
  - **Tareas:** ["excavación", "construcción cisterna", "impermeabilización", "tapa", "cañerías", "bomba (si aplica)"]
  - **Fase:** Obra gris

- **Elemento:** Bomba presurizadora
  - **ID:** `bomba_presurizadora`
  - **Unidad:** unidad
  - **Opciones:**
    - `potencia`: ["0.5 HP", "0.75 HP", "1 HP"]
    - `presostato`: ["estándar", "digital"]
    - `tanque_presion`: ["20 litros", "50 litros"]
  - **Tareas:** ["instalación bomba", "conexión eléctrica", "conexión cañerías", "programación", "prueba"]
  - **Fase:** Obra gris

#### Subcategoría 3.2: Instalación Eléctrica
**ID:** `electrica`

- **Elemento:** Instalación eléctrica básica
  - **ID:** `instalacion_electrica_basica`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo_instalacion`: ["embutida", "semi-embutida", "vista"]
    - `cable`: ["1.5mm²", "2.5mm²", "4mm²"]
    - `bocas_luz`: ["estándar", "dimmer", "LED"]
  - **Tareas:** ["replanteo", "cajeado", "cañería", "cableado", "bocas", "llaves", "tomas", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Tablero eléctrico principal
  - **ID:** `tablero_principal`
  - **Unidad:** unidad
  - **Opciones:**
    - `capacidad`: ["monofásico 4-6 circuitos", "monofásico 8-12 circuitos", "trifásico 12-18 circuitos"]
    - `protecciones`: ["térmicas", "térmicas + diferenciales"]
    - `disyuntor`: ["25A", "32A", "40A", "63A"]
  - **Tareas:** ["montaje tablero", "cableado interno", "conexión disyuntores", "conexión a medidor", "identificación circuitos", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Previsión aire acondicionado
  - **ID:** `prevision_aire_acondicionado`
  - **Unidad:** unidad
  - **Opciones:**
    - `cantidad_equipos`: ["1", "2", "3", "4+"]
    - `capacidad`: ["2250 kcal/h", "3000 kcal/h", "4500 kcal/h", "6000 kcal/h"]
    - `tipo`: ["split", "multi-split", "conductos"]
  - **Tareas:** ["cañería", "cable 3x2.5mm²", "llave térmica dedicada", "toma dedicada", "pase pared"]
  - **Fase:** Obra gris

- **Elemento:** Iluminación exterior
  - **ID:** `iluminacion_exterior`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["apliques pared", "balizas", "reflectores LED", "farolas"]
    - `potencia`: ["10W LED", "20W LED", "30W LED", "50W LED"]
    - `sensor`: ["sin sensor", "con fotocélula", "con sensor movimiento"]
  - **Tareas:** ["cañería exterior", "cableado", "montaje luminaria", "conexión", "programación sensor"]
  - **Fase:** Obra gris

- **Elemento:** Tomas eléctricas
  - **ID:** `tomas_electricas`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["simple", "doble", "triple", "con USB"]
    - `ubicacion`: ["interior", "exterior (IP65)"]
    - `cable`: ["2.5mm²", "4mm²"]
  - **Tareas:** ["cajeado", "cañería", "cableado", "colocación toma", "conexión", "prueba"]
  - **Fase:** Obra gris

#### Subcategoría 3.3: Instalación de Gas
**ID:** `gas`

- **Elemento:** Instalación de gas natural
  - **ID:** `instalacion_gas_natural`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["embutida", "semi-vista", "vista"]
    - `cañeria`: ["caño negro", "multicapa"]
    - `artefactos`: ["cocina", "cocina + calefactor", "cocina + caldera"]
    - `regulador`: ["estándar", "doble etapa"]
  - **Tareas:** ["replanteo", "cañería principal", "derivaciones", "válvulas", "conexión medidor", "conexión artefactos", "prueba estanqueidad"]
  - **Fase:** Obra gris

- **Elemento:** Instalación de gas envasado (GLP)
  - **ID:** `instalacion_gas_envasado`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["garrafa 10kg", "garrafa 45kg", "tanque 250kg", "tanque 500kg"]
    - `cañeria`: ["cobre", "multicapa"]
    - `artefactos`: ["cocina", "cocina + calefactor", "cocina + caldera"]
  - **Tareas:** ["instalación contenedor", "cañería", "regulador", "derivaciones", "conexión artefactos", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Artefacto cocina a gas
  - **ID:** `artefacto_cocina`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["4 hornallas", "4 hornallas + horno", "5 hornallas + horno"]
    - `linea`: ["económica", "estándar", "premium"]
  - **Tareas:** ["conexión gas", "nivelación", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Calefactor a gas
  - **ID:** `calefactor`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["tiro balanceado 2000 kcal", "tiro balanceado 3000 kcal", "tiro balanceado 5000 kcal"]
    - `evacuacion`: ["tiro balanceado", "salida exterior"]
  - **Tareas:** ["conexión gas", "fijación pared", "conducto evacuación", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Caldera a gas
  - **ID:** `caldera`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["mural 24 kW", "mural 28 kW", "piso 35 kW"]
    - `uso`: ["solo calefacción", "calefacción + ACS"]
    - `evacuacion`: ["tiro balanceado", "chimenea"]
  - **Tareas:** ["conexión gas", "conexión agua", "evacuación", "conexión eléctrica", "prueba"]
  - **Fase:** Obra gris

#### Subcategoría 3.4: Instalación Pluvial
**ID:** `pluvial`

- **Elemento:** Canaletas
  - **ID:** `canaletas`
  - **Unidad:** m
  - **Opciones:**
    - `material`: ["PVC", "chapa galvanizada", "chapa prepintada", "cobre"]
    - `sección`: ["rectangular 12x7cm", "semicircular Ø12cm", "semicircular Ø15cm"]
    - `color`: ["blanco", "negro", "terracota", "cobre"]
  - **Tareas:** ["replanteo", "soportes", "montaje canaleta", "conexión bajadas", "prueba estanqueidad"]
  - **Fase:** Obra gris

- **Elemento:** Desagües pluviales verticales
  - **ID:** `desagues_verticales`
  - **Unidad:** m
  - **Opciones:**
    - `material`: ["PVC Ø110", "chapa galvanizada Ø110", "cobre"]
    - `ubicacion`: ["embutida", "vista"]
    - `color`: ["blanco", "negro", "terracota", "cobre"]
  - **Tareas:** ["fijaciones", "montaje bajada", "conexión canaleta superior", "conexión desagüe inferior", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Desagüe pluvial subterráneo
  - **ID:** `desague_pluvial_subterraneo`
  - **Unidad:** m
  - **Opciones:**
    - `diametro`: ["110mm", "160mm"]
    - `destino`: ["a calle", "a pozo absorbente", "a cisterna"]
    - `material`: ["PVC naranja", "hormigón"]
  - **Tareas:** ["excavación zanja", "cama de arena", "colocación caños", "uniones", "relleno", "prueba"]
  - **Fase:** Obra gris

#### Subcategoría 3.5: Climatización
**ID:** `climatizacion`

- **Elemento:** Radiadores
  - **ID:** `radiadores`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["chapa", "aluminio", "paneles"]
    - `elementos`: ["6 elementos", "8 elementos", "10 elementos", "12 elementos"]
    - `valvula`: ["estándar", "termostática"]
  - **Tareas:** ["fijación pared", "conexión cañerías", "purgado", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Piso radiante
  - **ID:** `piso_radiante`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo`: ["agua caliente", "eléctrico"]
    - `aislacion`: ["poliestireno 2cm", "poliestireno 3cm", "poliestireno 5cm"]
    - `paso_cañeria`: ["10cm", "15cm", "20cm"]
    - `control`: ["termostato ambiente", "termostato por zona"]
  - **Tareas:** ["aislación térmica", "colocación cañería/cable", "prueba hidráulica", "carpeta cemento", "conexión colectores", "puesta en marcha"]
  - **Fase:** Obra gris

- **Elemento:** Split aire acondicionado
  - **ID:** `split_aire_acondicionado`
  - **Unidad:** unidad
  - **Opciones:**
    - `capacidad`: ["2250 kcal/h", "3000 kcal/h", "4500 kcal/h", "6000 kcal/h"]
    - `tecnologia`: ["on/off", "inverter", "inverter A+++"]
    - `tipo`: ["frío solo", "frío/calor"]
  - **Tareas:** ["montaje unidad interior", "montaje unidad exterior", "conexión frigorífica", "conexión eléctrica", "desagüe", "vacío", "carga gas", "puesta en marcha"]
  - **Fase:** Obra gris

---

### CATEGORÍA 4: Cubiertas
**ID:** `cubiertas`  
**Orden:** 4

#### Subcategoría 4.1: Cubiertas Planas
**ID:** `cubiertas_planas`

- **Elemento:** Cubierta plana de hormigón impermeabilizada
  - **ID:** `cubierta_plana_hormigon`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor_losa`: ["15cm", "18cm", "20cm"]
    - `impermeabilizacion`: ["membrana asfáltica monocapa", "membrana asfáltica bicapa", "membrana geotextil", "poliuretano líquido"]
    - `aislacion_termica`: ["sin aislación", "EPS 3cm", "EPS 5cm", "XPS 5cm"]
    - `terminacion`: ["sin terminación", "pintura asfáltica blanca", "carpeta transitable"]
  - **Tareas:** ["losa hormigón", "nivelación", "impermeabilización", "aislación térmica (si aplica)", "terminación", "desagües"]
  - **Fase:** Estructura + Obra gris

- **Elemento:** Cubierta invertida (aislación sobre impermeabilización)
  - **ID:** `cubierta_invertida`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor_losa`: ["15cm", "18cm", "20cm"]
    - `impermeabilizacion`: ["membrana asfáltica bicapa", "EPDM", "PVC"]
    - `aislacion`: ["XPS 5cm", "XPS 8cm", "XPS 10cm"]
    - `proteccion`: ["manta geotextil + canto rodado", "baldosas sobre plots", "deck WPC"]
  - **Tareas:** ["losa hormigón", "pendientes", "impermeabilización", "aislación XPS", "geotextil", "protección", "desagües"]
  - **Fase:** Estructura + Obra gris

#### Subcategoría 4.2: Cubiertas Inclinadas
**ID:** `cubiertas_inclinadas`

- **Elemento:** Cubierta inclinada 2 aguas - teja cerámica
  - **ID:** `cubierta_2_aguas_teja_ceramica`
  - **Unidad:** m²
  - **Opciones:**
    - `pendiente`: ["25%", "30%", "35%"]
    - `estructura`: ["cabriadas madera", "cerchas metálicas"]
    - `aislacion`: ["sin aislación", "EPS bajo teja", "lana de vidrio", "membrana reflectiva"]
    - `tipo_teja`: ["colonial", "francesa", "portuguesa"]
  - **Tareas:** ["estructura soporte", "correas", "aislación", "listones", "colocación tejas", "caballete", "limatesas", "canaletas"]
  - **Fase:** Estructura + Obra gris

- **Elemento:** Cubierta inclinada 2 aguas - teja de hormigón
  - **ID:** `cubierta_2_aguas_teja_hormigon`
  - **Unidad:** m²
  - **Opciones:**
    - `pendiente`: ["25%", "30%", "35%"]
    - `estructura`: ["cabriadas madera", "cerchas metálicas"]
    - `aislacion`: ["sin aislación", "EPS bajo teja", "lana de vidrio"]
    - `color_teja`: ["terracota", "gris", "negro", "verde"]
  - **Tareas:** ["estructura soporte", "correas", "aislación", "colocación tejas", "caballete", "limatesas", "canaletas"]
  - **Fase:** Estructura + Obra gris

- **Elemento:** Cubierta inclinada 2 aguas - chapa
  - **ID:** `cubierta_2_aguas_chapa`
  - **Unidad:** m²
  - **Opciones:**
    - `pendiente`: ["15%", "20%", "25%"]
    - `tipo_chapa`: ["trapezoidal", "sinusoidal", "cincalum", "prepintada"]
    - `espesor`: ["0.4mm", "0.5mm", "0.6mm"]
    - `estructura`: ["cabriadas madera", "cerchas metálicas"]
    - `aislacion`: ["sin aislación", "EPS autoadhesivo", "lana de vidrio", "membrana reflectiva + cámara aire"]
  - **Tareas:** ["estructura soporte", "correas", "aislación", "colocación chapas", "caballete", "babetas", "canaletas"]
  - **Fase:** Estructura + Obra gris

- **Elemento:** Cubierta inclinada 4 aguas - teja
  - **ID:** `cubierta_4_aguas_teja`
  - **Unidad:** m²
  - **Opciones:**
    - `pendiente`: ["25%", "30%", "35%"]
    - `tipo_teja`: ["cerámica colonial", "cerámica francesa", "hormigón"]
    - `estructura`: ["cabriadas madera", "cerchas metálicas"]
    - `aislacion`: ["sin aislación", "EPS", "lana de vidrio"]
  - **Tareas:** ["estructura soporte", "correas", "aislación", "listones", "colocación tejas", "caballete", "limahoyas", "limatesas", "canaletas"]
  - **Fase:** Estructura + Obra gris

- **Elemento:** Cubierta inclinada 4 aguas - chapa
  - **ID:** `cubierta_4_aguas_chapa`
  - **Unidad:** m²
  - **Opciones:**
    - `pendiente`: ["15%", "20%", "25%"]
    - `tipo_chapa`: ["trapezoidal", "cincalum", "prepintada"]
    - `estructura`: ["cabriadas madera", "cerchas metálicas"]
    - `aislacion`: ["sin aislación", "EPS", "lana de vidrio", "membrana reflectiva"]
  - **Tareas:** ["estructura soporte", "correas", "aislación", "colocación chapas", "caballete", "limahoyas", "babetas", "canaletas"]
  - **Fase:** Estructura + Obra gris

#### Subcategoría 4.3: Cubiertas Especiales
**ID:** `cubiertas_especiales`

- **Elemento:** Cubierta industrial diente de sierra
  - **ID:** `cubierta_diente_sierra`
  - **Unidad:** m²
  - **Opciones:**
    - `estructura`: ["metálica liviana", "metálica pesada"]
    - `cerramiento`: ["chapa trapezoidal", "panel sándwich"]
    - `iluminacion_cenital`: ["chapa translúcida", "policarbonato", "claraboyas"]
  - **Tareas:** ["estructura metálica", "correas", "cerramiento", "iluminación cenital", "canaletas", "desagües"]
  - **Fase:** Estructura + Obra gris

- **Elemento:** Cubierta liviana de policarbonato
  - **ID:** `cubierta_policarbonato`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo_policarbonato`: ["alveolar 4mm", "alveolar 6mm", "alveolar 10mm", "compacto 3mm"]
    - `color`: ["cristal", "bronce", "azul", "verde", "opal"]
    - `estructura`: ["aluminio", "hierro pintado"]
    - `proteccion_UV`: ["estándar", "premium"]
  - **Tareas:** ["estructura soporte", "perfilería", "colocación placas", "sellado", "remates"]
  - **Fase:** Obra gris

- **Elemento:** Cubierta liviana de vidrio
  - **ID:** `cubierta_vidrio`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo_vidrio`: ["laminado 6+6", "laminado 8+8", "DVH 6+12+6"]
    - `estructura`: ["aluminio", "hierro + pintura"]
    - `control_solar`: ["sin control", "film", "vidrio bajo emisivo"]
  - **Tareas:** ["estructura soporte", "perfilería", "colocación vidrios", "sellado", "limpieza"]
  - **Fase:** Terminaciones

---

### CATEGORÍA 5: Suelos / Pisos
**ID:** `suelos_pisos`  
**Orden:** 5

#### Subcategoría 5.1: Base para Pisos
**ID:** `base_pisos`

- **Elemento:** Contrapiso de hormigón
  - **ID:** `contrapiso_hormigon`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor`: ["8cm", "10cm", "12cm", "15cm"]
    - `resistencia`: ["H13", "H17"]
    - `armadura`: ["sin armadura", "malla Ø4.2", "fibra estructural"]
    - `aislacion`: ["sin aislación", "polietileno 200μ", "EPS 2cm"]
  - **Tareas:** ["compactación suelo", "nivelación", "aislación hidrófuga", "encofrado perimetral", "hormigonado", "nivelación", "curado"]
  - **Fase:** Obra gris

- **Elemento:** Carpeta de nivelación
  - **ID:** `carpeta_nivelacion`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor`: ["2cm", "3cm", "4cm"]
    - `tipo`: ["cemento arena", "cemento arena + hidrófugo", "autonivelante"]
  - **Tareas:** ["preparación superficie", "aplicación carpeta", "nivelación", "fratazado", "curado"]
  - **Fase:** Obra gris

#### Subcategoría 5.2: Pisos Interiores
**ID:** `pisos_interiores`

- **Elemento:** Piso cerámico
  - **ID:** `piso_ceramico`
  - **Unidad:** m²
  - **Opciones:**
    - `formato`: ["30x30cm", "40x40cm", "45x45cm", "30x60cm"]
    - `tipo`: ["esmaltado", "rústico"]
    - `junta`: ["mínima 1mm", "estándar 3mm"]
    - `terminacion`: ["sin pastina", "pastinado color", "pastinado epoxi"]
  - **Tareas:** ["preparación superficie", "replanteo", "pegado cerámicos", "nivelación", "pastinado", "limpieza"]
  - **Fase:** Terminaciones

- **Elemento:** Piso porcelanato
  - **ID:** `piso_porcelanato`
  - **Unidad:** m²
  - **Opciones:**
    - `formato`: ["60x60cm", "80x80cm", "60x120cm", "120x120cm"]
    - `tipo`: ["pulido", "mate", "símil madera", "símil mármol"]
    - `junta`: ["rectificado 1mm", "estándar 2mm"]
    - `terminacion`: ["pastinado color", "pastinado epoxi"]
  - **Tareas:** ["preparación superficie", "replanteo", "pegado adhesivo especial", "nivelación perfecta", "pastinado", "pulido (si aplica)", "limpieza"]
  - **Fase:** Terminaciones

- **Elemento:** Piso de madera maciza
  - **ID:** `piso_madera`
  - **Unidad:** m²
  - **Opciones:**
    - `especie`: ["pino tea", "eucalipto", "petiribi", "pinotea"]
    - `formato`: ["tabla 7cm", "tabla 10cm", "parquet mosaico"]
    - `terminacion`: ["hidrolaqueado mate", "hidrolaqueado satinado", "plastificado"]
    - `colocacion`: ["clavado sobre rastreles", "pegado"]
  - **Tareas:** ["rastreles (si aplica)", "colocación madera", "lijado", "masillado", "2da lijada", "barniz/laca", "pulido final"]
  - **Fase:** Terminaciones

- **Elemento:** Piso flotante laminado
  - **ID:** `piso_flotante`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor`: ["7mm", "8mm", "10mm", "12mm"]
    - `clase_uso`: ["AC3 doméstico", "AC4 comercial", "AC5 intensivo"]
    - `color`: ["roble claro", "roble medio", "nogal", "gris"]
    - `aislacion_acustica`: ["sin aislación", "espuma EVA 2mm", "espuma EVA 3mm"]
  - **Tareas:** ["nivelación superficie", "barrera humedad", "aislación acústica", "colocación flotante", "zócalos"]
  - **Fase:** Terminaciones

- **Elemento:** Microcemento
  - **ID:** `microcemento`
  - **Unidad:** m²
  - **Opciones:**
    - `color`: ["gris natural", "blanco", "beige", "arena", "negro"]
    - `terminacion`: ["mate", "satinado", "brillante"]
    - `proteccion`: ["barniz poliuretano", "cera", "resina epoxi"]
  - **Tareas:** ["preparación soporte", "imprimación", "1ra capa base", "2da capa base", "lijado", "capa micro", "sellador", "protección"]
  - **Fase:** Terminaciones

- **Elemento:** Hormigón alisado
  - **ID:** `hormigon_alisado`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor`: ["8cm", "10cm", "12cm"]
    - `color`: ["natural gris", "con pigmento"]
    - `terminacion`: ["alisado", "alisado + endurecedor", "pulido con diamante"]
    - `juntas`: ["sin juntas de dilatación", "con juntas cada 3m"]
  - **Tareas:** ["preparación base", "encofrado", "hormigonado", "alisado mecánico", "curado", "sellado (si aplica)"]
  - **Fase:** Obra gris + Terminaciones

#### Subcategoría 5.3: Pisos Exteriores
**ID:** `pisos_exteriores`

- **Elemento:** Piso cerámico antideslizante
  - **ID:** `piso_ceramico_antideslizante`
  - **Unidad:** m²
  - **Opciones:**
    - `formato`: ["30x30cm", "40x40cm", "45x45cm"]
    - `tipo`: ["rústico", "símil piedra"]
    - `grado_antideslizante`: ["R11", "R12", "R13"]
    - `junta`: ["estándar 3mm", "ancha 5mm"]
  - **Tareas:** ["contrapiso", "carpeta hidrófuga", "replanteo", "pegado", "pastinado hidrófugo", "limpieza"]
  - **Fase:** Terminaciones

- **Elemento:** Piso porcelanato exterior
  - **ID:** `piso_porcelanato_exterior`
  - **Unidad:** m²
  - **Opciones:**
    - `formato`: ["60x60cm", "80x80cm"]
    - `tipo`: ["antideslizante R11", "símil madera", "símil piedra"]
    - `espesor`: ["2cm elevado", "estándar 1cm"]
    - `colocacion`: ["sobre plots", "pegado tradicional"]
  - **Tareas:** ["preparación base", "plots (si aplica)", "colocación", "nivelación", "pastinado", "limpieza"]
  - **Fase:** Terminaciones

- **Elemento:** Deck de madera
  - **ID:** `deck_madera`
  - **Unidad:** m²
  - **Opciones:**
    - `especie`: ["eucalipto", "lapacho", "curupay", "quebracho"]
    - `formato`: ["tabla 7cm", "tabla 10cm", "tabla 14cm"]
    - `tratamiento`: ["autoclave CCA", "aceite protector", "hidrolaqueado exterior"]
    - `estructura`: ["sobre rastreles madera", "sobre estructura metálica"]
  - **Tareas:** ["estructura soporte", "nivelación", "colocación tablas", "fijación", "tratamiento protector"]
  - **Fase:** Terminaciones

- **Elemento:** Deck WPC (madera plástica)
  - **ID:** `deck_wpc`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo`: ["macizo", "hueco cámara"]
    - `color`: ["marrón", "gris", "teka"]
    - `formato`: ["14cm ancho", "20cm ancho"]
    - `estructura`: ["rastreles WPC", "rastreles aluminio"]
  - **Tareas:** ["estructura soporte", "nivelación", "colocación tablas", "clips fijación", "remates"]
  - **Fase:** Terminaciones

---

### CATEGORÍA 6: Amenities
**ID:** `amenities`  
**Orden:** 6

#### Subcategoría 6.1: Parrilla y Quincho
**ID:** `parrilla_quincho`

- **Elemento:** Parrilla refractaria
  - **ID:** `parrilla_refractaria`
  - **Unidad:** unidad
  - **Opciones:**
    - `tamaño`: ["60cm", "80cm", "100cm", "120cm"]
    - `tipo`: ["simple", "con horno pizzero", "con brasero lateral"]
    - `campana`: ["sin campana", "con campana metálica", "con campana mampostería"]
    - `revestimiento`: ["ladrillo visto", "piedra", "revoque + pintura"]
  - **Tareas:** ["fundación", "mampostería", "construcción cámara combustión", "parrilla", "horno (si aplica)", "campana (si aplica)", "revestimiento"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Parrilla metálica
  - **ID:** `parrilla_metalica`
  - **Unidad:** unidad
  - **Opciones:**
    - `tamaño`: ["60cm", "80cm", "100cm"]
    - `material`: ["chapa plegada", "acero inoxidable"]
    - `tipo`: ["simple", "con carro", "con brasero"]
    - `campana`: ["sin campana", "con campana metálica"]
  - **Tareas:** ["base hormigón", "montaje estructura", "instalación parrilla", "campana (si aplica)", "terminación"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Quincho / galería cubierta
  - **ID:** `quincho_cubierto`
  - **Unidad:** m²
  - **Opciones:**
    - `estructura`: ["madera", "metálica", "hormigón"]
    - `cubierta`: ["chapa", "teja", "policarbonato", "techo verde"]
    - `cerramiento_lateral`: ["abierto", "semi-cerrado", "con cortinas cristal"]
    - `piso`: ["hormigón alisado", "cerámico", "deck madera", "deck WPC"]
  - **Tareas:** ["fundación columnas", "estructura soporte", "cubierta", "instalación eléctrica", "piso", "cerramiento (si aplica)", "terminaciones"]
  - **Fase:** Estructura + Obra gris + Terminaciones

#### Subcategoría 6.2: Pileta
**ID:** `pileta`

- **Elemento:** Pileta de hormigón
  - **ID:** `pileta_hormigon`
  - **Unidad:** m³
  - **Opciones:**
    - `dimensiones`: ["3x6m", "4x8m", "5x10m", "custom"]
    - `profundidad`: ["1.40m constante", "0.80m a 1.80m"]
    - `revestimiento`: ["venecitas", "gresite", "membrana PVC", "pintura epoxi"]
    - `borde`: ["atérmico", "porcelanato", "piedra", "deck madera"]
    - `equipo`: ["bomba + filtro arena", "bomba + filtro DE", "sistema sal"]
  - **Tareas:** ["excavación", "fundación", "mampostería/encofrado", "hierros", "hormigonado", "impermeabilización", "revestimiento", "instalación equipo", "playa/borde", "llenado", "puesta en marcha"]
  - **Fase:** Estructura + Obra gris + Terminaciones

- **Elemento:** Pileta de fibra de vidrio
  - **ID:** `pileta_fibra`
  - **Unidad:** unidad
  - **Opciones:**
    - `dimensiones`: ["3x6m", "4x8m", "5x10m"]
    - `color`: ["azul", "celeste", "blanco"]
    - `equipo`: ["bomba + filtro arena", "bomba + filtro DE", "sistema sal"]
    - `instalacion`: ["enterrada", "semi-enterrada"]
  - **Tareas:** ["excavación", "nivelación", "colocación pileta", "relleno perimetral", "instalación equipo", "playa", "llenado", "puesta en marcha"]
  - **Fase:** Obra gris

- **Elemento:** Solárium
  - **ID:** `solarium`
  - **Unidad:** m²
  - **Opciones:**
    - `piso`: ["porcelanato atérmico", "deck madera", "deck WPC", "césped sintético"]
    - `cerramiento`: ["sin cerrar", "cerco metálico", "cerco madera", "mampostería"]
    - `sombra`: ["sin sombra", "pérgola", "sombrillas", "toldo"]
  - **Tareas:** ["nivelación terreno", "contrapiso", "piso elegido", "cerramiento (si aplica)", "estructura sombra (si aplica)"]
  - **Fase:** Obra gris + Terminaciones

---

### CATEGORÍA 7: Parquizado
**ID:** `parquizado`  
**Orden:** 7

#### Subcategoría 7.1: Césped y Vegetación
**ID:** `cesped_vegetacion`

- **Elemento:** Césped natural
  - **ID:** `cesped_natural`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo`: ["siembra", "panes (tepes)", "hidrosiembra"]
    - `variedad`: ["bermuda", "kikuyo", "rye grass", "festuca"]
    - `preparacion_suelo`: ["básica", "con tierra negra", "con tierra + compost"]
    - `riego`: ["sin riego", "riego por aspersión", "riego por goteo"]
  - **Tareas:** ["limpieza terreno", "nivelación", "tierra vegetal", "siembra/panes", "riego inicial", "primer corte"]
  - **Fase:** Terminaciones

- **Elemento:** Césped sintético
  - **ID:** `cesped_sintetico`
  - **Unidad:** m²
  - **Opciones:**
    - `altura_fibra`: ["20mm", "30mm", "40mm", "50mm"]
    - `densidad`: ["estándar", "premium"]
    - `color`: ["verde natural", "verde intenso", "bicolor"]
    - `drenaje`: ["perforado", "super drenante"]
  - **Tareas:** ["nivelación base", "compactación", "malla antimaleza", "extendido césped", "corte y unión", "relleno arena sílice", "cepillado"]
  - **Fase:** Terminaciones

- **Elemento:** Árboles
  - **ID:** `arboles`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["caduco", "perenne", "frutal"]
    - `altura`: ["1-2m", "2-3m", "3-4m"]
    - `especies_sugeridas`: ["jacarandá", "tipa", "ceibo", "fresno", "cítricos"]
  - **Tareas:** ["excavación pozo", "tierra preparada", "plantación", "tutor", "riego"]
  - **Fase:** Terminaciones

- **Elemento:** Arbustos
  - **ID:** `arbustos`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["ornamental", "cerco vivo", "aromático"]
    - `altura`: ["30-50cm", "50-80cm", "80-120cm"]
    - `especies_sugeridas`: ["ligustrina", "fotinia", "lavanda", "romero", "santolina"]
  - **Tareas:** ["preparación suelo", "plantación", "riego", "mulching"]
  - **Fase:** Terminaciones

#### Subcategoría 7.2: Senderos y Veredas
**ID:** `senderos_veredas`

- **Elemento:** Sendero de piedra
  - **ID:** `sendero_piedra`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo_piedra`: ["laja", "canto rodado", "piedra partida", "adoquín piedra"]
    - `espesor`: ["3-5cm", "5-8cm"]
    - `junta`: ["con césped", "con arena", "con mortero"]
    - `base`: ["sobre tierra compactada", "sobre cascajo", "sobre hormigón"]
  - **Tareas:** ["excavación", "base", "nivelación", "colocación piedras", "junta", "limpieza"]
  - **Fase:** Obra gris + Terminaciones

- **Elemento:** Sendero de hormigón
  - **ID:** `sendero_hormigon`
  - **Unidad:** m²
  - **Opciones:**
    - `espesor`: ["8cm", "10cm"]
    - `ancho`: ["60cm", "80cm", "100cm"]
    - `terminacion`: ["alisado", "con textura", "símil piedra", "con junta seca"]
    - `color`: ["gris natural", "con pigmento"]
  - **Tareas:** ["excavación", "base cascajo", "encofrado", "hormigonado", "terminación", "curado", "cortes dilatación"]
  - **Fase:** Obra gris

- **Elemento:** Sendero de deck
  - **ID:** `sendero_deck`
  - **Unidad:** m
  - **Opciones:**
    - `material`: ["madera eucalipto", "madera lapacho", "WPC"]
    - `ancho`: ["60cm", "80cm", "100cm"]
    - `estructura`: ["sobre rastreles", "sobre estructura metálica"]
  - **Tareas:** ["nivelación", "estructura soporte", "colocación tablas", "tratamiento (si aplica)"]
  - **Fase:** Terminaciones

#### Subcategoría 7.3: Iluminación y Riego Exterior
**ID:** `iluminacion_riego`

- **Elemento:** Iluminación balizas
  - **ID:** `iluminacion_balizas`
  - **Unidad:** unidad
  - **Opciones:**
    - `tipo`: ["LED 3W", "LED 5W", "LED 10W"]
    - `alimentacion`: ["220V", "12V", "solar"]
    - `material`: ["acero inoxidable", "aluminio", "plástico"]
    - `altura`: ["30cm", "50cm", "80cm"]
  - **Tareas:** ["cañería eléctrica", "cableado", "colocación balizas", "conexión", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Reflectores LED
  - **ID:** `reflectores_led`
  - **Unidad:** unidad
  - **Opciones:**
    - `potencia`: ["10W", "20W", "30W", "50W"]
    - `tipo`: ["con estaca", "pared", "poste"]
    - `sensor`: ["sin sensor", "con fotocélula", "con sensor movimiento"]
    - `color_luz`: ["blanco cálido", "blanco frío", "RGB"]
  - **Tareas:** ["cañería", "cableado", "montaje", "orientación", "conexión", "programación"]
  - **Fase:** Obra gris

- **Elemento:** Riego por aspersión
  - **ID:** `riego_aspersion`
  - **Unidad:** m²
  - **Opciones:**
    - `tipo_aspersor`: ["emergente estático", "emergente rotativo", "aéreo"]
    - `alcance`: ["3m", "5m", "8m", "12m"]
    - `programacion`: ["sin programador", "programador mecánico", "programador digital", "Wi-Fi"]
  - **Tareas:** ["diseño sistema", "excavación zanja", "cañerías", "electroválvulas", "aspersores", "programador", "prueba"]
  - **Fase:** Obra gris

- **Elemento:** Riego por goteo
  - **ID:** `riego_goteo`
  - **Unidad:** m
  - **Opciones:**
    - `tipo`: ["manguera porosa", "cinta goteo", "goteros integrados"]
    - `caudal`: ["2 L/h", "4 L/h", "8 L/h"]
    - `programacion`: ["sin programador", "programador digital"]
  - **Tareas:** ["diseño", "cañería principal", "derivaciones", "instalación goteo", "programador", "prueba"]
  - **Fase:** Obra gris

---

## ⚠️ INCONSISTENCIAS Y PROBLEMAS DETECTADOS

### 1. **Duplicación de Catálogos**
- **Problema:** Existen múltiples fuentes de catálogo:
  - `catalogo-elementos-constructivos.json` (JSON completo, usado por CargaElementosPanel)
  - `catalogo-elementos.ts` (TypeScript, usado por wizard)
  - `elementos-vivienda.ts` (usado por ExpansorElementos)
- **Impacto:** Puede haber inconsistencias entre fuentes
- **Recomendación:** Unificar en una sola fuente de verdad

### 2. **Mapeo de Tareas Incompleto**
- **Problema:** `ExpansorElementos` usa `elementos-vivienda.ts` que tiene códigos cortos (R01, H01) que deben mapearse a códigos largos (REP001, HOR005)
- **Impacto:** Si falta un mapeo, las tareas no se generan correctamente
- **Recomendación:** Revisar todos los mapeos en `MAPEO_CODIGOS_TAREAS`

### 3. **Falta de "Trabajos Preliminares"**
- **Problema:** La categoría "Trabajos preliminares" aparece en la UI pero no existe en el JSON
- **Impacto:** No se pueden cargar elementos de esta categoría
- **Recomendación:** Agregar la categoría completa al JSON o removerla de la UI

### 4. **Estructura de Tareas Inconsistente**
- **Problema:** Algunos elementos tienen `tareas[]` como array de strings, otros no tienen
- **Impacto:** La generación automática de tareas puede fallar
- **Recomendación:** Asegurar que todos los elementos tengan tareas definidas

### 5. **Fases de Tareas**
- **Problema:** Las tareas se mapean a fases (estructura/obra_gris/terminaciones) mediante lógica heurística basada en palabras clave
- **Impacto:** Puede haber errores en la clasificación
- **Recomendación:** Definir explícitamente la fase en cada tarea del catálogo

### 6. **Campos Opcionales en Supabase**
- **Problema:** Varios campos importantes son nullable (`categoria`, `subcategoria`, `cantidad`, `unidad`)
- **Impacto:** Puede haber elementos incompletos en la base de datos
- **Recomendación:** Revisar constraints y hacer obligatorios los campos críticos

### 7. **Falta de Precios**
- **Problema:** El catálogo no incluye precios unitarios
- **Impacto:** No se puede calcular costos automáticamente
- **Recomendación:** Agregar campo `precio_unitario` o `costo_referencia` al catálogo

### 8. **IDs de Elementos**
- **Problema:** Los IDs usan snake_case pero no hay validación de unicidad
- **Impacto:** Puede haber duplicados
- **Recomendación:** Validar unicidad de IDs en el catálogo

---

## 📝 NOTAS ADICIONALES

### Orden de Aparición
Las categorías aparecen en este orden:
1. Fundación y Estructura
2. Muros y Cerramientos
3. Instalaciones
4. Cubiertas
5. Suelos / Pisos
6. Amenities
7. Parquizado

### Unidades de Medida
- **m²:** Superficie (pisos, muros, cubiertas)
- **m³:** Volumen (hormigón, excavación, cisternas)
- **m:** Longitud (vigas, canaletas, senderos)
- **unidad:** Elementos completos (artefactos, equipos)

### Generación Automática de Tareas
Cuando se crea un elemento con `crearTareas=true`:
1. Se busca el elemento en `elementos-vivienda.ts`
2. Se obtienen los códigos de tareas (R01, H01, etc.)
3. Se mapean a códigos largos (REP001, HOR005)
4. Se buscan en `tareas-construccion.ts`
5. Se crean registros en la tabla `tareas` de Supabase

### Relación con Plantas
- Los elementos pueden asociarse a plantas específicas
- Actualmente `planta_id` está comentado en la API (no existe en la tabla)
- **Recomendación:** Agregar columna `planta_id` a la tabla `elementos` si se requiere

---

## ✅ CONCLUSIÓN

El sistema de elementos está bien estructurado pero tiene algunas inconsistencias que deben corregirse:

1. **Unificar fuentes de catálogo**
2. **Completar mapeo de tareas**
3. **Agregar "Trabajos preliminares" o removerlo**
4. **Definir fases explícitamente**
5. **Validar completitud de datos**
6. **Agregar precios si se requiere**

El catálogo actual tiene **~103 elementos** distribuidos en **7 categorías** y **21 subcategorías**, lo cual es un buen punto de partida para la gestión de obras.

---

**Fin del informe de auditoría**

