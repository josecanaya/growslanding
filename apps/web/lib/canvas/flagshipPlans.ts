/**
 * Planes "flagship" de la librería de Obra Check / lienzo: pocos pero EXCELENTES.
 *
 * Reemplazan a los planes autogenerados lineales (cadenas 1→1 de títulos genéricos) por
 * secuencias constructivas reales: muchas tareas, nombres específicos y precedencias
 * ramificadas DENTRO de cada fase (regla de hermanos del importador).
 *
 * Vocabulario es-AR de obra. Los nombres están elegidos para que:
 *  - `inferPhase` (Obra Check) los ubique en la fase correcta (Preparacion / Estructura /
 *    Instalaciones / Terminaciones),
 *  - `detectarRubro` les asigne un rubro canónico sensato.
 *
 * La verdad de generación vive acá: `scripts/generate-canvas-template-library.ts` emite el XML
 * (con `buildStructuredPlanTemplateXml`) y las entradas del catálogo desde estos specs.
 */

import type { StructuredPlanSpec, StructuredPlanTask } from './buildStructuredPlanTemplateXml';

export type FlagshipSegment = 'casa' | 'reforma' | 'edificio';

export type FlagshipPlan = {
  segment: FlagshipSegment;
  slug: string;
  nombreVisible: string;
  obraProductKind: 'casa' | 'reforma' | 'edificio';
  rubro: string;
  subtipo: string;
  filtroUnidad: string;
  unidadesMin: number | null;
  unidadesMax: number | null;
  m2Min: number | null;
  m2Max: number | null;
  complejidad: string | null;
  plantas: number | null;
  ambientesMin: number | null;
  ambientesMax: number | null;
  plantasEdificio: number | null;
  deptosPorPiso: number | null;
  pbComercial: boolean;
  subsueloCocheras: boolean;
  amenities: boolean;
  tags: string[];
  duracionGuia: string | null;
  spec: StructuredPlanSpec;
};

/* ------------------------------------------------------------------ *
 * Helpers de composición (bloques constructivos reutilizables).
 * ------------------------------------------------------------------ */

const t = (
  key: string,
  name: string,
  durationDays: number,
  deps?: string[],
): StructuredPlanTask => ({ key, name, durationDays, ...(deps ? { deps } : {}) });

/* ================================================================== *
 * CASA — 1 planta, 3 ambientes (media)
 * ================================================================== */

