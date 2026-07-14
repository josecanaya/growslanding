/**
 * Rubros canónicos de Obra Check (v1).
 *
 * El ORDEN del array define la secuencia constructiva por defecto: cuando un plan no trae
 * dependencias ni fechas, se ordena por este índice. También es la semilla de la futura
 * "biblioteca de secuencias constructivas".
 */

export const RUBROS_CANONICOS = [
  'demolicion',
  'movimiento_suelos',
  'fundaciones',
  'estructura',
  'mamposteria',
  'techos',
  'instalacion_electrica',
  'instalacion_sanitaria',
  'instalacion_gas',
  'revoques',
  'contrapisos_carpetas',
  'colocaciones',
  'carpinterias',
  'pintura',
  'limpieza_final',
] as const;

export type RubroCanonico = (typeof RUBROS_CANONICOS)[number];

export const RUBRO_LABEL: Record<RubroCanonico, string> = {
  demolicion: 'Demolición',
  movimiento_suelos: 'Movimiento de suelos',
  fundaciones: 'Fundaciones',
  estructura: 'Estructura',
  mamposteria: 'Mampostería',
  techos: 'Techos',
  instalacion_electrica: 'Instalación eléctrica',
  instalacion_sanitaria: 'Instalación sanitaria',
  instalacion_gas: 'Instalación de gas',
  revoques: 'Revoques',
  contrapisos_carpetas: 'Contrapisos y carpetas',
  colocaciones: 'Colocaciones (pisos y revestimientos)',
  carpinterias: 'Carpinterías',
  pintura: 'Pintura',
  limpieza_final: 'Limpieza final',
};

/** Índice del rubro en la secuencia canónica; rubro desconocido/null va al final. */
export function rubroOrden(rubro: string | null): number {
  if (!rubro) return RUBROS_CANONICOS.length + 1;
  const idx = RUBROS_CANONICOS.indexOf(rubro as RubroCanonico);
  return idx < 0 ? RUBROS_CANONICOS.length + 1 : idx;
}

export function rubroLabel(rubro: string | null): string {
  if (!rubro) return 'Varios';
  return RUBRO_LABEL[rubro as RubroCanonico] ?? rubro;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Patrones (sobre texto normalizado) que mapean el nombre de una tarea a un rubro canónico. */
const RUBRO_PATTERNS: Array<{ rubro: RubroCanonico; re: RegExp }> = [
  { rubro: 'demolicion', re: /\b(demolic|demoler|retiro de|desmont)/ },
  { rubro: 'movimiento_suelos', re: /\b(excavac|movimiento de suelo|relleno|nivelac|desmonte de tierra)/ },
  { rubro: 'fundaciones', re: /\b(fundac|platea|zapata|pilote|cimiento|base de hormig)/ },
  { rubro: 'estructura', re: /\b(estructura|columna|viga|losa|encadenado|hormigon armado|hierro)/ },
  { rubro: 'mamposteria', re: /\b(mamposter|muro|ladrillo|pared|tabique|bloque de)/ },
  { rubro: 'techos', re: /\b(techo|cubierta|membrana|impermeabiliz|cielorraso|losa de techo)/ },
  { rubro: 'instalacion_electrica', re: /\b(electric|cableado|tablero|tomacorriente|luminaria|canalizac elec)/ },
  { rubro: 'instalacion_sanitaria', re: /\b(sanitari|cloac|desagu|agua fria|agua caliente|caneria|griferia|artefacto sanit)/ },
  { rubro: 'instalacion_gas', re: /\b(\bgas\b|gasista|instalacion de gas)/ },
  { rubro: 'revoques', re: /\b(revoque|revocar|grueso|fino|jaharro|enlucido)/ },
  { rubro: 'contrapisos_carpetas', re: /\b(contrapiso|carpeta|nivelacion de piso)/ },
  { rubro: 'colocaciones', re: /\b(coloca|porcelanato|ceramic|piso|revestimiento|zocalo|mosaico)/ },
  { rubro: 'carpinterias', re: /\b(carpinter|puerta|ventana|porton|mueble|placard)/ },
  { rubro: 'pintura', re: /\b(pintura|pintar|latex|enduido|masilla)/ },
  { rubro: 'limpieza_final', re: /\b(limpieza|limpiar|entrega final|fin de obra)/ },
];

/** Infiere el rubro canónico desde el nombre de la tarea. Devuelve null si no matchea. */
export function detectarRubro(nombre: string): string | null {
  const n = normalize(nombre);
  for (const { rubro, re } of RUBRO_PATTERNS) {
    if (re.test(n)) return rubro;
  }
  return null;
}
