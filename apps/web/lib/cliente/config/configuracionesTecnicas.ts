export type ConfiguracionTecnicaCampo = {
  label: string;
  type: 'select' | 'number' | 'text' | 'checkbox';
  options?: string[];
  min?: number;
  max?: number;
  default?: string | number | boolean;
  placeholder?: string;
  description?: string;
};

export const CONFIGURACIONES_TECNICAS: Record<string, Record<string, ConfiguracionTecnicaCampo>> = {
  'Cimiento corrido': {
    tipo: { label: 'Tipo de fundación', type: 'select', options: ['Superficial', 'Profunda'] },
    profundidad: { label: 'Profundidad (cm)', type: 'number', min: 40, max: 200, default: 80 },
    ancho: { label: 'Ancho (cm)', type: 'number', min: 20, max: 60, default: 40 },
    acero: { label: 'Acero de refuerzo', type: 'select', options: ['Ø8', 'Ø10', 'Ø12'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H17', 'H21', 'H30'] },
    recubrimiento: { label: 'Recubrimiento (cm)', type: 'number', min: 2, max: 5, default: 3 }
  },
  'Base aislada': {
    tipo: { label: 'Tipo de base', type: 'select', options: ['Superficial', 'Profunda'] },
    dimensiones: { label: 'Dimensiones (m)', type: 'text', placeholder: 'Ej: 2.5x2.5' },
    profundidad: { label: 'Profundidad (cm)', type: 'number', min: 60, max: 300, default: 120 },
    acero: { label: 'Acero de refuerzo', type: 'select', options: ['Ø8', 'Ø10', 'Ø12', 'Ø16'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H17', 'H21', 'H30'] }
  },
  'Columna hormigón armado': {
    seccion: { label: 'Sección (cm)', type: 'select', options: ['15x15', '20x20', '25x25', '30x30'] },
    altura: { label: 'Altura (m)', type: 'number', min: 2.5, max: 4, default: 3 },
    acero: { label: 'Acero longitudinal', type: 'select', options: ['4Ø12', '4Ø16', '6Ø16', '8Ø16'] },
    estribos: { label: 'Estribos', type: 'select', options: ['Ø6@15', 'Ø6@20', 'Ø8@15', 'Ø8@20'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H21', 'H30', 'H35'] }
  },
  'Encadenado fundación': {
    seccion: { label: 'Sección (cm)', type: 'select', options: ['15x20', '20x25', '25x30'], default: '15x20' },
    acero: { label: 'Acero', type: 'select', options: ['4Ø8', '4Ø10', '4Ø12'] },
    estribos: { label: 'Estribos', type: 'select', options: ['Ø6@20', 'Ø6@15', 'Ø8@20'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H17', 'H21'] }
  },
  'Losa de fundación (platea)': {
    espesor: { label: 'Espesor (cm)', type: 'number', min: 10, max: 40, default: 20 },
    acero_superior: { label: 'Malla superior', type: 'select', options: ['Q188', 'Q221', 'Q257'] },
    acero_inferior: { label: 'Malla inferior', type: 'select', options: ['Q188', 'Q221', 'Q257'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H21', 'H30'] }
  },
  'Viga hormigón armado': {
    seccion: { label: 'Sección (cm)', type: 'select', options: ['15x25', '20x30', '25x40'] },
    acero_longitudinal: { label: 'Acero longitudinal', type: 'select', options: ['4Ø12', '4Ø16', '6Ø16'] },
    estribos: { label: 'Estribos', type: 'select', options: ['Ø6@20', 'Ø8@20', 'Ø8@15'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H21', 'H30', 'H35'] }
  },
  'Muro común 15 cm': {
    espesor: { label: 'Espesor', type: 'select', options: ['15 cm', '20 cm', '30 cm'], default: '15 cm' },
    material: { label: 'Material', type: 'select', options: ['Ladrillo común', 'Cerámico hueco', 'Bloque de hormigón'] },
    aislacion: { label: 'Aislación', type: 'select', options: ['Sin aislación', 'EPS 50mm', 'EPS 100mm', 'Lana mineral'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Revoque grueso', 'Revoque fino', 'Pintura', 'Piedra'] }
  },
  'Muro común 30 cm (doble muro portante)': {
    tipo: { label: 'Tipo de muro', type: 'select', options: ['Doble muro', 'Muro portante simple'] },
    material: { label: 'Material', type: 'select', options: ['Ladrillo común', 'Cerámico hueco', 'Bloque de hormigón'] },
    camara: { label: 'Cámara de aire', type: 'checkbox', description: 'Incluir cámara de aire' },
    aislacion: { label: 'Aislación', type: 'select', options: ['Sin aislación', 'EPS 50mm', 'EPS 100mm'] },
    terminacion: { label: 'Terminación exterior', type: 'select', options: ['Revoque', 'Piedra', 'Ladrillo visto'] }
  },
  'Muro de Retak': {
    espesor: { label: 'Espesor', type: 'select', options: ['15 cm', '20 cm', '30 cm'] },
    tipo: { label: 'Tipo Retak', type: 'select', options: ['Retak 15', 'Retak 20', 'Retak 30'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Revoque grueso', 'Revoque fino', 'Pintura'] }
  },
  'Muro de ladrillo visto': {
    espesor: { label: 'Espesor', type: 'select', options: ['15 cm'], default: '15 cm' },
    junta: { label: 'Tipo de junta', type: 'select', options: ['A la vista', 'Rejuntado fino'] },
    protector: { label: 'Protección', type: 'select', options: ['Hidrófugo', 'Sellador acrílico', 'Sin protección'] }
  },
  'Tabique interior 15 cm': {
    material: { label: 'Material', type: 'select', options: ['Ladrillo hueco 15', 'Retak 15'] },
    aislacion: { label: 'Aislación acústica', type: 'select', options: ['Sin aislación', 'Lana mineral 50mm'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Revoque + pintura', 'Placa yeso'] }
  },
  'Losa de hormigón armado': {
    tipo: { label: 'Tipo de losa', type: 'select', options: ['Maciza', 'Alivianada', 'Pretensada'] },
    espesor: { label: 'Espesor (cm)', type: 'number', min: 10, max: 25, default: 15 },
    acero: { label: 'Acero de refuerzo', type: 'select', options: ['Ø8@20', 'Ø10@20', 'Ø12@15', 'Ø12@20'] },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H21', 'H30', 'H35'] }
  },
  'Contrapiso de hormigón': {
    espesor: { label: 'Espesor (cm)', type: 'number', min: 5, max: 15, default: 8 },
    hormigon: { label: 'Hormigón', type: 'select', options: ['H17', 'H21'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Alisado', 'Fratazado', 'Pulido'] }
  },
  'Piso de cerámica': {
    tipo: { label: 'Tipo de cerámica', type: 'select', options: ['Cerámica común', 'Porcelanato', 'Gres porcelánico'] },
    dimensiones: { label: 'Dimensiones', type: 'select', options: ['30x30 cm', '45x45 cm', '60x60 cm', '30x60 cm'] },
    acabado: { label: 'Acabado', type: 'select', options: ['Mate', 'Brillante', 'Rústico', 'Pulido'] }
  },
  'Piso de porcelanato': {
    tipo: { label: 'Tipo de porcelanato', type: 'select', options: ['Mate', 'Brillante', 'Satinado'] },
    dimensiones: { label: 'Dimensiones', type: 'select', options: ['60x60', '80x80', '120x60'] },
    junta: { label: 'Ancho de junta (mm)', type: 'number', min: 1, max: 5, default: 2 }
  },
  'Losa de techo': {
    tipo: { label: 'Tipo de losa', type: 'select', options: ['Maciza', 'Alivianada', 'Pretensada'] },
    espesor: { label: 'Espesor (cm)', type: 'number', min: 12, max: 25, default: 18 },
    aislacion: { label: 'Aislación térmica', type: 'select', options: ['Sin aislación', 'EPS 50mm', 'EPS 100mm', 'Lana mineral'] },
    impermeabilizacion: { label: 'Impermeabilización', type: 'select', options: ['Membrana asfáltica', 'Membrana PVC', 'Pintura asfáltica'] }
  },
  'Cubierta de chapa': {
    tipo: { label: 'Tipo de chapa', type: 'select', options: ['Chapa galvanizada', 'Chapa prepintada', 'Chapa de aluminio'] },
    espesor: { label: 'Espesor (mm)', type: 'select', options: ['0.5', '0.6', '0.7'] },
    aislacion: { label: 'Aislación', type: 'checkbox', description: 'Incluir aislación térmica' },
    color: { label: 'Color', type: 'select', options: ['Blanco', 'Gris', 'Rojo', 'Azul'] }
  },
  'Cubierta de teja': {
    tipo: { label: 'Tipo de teja', type: 'select', options: ['Colonial', 'Francesa', 'Portuguesa'] },
    color: { label: 'Color', type: 'select', options: ['Roja', 'Terracota', 'Negra'] },
    aislacion: { label: 'Aislación térmica', type: 'select', options: ['Sin aislación', 'EPS 50mm', 'EPS 100mm'] }
  },
  'Escalera de hormigón': {
    tipo: { label: 'Tipo de escalera', type: 'select', options: ['Recta', 'En L', 'En U', 'Caracol'] },
    ancho: { label: 'Ancho (cm)', type: 'number', min: 80, max: 120, default: 100 },
    altura: { label: 'Altura total (m)', type: 'number', min: 2.5, max: 4, default: 3 },
    terminacion: { label: 'Terminación', type: 'select', options: ['Revoque', 'Mármol', 'Cerámica', 'Madera'] }
  },
  'Escalera metálica': {
    tipo: { label: 'Tipo', type: 'select', options: ['Caracol', 'Recta', 'Volada'] },
    estructura: { label: 'Estructura', type: 'select', options: ['Hierro', 'Acero'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Pintura epoxi', 'Pintura sintética'] }
  },
  'Puerta de madera': {
    material: { label: 'Material', type: 'select', options: ['Madera maciza', 'Madera laminada', 'MDF'] },
    tipo: { label: 'Tipo', type: 'select', options: ['Simple', 'Doble', 'Corrediza'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Barniz natural', 'Barniz oscuro', 'Pintura'] }
  },
  'Ventana de madera': {
    tipo: { label: 'Tipo', type: 'select', options: ['Corrediza', 'Abatible', 'Fija'] },
    vidrio: { label: 'Vidrio', type: 'select', options: ['Simple', 'Doble', 'DVH'] },
    terminacion: { label: 'Terminación', type: 'select', options: ['Barniz', 'Pintura'] }
  },
  'Ventana de aluminio': {
    tipo: { label: 'Tipo', type: 'select', options: ['Corrediza', 'Abatible', 'Fija'] },
    vidrio: { label: 'Vidrio', type: 'select', options: ['Simple', 'Doble vidrio', 'DVH'] },
    color: { label: 'Color del marco', type: 'select', options: ['Blanco', 'Bronce', 'Negro'] }
  }
};