const casa1p3amb: StructuredPlanSpec = {
  projectTitle: 'Casa 1 planta — 3 ambientes (media)',
  phases: [
    {
      name: 'Preparación',
      tasks: [
        t('relev', 'Relevamiento y medición del terreno', 2),
        t('suelo_estudio', 'Estudio geotécnico y de napa freática', 3, ['relev']),
        t('proyecto', 'Proyecto arquitectónico y documentación técnica', 10, ['relev']),
        t('permiso', 'Permiso de obra y aprobación municipal', 15, ['proyecto']),
        t('obrador', 'Obrador, cerco de obra y servicios provisorios', 3, ['relev']),
        t('replanteo', 'Replanteo general de ejes y niveles', 2, ['permiso', 'obrador']),
      ],
    },
    {
      name: 'Estructura',
      tasks: [
        t('suelos_mov', 'Movimiento de suelos, limpieza y nivelación', 3),
        t('excav', 'Excavación de bases y pozos de fundación', 3, ['suelos_mov']),
        t('fund_bases', 'Fundaciones — hormigonado de bases y zapatas', 5, ['excav']),
        t('fund_vigas', 'Fundaciones — vigas de fundación y encadenado inferior', 4, ['fund_bases']),
        t('estr_columnas', 'Estructura de H°A° — columnas y tabiques', 6, ['fund_vigas']),
        t('estr_vigas', 'Estructura de H°A° — vigas y encadenado superior', 5, ['estr_columnas']),
        t('estr_losa', 'Estructura de H°A° — losa de techo', 7, ['estr_vigas']),
        t('mamp_ext', 'Mampostería de elevación — muros exteriores', 8, ['estr_columnas']),
        t('mamp_int', 'Mampostería — tabiques interiores', 6, ['mamp_ext']),
        t('mamp_dinteles', 'Mampostería — dinteles, antepechos y amure de premarcos', 4, ['mamp_int']),
      ],
    },
    {
      name: 'Instalaciones',
      tasks: [
        t('san_desague', 'Instalación sanitaria — desagües cloacales y pluviales', 5, ['mamp_dinteles']),
        t('san_agua', 'Instalación sanitaria — cañerías de agua fría y caliente', 5, ['san_desague']),
        t('gas_cañeria', 'Instalación de gas — cañerías y montantes', 4, ['mamp_dinteles']),
        t('elec_caneros', 'Instalación eléctrica — cañeros, cajas y bocas', 6, ['mamp_dinteles']),
        t('elec_cableado', 'Instalación eléctrica — cableado y tablero seccional', 5, ['elec_caneros']),
        t('term_aire', 'Instalación termomecánica — cañerías de aire acondicionado', 3, ['mamp_dinteles']),
        t('prueba_hidr', 'Instalaciones — prueba hidráulica y de estanqueidad', 2, ['san_agua', 'gas_cañeria']),
      ],
    },
    {
      name: 'Terminaciones',
      tasks: [
        t('revoque_grueso', 'Revoque grueso interior a la cal', 8, ['prueba_hidr']),
        t('revoque_ext', 'Revoque exterior grueso y fino con buñas', 8, ['revoque_grueso']),
        t('revoque_fino', 'Revoque fino interior y enlucido', 6, ['revoque_grueso']),
        t('techo_memb', 'Impermeabilización y membrana de techo', 3, ['revoque_ext']),
        t('cielorraso', 'Cielorrasos de durlock bajo techo', 5, ['revoque_fino']),
        t('contrapiso', 'Contrapiso y carpeta de pisos', 5, ['revoque_grueso']),
        t('pisos_int', 'Colocación de pisos de porcelanato interiores', 7, ['contrapiso']),
        t('pisos_humedos', 'Colocación de revestimientos y pisos de baños y cocina', 6, ['contrapiso']),
        t('zocalos', 'Colocación de zócalos y terminación de pisos', 2, ['pisos_int']),
        t('carp_premarco', 'Carpinterías — colocación de premarcos y marcos', 3, ['revoque_grueso']),
        t('carp_aberturas', 'Carpinterías — puertas placa y aberturas de aluminio', 6, ['carp_premarco', 'revoque_fino']),
        t('carp_muebles', 'Carpintería — muebles de cocina, placares y mesada', 6, ['pisos_int']),
        t('pintura_int', 'Pintura interior — enduido, sellador y látex', 7, ['cielorraso', 'carp_aberturas']),
        t('pintura_ext', 'Pintura exterior y frente', 5, ['revoque_ext']),
        t('limpieza', 'Limpieza final de obra y entrega', 3, ['pintura_int', 'zocalos']),
      ],
    },
  ],
};

/* ================================================================== *
 * CASA — 2 plantas, 4 ambientes (grande)
 * ================================================================== */

