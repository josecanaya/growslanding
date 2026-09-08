/** Tokens visuales del workspace de obra. Único lugar donde viven estos valores. */
export const WS = {
  /** superficies */
  papel: '#FBFBF9',      // lienzo
  panel: '#FFFFFF',      // paneles, inspector, hoja de chat
  rail: '#F4F4F1',       // rail de instrumentos
  panelBody: '#F8F8F6',  // cuerpo del inspector
  hoverSuave: '#F6F5F1', // hover de filas
  activo: '#F1F0EB',     // fila / botón activo
  papelDoc: '#F6F5F1',   // tarjeta de documento de contexto

  /** líneas */
  linea: '#E4E3DE',      // hairline por defecto
  lineaFuerte: '#D3D2CC',// borde de tarjeta, borde de pill
  lineaSuave: '#E9E8E3', // separadores internos, riel de barra de avance
  puntoGrilla: '#DCDBD5',// puntos de la grilla del lienzo
  lineaDoc: '#C9C6BB',   // borde punteado de documento

  /** tinta */
  tinta: '#15161A',
  tinta2: '#3D3E43',
  tinta3: '#55565C',
  tinta4: '#8B8C90',
  tinta5: '#A9A8A2',
  tinta6: '#B2B1AA',     // hint de tarjeta

  /** acento — tokens corporativos ya existentes en tailwind.config.ts */
  acento: '#0C1D36',     // growsBlue: acción primaria, selección
  acentoClaro: '#4A6FA5',// growsBlueLight: interactivo, estado «en curso»

  /** semántico */
  ok: '#2B8A3E',
  enCurso: '#4A6FA5',
  pendiente: '#C9C8C1',
  bloqueo: '#8A6410',
  bloqueoBorde: 'rgba(176,122,22,0.32)',
  bloqueoFondo: '#FBF7EE',
  critico: '#A32A2A',
  criticoBorde: 'rgba(163,42,42,0.34)',
  criticoFondo: '#FBF1F0',
  criticoBordeTarjeta: '#C6A3A0',
  aristaNormal: '#9C9B94',
} as const;

/** geometría */
export const WS_RADIO = { micro: 3, base: 6, panel: 8, pill: 9999 } as const;

/** una sola rampa de elevación */
export const WS_SOMBRA = {
  plana: '0 1px 2px rgba(21,22,26,0.04)',   // paneles anclados
  baja: '0 4px 16px rgba(21,22,26,0.07), 0 1px 2px rgba(21,22,26,0.05)',  // pill de comando
  alta: '0 8px 24px rgba(21,22,26,0.10), 0 1px 2px rgba(21,22,26,0.05)',  // flotantes
} as const;

/** rampa tipográfica — no agregues tamaños */
export const WS_TEXTO = [8, 9, 10, 11, 12, 13, 14, 19] as const;