const casa2p4amb: StructuredPlanSpec = {
  projectTitle: 'Casa 2 plantas — 4 ambientes (grande)',
  phases: [
    {
      name: 'Preparación',
      tasks: [
        t('relev', 'Relevamiento y medición del terreno', 2),
        t('suelo_estudio', 'Estudio geotécnico y de napa freática', 4, ['relev']),
        t('proyecto', 'Proyecto arquitectónico y documentación técnica', 14, ['relev']),
        t('estructural', 'Ingeniería de detalle y cómputo de materiales', 8, ['proyecto']),
        t('permiso', 'Permiso de obra y aprobación municipal', 20, ['proyecto']),
        t('obrador', 'Obrador, cerco de obra y servicios provisorios', 4, ['relev']),
        t('replanteo', 'Replanteo general de ejes y niveles', 3, ['permiso', 'obrador']),
      ],
    },
    {
      name: 'Estructura',
      tasks: [
        t('suelos_mov', 'Movimiento de suelos, limpieza y nivelación', 4),
        t('excav', 'Excavación de bases y pozos de fundación', 5, ['suelos_mov']),
        t('fund_bases', 'Fundaciones — hormigonado de bases y zapatas', 7, ['excav']),
        t('fund_vigas', 'Fundaciones — vigas de fundación y encadenado inferior', 5, ['fund_bases']),
        t('estr_col_pb', 'Estructura de H°A° — columnas de planta baja', 6, ['fund_vigas']),
        t('estr_losa_pb', 'Estructura de H°A° — losa de entrepiso sobre planta baja', 9, ['estr_col_pb']),
        t('estr_col_p1', 'Estructura de H°A° — columnas de planta alta', 6, ['estr_losa_pb']),
        t('estr_losa_p1', 'Estructura de H°A° — losa de techo sobre planta alta', 9, ['estr_col_p1']),
        t('estr_escalera', 'Estructura de H°A° — escalera de hormigón', 4, ['estr_losa_pb']),
        t('mamp_pb_ext', 'Mampostería de elevación — muros exteriores planta baja', 8, ['estr_losa_pb']),
        t('mamp_pb_int', 'Mampostería — tabiques interiores planta baja', 6, ['mamp_pb_ext']),
        t('mamp_p1_ext', 'Mampostería de elevación — muros exteriores planta alta', 8, ['estr_losa_p1', 'mamp_pb_ext']),
        t('mamp_p1_int', 'Mampostería — tabiques interiores planta alta', 6, ['mamp_p1_ext']),
        t('mamp_dinteles', 'Mampostería — dinteles, antepechos y amure de premarcos', 4, ['mamp_p1_int', 'mamp_pb_int']),
      ],
    },
    {
      name: 'Instalaciones',
      tasks: [
        t('san_desague', 'Instalación sanitaria — desagües cloacales y pluviales', 7, ['mamp_dinteles']),
        t('san_agua', 'Instalación sanitaria — cañerías de agua fría y caliente', 7, ['san_desague']),
        t('san_termo', 'Instalación sanitaria — termotanque y colectores', 3, ['san_agua']),
        t('gas_cañeria', 'Instalación de gas — cañerías, montantes y ventilaciones', 5, ['mamp_dinteles']),
        t('elec_caneros', 'Instalación eléctrica — cañeros, cajas y bocas', 8, ['mamp_dinteles']),
        t('elec_cableado', 'Instalación eléctrica — cableado, tablero y toma a tierra', 6, ['elec_caneros']),
        t('term_aire', 'Instalación termomecánica — cañerías y unidades de aire', 5, ['mamp_dinteles']),
        t('prueba_hidr', 'Instalaciones — prueba hidráulica y de estanqueidad', 3, ['san_agua', 'gas_cañeria']),
      ],
    },
    {
      name: 'Terminaciones',
      tasks: [
        t('revoque_grueso', 'Revoque grueso interior a la cal', 12, ['prueba_hidr']),
        t('revoque_ext', 'Revoque exterior grueso y fino con buñas', 12, ['revoque_grueso']),
        t('revoque_fino', 'Revoque fino interior y enlucido', 10, ['revoque_grueso']),
        t('techo_memb', 'Impermeabilización y membrana de techo', 4, ['revoque_ext']),
        t('cielorraso', 'Cielorrasos de durlock bajo techo', 8, ['revoque_fino']),
        t('contrapiso', 'Contrapiso y carpeta de pisos', 8, ['revoque_grueso']),
        t('pisos_pb', 'Colocación de pisos de porcelanato — planta baja', 8, ['contrapiso']),
        t('pisos_p1', 'Colocación de pisos — planta alta', 7, ['contrapiso']),
        t('pisos_humedos', 'Colocación de revestimientos y pisos de baños y cocina', 8, ['contrapiso']),
        t('zocalos', 'Colocación de zócalos y terminación de pisos', 3, ['pisos_pb', 'pisos_p1']),
        t('carp_premarco', 'Carpinterías — colocación de premarcos y marcos', 4, ['revoque_grueso']),
        t('carp_aberturas', 'Carpinterías — puertas placa y aberturas de aluminio', 8, ['carp_premarco', 'revoque_fino']),
        t('carp_escalera', 'Carpintería — baranda y revestimiento de escalera', 4, ['pisos_p1']),
        t('carp_muebles', 'Carpintería — muebles de cocina, placares y mesada', 8, ['pisos_pb']),
        t('pintura_int', 'Pintura interior — enduido, sellador y látex', 12, ['cielorraso', 'carp_aberturas']),
        t('pintura_ext', 'Pintura exterior y frente', 7, ['revoque_ext']),
        t('limpieza', 'Limpieza final de obra y entrega', 4, ['pintura_int', 'zocalos']),
      ],
    },
  ],
};

/* ================================================================== *
 * REFORMA — integral chica (40-80 m²)
 * ================================================================== */

const reformaChica: StructuredPlanSpec = {
  projectTitle: 'Reforma integral — chica (40-80 m²)',
  phases: [
    {
      name: 'Preparación',
      tasks: [
        t('relev', 'Relevamiento del estado existente y medición', 2),
        t('proyecto', 'Proyecto de reforma y documentación', 6, ['relev']),
        t('proteccion', 'Protección de sectores, mobiliario y accesos', 2, ['relev']),
        t('obrador', 'Acopio de materiales y logística de obra', 2, ['proteccion']),
      ],
    },
    {
      name: 'Estructura',
      tasks: [
        t('demol_revest', 'Demolición de revestimientos, pisos y cielorrasos', 4, ['obrador']),
        t('demol_tabiques', 'Demolición selectiva de tabiques y mampostería', 3, ['demol_revest']),
        t('retiro', 'Retiro de escombros y limpieza gruesa', 2, ['demol_tabiques']),
        t('mamp_nueva', 'Mampostería nueva — tabiques y cierres', 4, ['retiro']),
        t('refuerzo', 'Refuerzo estructural y dinteles de vanos nuevos', 3, ['demol_tabiques']),
      ],
    },
    {
      name: 'Instalaciones',
      tasks: [
        t('san_desague', 'Instalación sanitaria — desagües y cañerías de agua', 5, ['mamp_nueva']),
        t('gas_cañeria', 'Instalación de gas — adecuación de cañerías', 3, ['mamp_nueva']),
        t('elec_caneros', 'Instalación eléctrica — cañeros y cajas nuevas', 5, ['mamp_nueva']),
        t('elec_cableado', 'Instalación eléctrica — cableado y tablero', 4, ['elec_caneros']),
        t('san_artefactos', 'Instalación sanitaria — artefactos y griferías', 3, ['san_desague']),
        t('prueba_hidr', 'Instalaciones — prueba hidráulica y de estanqueidad', 1, ['san_desague', 'gas_cañeria']),
      ],
    },
    {
      name: 'Terminaciones',
      tasks: [
        t('revoque', 'Revoque y reparación de paramentos', 6, ['prueba_hidr']),
        t('cielorraso', 'Cielorrasos de durlock y bajo techo', 4, ['revoque']),
        t('contrapiso', 'Contrapiso y carpeta de pisos', 4, ['revoque']),
        t('pisos', 'Colocación de pisos de porcelanato', 6, ['contrapiso']),
        t('pisos_humedos', 'Colocación de revestimientos y pisos de baño y cocina', 5, ['contrapiso']),
        t('zocalos', 'Colocación de zócalos de piso', 2, ['pisos']),
        t('carp_aberturas', 'Carpinterías — puertas y aberturas', 4, ['revoque']),
        t('carp_muebles', 'Carpintería — muebles de cocina y placares', 5, ['pisos']),
        t('pintura', 'Pintura interior — enduido, sellador y látex', 6, ['cielorraso', 'carp_aberturas']),
        t('limpieza', 'Limpieza final de obra', 2, ['pintura', 'zocalos']),
      ],
    },
  ],
};

/* ================================================================== *
 * REFORMA — integral grande (80-150 m²)
 * ================================================================== */

const reformaGrande: StructuredPlanSpec = {
  projectTitle: 'Reforma integral — grande (80-150 m²)',
  phases: [
    {
      name: 'Preparación',
      tasks: [
        t('relev', 'Relevamiento del estado existente y medición', 3),
        t('proyecto', 'Proyecto de reforma y documentación técnica', 10, ['relev']),
        t('permiso', 'Aviso de obra / permiso municipal', 12, ['proyecto']),
        t('proteccion', 'Protección de sectores, mobiliario y accesos', 3, ['relev']),
        t('obrador', 'Obrador, acopio y logística de obra', 3, ['proteccion']),
      ],
    },
    {
      name: 'Estructura',
      tasks: [
        t('demol_revest', 'Demolición de revestimientos, pisos y cielorrasos', 6, ['obrador']),
        t('demol_tabiques', 'Demolición selectiva de tabiques y mampostería', 5, ['demol_revest']),
        t('demol_aberturas', 'Demolición y retiro de aberturas existentes', 3, ['demol_revest']),
        t('retiro', 'Retiro de escombros y limpieza gruesa', 3, ['demol_tabiques', 'demol_aberturas']),
        t('refuerzo', 'Refuerzo estructural de losas y vigas', 5, ['retiro']),
        t('mamp_nueva', 'Mampostería nueva — tabiques y cierres', 6, ['refuerzo']),
        t('mamp_dinteles', 'Mampostería — dinteles y amure de premarcos', 3, ['mamp_nueva']),
      ],
    },
    {
      name: 'Instalaciones',
      tasks: [
        t('san_desague', 'Instalación sanitaria — desagües cloacales y pluviales', 6, ['mamp_dinteles']),
        t('san_agua', 'Instalación sanitaria — cañerías de agua fría y caliente', 6, ['san_desague']),
        t('gas_cañeria', 'Instalación de gas — adecuación de cañerías y montantes', 4, ['mamp_dinteles']),
        t('elec_caneros', 'Instalación eléctrica — cañeros y cajas nuevas', 7, ['mamp_dinteles']),
        t('elec_cableado', 'Instalación eléctrica — cableado y tablero seccional', 5, ['elec_caneros']),
        t('term_aire', 'Instalación termomecánica — cañerías de aire acondicionado', 4, ['mamp_dinteles']),
        t('san_artefactos', 'Instalación sanitaria — artefactos y griferías', 4, ['san_agua']),
        t('prueba_hidr', 'Instalaciones — prueba hidráulica y de estanqueidad', 2, ['san_agua', 'gas_cañeria']),
      ],
    },
    {
      name: 'Terminaciones',
      tasks: [
        t('revoque', 'Revoque y reparación integral de paramentos', 9, ['prueba_hidr']),
        t('revoque_fino', 'Revoque fino y enlucido', 6, ['revoque']),
        t('cielorraso', 'Cielorrasos de durlock y bajo techo', 6, ['revoque_fino']),
        t('contrapiso', 'Contrapiso y carpeta de pisos', 6, ['revoque']),
        t('pisos', 'Colocación de pisos de porcelanato', 8, ['contrapiso']),
        t('pisos_humedos', 'Colocación de revestimientos y pisos de baños y cocina', 7, ['contrapiso']),
        t('zocalos', 'Colocación de zócalos y terminación de pisos', 3, ['pisos']),
        t('carp_premarco', 'Carpinterías — colocación de premarcos', 3, ['revoque']),
        t('carp_aberturas', 'Carpinterías — puertas y aberturas de aluminio', 6, ['carp_premarco', 'revoque_fino']),
        t('carp_muebles', 'Carpintería — muebles de cocina, placares y mesada', 7, ['pisos']),
        t('pintura', 'Pintura interior — enduido, sellador y látex', 9, ['cielorraso', 'carp_aberturas']),
        t('pintura_ext', 'Pintura exterior y fachada', 5, ['revoque']),
        t('limpieza', 'Limpieza final de obra', 3, ['pintura', 'zocalos']),
      ],
    },
  ],
};

/* ================================================================== *
 * EDIFICIO — helpers multi-planta
 * ================================================================== */

/** Genera tareas de una fase repetida por planta, encadenadas planta a planta. */
function porPlanta(
  prefix: string,
  nombre: (piso: string) => string,
  pisos: string[],
  durationDays: number,
  firstDeps: string[] = [],
): StructuredPlanTask[] {
  const out: StructuredPlanTask[] = [];
  let prevKey: string | null = null;
  pisos.forEach((piso, i) => {
    const key = `${prefix}_${i}`;
    const deps = prevKey ? [prevKey] : firstDeps;
    out.push(t(key, nombre(piso), durationDays, deps.length ? deps : undefined));
    prevKey = key;
  });
  return out;
}

/* ================================================================== *
 * EDIFICIO — 6 plantas, 2 deptos por piso
 * ================================================================== */

const pisos6 = ['PB', '1°', '2°', '3°', '4°', '5°'];

const edificio6p: StructuredPlanSpec = {
  projectTitle: 'Edificio 6 plantas — 2 deptos por piso',
  phases: [
    {
      name: 'Preparación',
      tasks: [
        t('relev', 'Relevamiento planialtimétrico y medición', 5),
        t('proyecto', 'Proyecto ejecutivo e ingeniería de detalle', 25, ['relev']),
        t('permiso', 'Permiso de obra y aprobaciones municipales', 30, ['proyecto']),
        t('obrador', 'Obrador, vallado, grúa y servicios de obra', 8, ['relev']),
        t('replanteo', 'Replanteo general y trazado de ejes', 4, ['permiso', 'obrador']),
      ],
    },
    {
      name: 'Estructura',
      tasks: [
        t('suelos_mov', 'Movimiento de suelos y excavación general', 10),
        t('submuracion', 'Submuración y fundaciones profundas (pilotes)', 15, ['suelos_mov']),
        t('fund_platea', 'Fundaciones — platea y cabezales de hormigón', 12, ['submuracion']),
        ...porPlanta(
          'estr',
          (p) => `Estructura de H°A° — columnas y losa ${p}`,
          pisos6,
          8,
          ['fund_platea'],
        ),
        t('estr_tanque', 'Estructura de H°A° — sala de máquinas y tanque', 6),
        ...porPlanta(
          'mamp',
          (p) => `Mampostería de elevación y tabiques — ${p}`,
          pisos6,
          6,
          ['estr_0'],
        ),
      ],
    },
    {
      name: 'Instalaciones',
      tasks: [
        t('san_montantes', 'Instalación sanitaria — montantes y cañerías troncales', 12, ['mamp_0']),
        t('san_deptos', 'Instalación sanitaria — bocas y ramales por unidad', 14, ['san_montantes']),
        t('gas_montantes', 'Instalación de gas — montantes y ramales por unidad', 10, ['mamp_0']),
        t('elec_montantes', 'Instalación eléctrica — montantes y tablero general', 10, ['mamp_0']),
        t('elec_deptos', 'Instalación eléctrica — cañeros y cableado por unidad', 14, ['elec_montantes']),
        t('incendio', 'Instalación de incendio, presurización y detección', 8, ['mamp_0']),
        t('ascensor_guias', 'Instalación de ascensores — guías, contrapesos y montaje', 12, ['estr_tanque']),
        t('prueba_hidr', 'Instalaciones — pruebas hidráulicas y de estanqueidad', 4, ['san_deptos', 'gas_montantes']),
      ],
    },
    {
      name: 'Terminaciones',
      tasks: [
        t('revoque_int', 'Revoques interiores por unidad', 20, ['prueba_hidr']),
        t('revoque_fachada', 'Revoque y terminación de fachada', 15, ['revoque_int']),
        t('cielorraso', 'Cielorrasos de durlock por unidad', 12, ['revoque_int']),
        t('contrapiso', 'Contrapisos y carpetas de pisos', 12, ['revoque_int']),
        t('pisos', 'Colocación de pisos de porcelanato por unidad', 18, ['contrapiso']),
        t('pisos_humedos', 'Revestimientos y pisos de baños y cocinas', 15, ['contrapiso']),
        t('carp_aberturas', 'Carpinterías — aberturas de aluminio y puertas', 14, ['revoque_int']),
        t('carp_muebles', 'Carpintería — muebles de cocina y placares por unidad', 14, ['pisos']),
        t('pintura', 'Pintura interior y de palieres', 18, ['cielorraso', 'carp_aberturas']),
        t('pintura_com', 'Pintura y terminación de espacios comunes', 8, ['revoque_fachada']),
        t('limpieza', 'Limpieza final y entrega de unidades', 6, ['pintura', 'pisos_humedos']),
      ],
    },
  ],
};

/* ================================================================== *
 * EDIFICIO — 10 plantas, 4 deptos por piso (torre con cocheras)
 * ================================================================== */

const pisos10 = ['PB', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°'];

const edificio10p: StructuredPlanSpec = {
  projectTitle: 'Edificio 10 plantas — 4 deptos por piso (torre)',
  phases: [
    {
      name: 'Preparación',
      tasks: [
        t('relev', 'Relevamiento planialtimétrico y medición', 6),
        t('proyecto', 'Proyecto ejecutivo e ingeniería de detalle', 35, ['relev']),
        t('permiso', 'Permiso de obra y aprobaciones municipales', 40, ['proyecto']),
        t('obrador', 'Obrador, vallado, grúa torre y servicios de obra', 12, ['relev']),
        t('replanteo', 'Replanteo general y trazado de ejes', 5, ['permiso', 'obrador']),
      ],
    },
    {
      name: 'Estructura',
      tasks: [
        t('suelos_mov', 'Movimiento de suelos y excavación de subsuelo', 18),
        t('submuracion', 'Submuración perimetral y muro colado', 20, ['suelos_mov']),
        t('fund_pilotes', 'Fundaciones — pilotes y cabezales de hormigón', 18, ['submuracion']),
        t('fund_platea', 'Fundaciones — platea de subsuelo de cocheras', 14, ['fund_pilotes']),
        t('estr_subsuelo', 'Estructura de H°A° — subsuelo de cocheras', 12, ['fund_platea']),
        ...porPlanta(
          'estr',
          (p) => `Estructura de H°A° — columnas, tabiques y losa ${p}`,
          pisos10,
          8,
          ['estr_subsuelo'],
        ),
        t('estr_tanque', 'Estructura de H°A° — sala de máquinas y tanque superior', 8),
        ...porPlanta(
          'mamp',
          (p) => `Mampostería de elevación y tabiques — ${p}`,
          pisos10,
          6,
          ['estr_0'],
        ),
      ],
    },
    {
      name: 'Instalaciones',
      tasks: [
        t('san_montantes', 'Instalación sanitaria — montantes y cañerías troncales', 16, ['mamp_0']),
        t('san_deptos', 'Instalación sanitaria — bocas y ramales por unidad', 20, ['san_montantes']),
        t('gas_montantes', 'Instalación de gas — montantes y ramales por unidad', 14, ['mamp_0']),
        t('elec_montantes', 'Instalación eléctrica — montantes y sala de tableros', 14, ['mamp_0']),
        t('elec_deptos', 'Instalación eléctrica — cañeros y cableado por unidad', 20, ['elec_montantes']),
        t('incendio', 'Instalación de incendio, presurización y detección', 12, ['mamp_0']),
        t('termo', 'Instalación termomecánica — VRV y conductos', 12, ['mamp_0']),
        t('ascensores', 'Instalación de ascensores — guías, cabinas y montaje', 18, ['estr_tanque']),
        t('prueba_hidr', 'Instalaciones — pruebas hidráulicas y de estanqueidad', 5, ['san_deptos', 'gas_montantes']),
      ],
    },
    {
      name: 'Terminaciones',
      tasks: [
        t('revoque_int', 'Revoques interiores por unidad', 30, ['prueba_hidr']),
        t('revoque_fachada', 'Revoque, frente vidriado y terminación de fachada', 22, ['revoque_int']),
        t('cielorraso', 'Cielorrasos de durlock por unidad', 18, ['revoque_int']),
        t('contrapiso', 'Contrapisos y carpetas de pisos', 18, ['revoque_int']),
        t('pisos', 'Colocación de pisos de porcelanato por unidad', 28, ['contrapiso']),
        t('pisos_humedos', 'Revestimientos y pisos de baños y cocinas', 22, ['contrapiso']),
        t('carp_aberturas', 'Carpinterías — aberturas de aluminio y puertas', 22, ['revoque_int']),
        t('carp_muebles', 'Carpintería — muebles de cocina y placares por unidad', 22, ['pisos']),
        t('cocheras', 'Terminación de cocheras, demarcación y portón', 8, ['revoque_int']),
        t('pintura', 'Pintura interior y de palieres', 28, ['cielorraso', 'carp_aberturas']),
        t('pintura_com', 'Pintura y terminación de espacios comunes y hall', 12, ['revoque_fachada']),
        t('limpieza', 'Limpieza final y entrega de unidades', 8, ['pintura', 'pisos_humedos']),
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */

export const FLAGSHIP_PLANS: FlagshipPlan[] = [
  {
    segment: 'casa',
    slug: 'casa_1p_3amb_media',
    nombreVisible: 'Casa 1 planta — 3 ambientes (media)',
    obraProductKind: 'casa',
    rubro: 'casa',
    subtipo: '1_planta',
    filtroUnidad: 'm2_cubierto',
    unidadesMin: null,
    unidadesMax: null,
    m2Min: 80,
    m2Max: 130,
    complejidad: 'media',
    plantas: 1,
    ambientesMin: 3,
    ambientesMax: 3,
    plantasEdificio: null,
    deptosPorPiso: null,
    pbComercial: false,
    subsueloCocheras: false,
    amenities: false,
    tags: ['casa', '1p', '3amb', 'media', 'obra nueva'],
    duracionGuia: 'Plan real ~7 fases · muchas tareas encadenadas',
    spec: casa1p3amb,
  },
  {
    segment: 'casa',
    slug: 'casa_2p_4amb_grande',
    nombreVisible: 'Casa 2 plantas — 4 ambientes (grande)',
    obraProductKind: 'casa',
    rubro: 'casa',
    subtipo: '2_plantas',
    filtroUnidad: 'm2_cubierto',
    unidadesMin: null,
    unidadesMax: null,
    m2Min: 150,
    m2Max: 220,
    complejidad: 'alta',
    plantas: 2,
    ambientesMin: 4,
    ambientesMax: 4,
    plantasEdificio: null,
    deptosPorPiso: null,
    pbComercial: false,
    subsueloCocheras: false,
    amenities: false,
    tags: ['casa', '2p', '4amb', 'grande', 'obra nueva'],
    duracionGuia: 'Plan real con dos plantas · estructura y terminaciones por nivel',
    spec: casa2p4amb,
  },
  {
    segment: 'reforma',
    slug: 'reforma_integral_chica',
    nombreVisible: 'Reforma integral — chica (40-80 m²)',
    obraProductKind: 'reforma',
    rubro: 'reforma',
    subtipo: 'integral',
    filtroUnidad: 'm2',
    unidadesMin: null,
    unidadesMax: null,
    m2Min: 40,
    m2Max: 80,
    complejidad: 'media',
    plantas: 1,
    ambientesMin: null,
    ambientesMax: null,
    plantasEdificio: null,
    deptosPorPiso: null,
    pbComercial: false,
    subsueloCocheras: false,
    amenities: false,
    tags: ['reforma', 'integral', 'chica'],
    duracionGuia: 'Reforma integral · demolición, instalaciones y terminaciones',
    spec: reformaChica,
  },
  {
    segment: 'reforma',
    slug: 'reforma_integral_grande',
    nombreVisible: 'Reforma integral — grande (80-150 m²)',
    obraProductKind: 'reforma',
    rubro: 'reforma',
    subtipo: 'integral',
    filtroUnidad: 'm2',
    unidadesMin: null,
    unidadesMax: null,
    m2Min: 80,
    m2Max: 150,
    complejidad: 'alta',
    plantas: 1,
    ambientesMin: null,
    ambientesMax: null,
    plantasEdificio: null,
    deptosPorPiso: null,
    pbComercial: false,
    subsueloCocheras: false,
    amenities: false,
    tags: ['reforma', 'integral', 'grande'],
    duracionGuia: 'Reforma integral grande · plan completo por gremios',
    spec: reformaGrande,
  },
  {
    segment: 'edificio',
    slug: 'edificio_6p_2dpp',
    nombreVisible: 'Edificio 6 plantas — 2 deptos por piso',
    obraProductKind: 'edificio',
    rubro: 'edificio',
    subtipo: 'vivienda',
    filtroUnidad: 'unidades_totales',
    unidadesMin: 12,
    unidadesMax: 12,
    m2Min: null,
    m2Max: null,
    complejidad: 'media',
    plantas: null,
    ambientesMin: null,
    ambientesMax: null,
    plantasEdificio: 6,
    deptosPorPiso: 2,
    pbComercial: false,
    subsueloCocheras: false,
    amenities: false,
    tags: ['edificio', 'vivienda', '6p', '2dpp'],
    duracionGuia: 'Edificio en altura · estructura y terminaciones por planta',
    spec: edificio6p,
  },
  {
    segment: 'edificio',
    slug: 'edificio_10p_4dpp_torre',
    nombreVisible: 'Edificio 10 plantas — 4 deptos por piso (torre)',
    obraProductKind: 'edificio',
    rubro: 'edificio',
    subtipo: 'torre',
    filtroUnidad: 'unidades_totales',
    unidadesMin: 40,
    unidadesMax: 40,
    m2Min: null,
    m2Max: null,
    complejidad: 'alta',
    plantas: null,
    ambientesMin: null,
    ambientesMax: null,
    plantasEdificio: 10,
    deptosPorPiso: 4,
    pbComercial: false,
    subsueloCocheras: true,
    amenities: false,
    tags: ['edificio', 'torre', '10p', '4dpp', 'cocheras'],
    duracionGuia: 'Torre con subsuelo de cocheras · plan completo por planta y gremio',
    spec: edificio10p,
  },
];
