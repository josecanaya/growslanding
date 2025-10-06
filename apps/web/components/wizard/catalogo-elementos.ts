// Catálogo completo de elementos constructivos
export interface ElementoConstructivo {
  id: string;
  nombre: string;
  categoria: string;
  icono: string;
  descripcion: string;
  opciones: OpcionElemento[];
}

export interface OpcionElemento {
  id: string;
  nombre: string;
  descripcion: string;
  configuraciones: ConfiguracionTecnica[];
}

export interface ConfiguracionTecnica {
  id: string;
  nombre: string;
  tipo: 'select' | 'number' | 'checkbox' | 'text';
  opciones?: string[];
  min?: number;
  max?: number;
  unidad?: string;
  requerido: boolean;
  valor?: any;
}

export const CATALOGO_ELEMENTOS: ElementoConstructivo[] = [
  // 1. FUNDACIÓN Y ESTRUCTURA
  {
    id: 'excavacion_fundacion',
    nombre: 'Excavación de Fundación',
    categoria: 'Fundación y Estructura',
    icono: '⛏️',
    descripcion: 'Excavación para fundaciones',
    opciones: [
      {
        id: 'manual',
        nombre: 'Excavación Manual',
        descripcion: 'Excavación realizada manualmente',
        configuraciones: [
          { id: 'profundidad', nombre: 'Profundidad', tipo: 'select', opciones: ['0.8m', '1.0m', '1.2m', '1.5m'], requerido: true },
          { id: 'ancho', nombre: 'Ancho', tipo: 'number', min: 0.3, max: 2.0, unidad: 'm', requerido: true }
        ]
      },
      {
        id: 'mecanica',
        nombre: 'Excavación Mecánica',
        descripcion: 'Excavación con maquinaria',
        configuraciones: [
          { id: 'profundidad', nombre: 'Profundidad', tipo: 'select', opciones: ['1.0m', '1.5m', '2.0m', '2.5m'], requerido: true },
          { id: 'maquinaria', nombre: 'Tipo de Maquinaria', tipo: 'select', opciones: ['Retroexcavadora', 'Mini excavadora', 'Pala cargadora'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'hormigon_fundacion',
    nombre: 'Hormigón de Fundación',
    categoria: 'Fundación y Estructura',
    icono: '🏗️',
    descripcion: 'Hormigón para fundaciones',
    opciones: [
      {
        id: 'platea',
        nombre: 'Platea',
        descripcion: 'Fundación tipo platea',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['0.10m', '0.15m', '0.20m'], requerido: true },
          { id: 'hormigon', nombre: 'Tipo de Hormigón', tipo: 'select', opciones: ['H15', 'H20', 'H21', 'H25'], requerido: true },
          { id: 'acero', nombre: 'Acero', tipo: 'select', opciones: ['Ø6', 'Ø8', 'Ø10', 'Ø12'], requerido: true }
        ]
      },
      {
        id: 'zapatas',
        nombre: 'Zapatas',
        descripcion: 'Fundación tipo zapatas',
        configuraciones: [
          { id: 'dimensiones', nombre: 'Dimensiones', tipo: 'text', requerido: true },
          { id: 'hormigon', nombre: 'Tipo de Hormigón', tipo: 'select', opciones: ['H15', 'H20', 'H21', 'H25'], requerido: true },
          { id: 'acero', nombre: 'Acero', tipo: 'select', opciones: ['Ø8', 'Ø10', 'Ø12', 'Ø16'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'bases_hormigon',
    nombre: 'Bases de Hormigón Armado',
    categoria: 'Fundación y Estructura',
    icono: '🏛️',
    descripcion: 'Bases estructurales',
    opciones: [
      {
        id: 'base_aislada',
        nombre: 'Base Aislada',
        descripcion: 'Base individual para columnas',
        configuraciones: [
          { id: 'dimensiones', nombre: 'Dimensiones (LxAxH)', tipo: 'text', requerido: true },
          { id: 'hormigon', nombre: 'Tipo de Hormigón', tipo: 'select', opciones: ['H20', 'H21', 'H25', 'H30'], requerido: true },
          { id: 'acero', nombre: 'Acero', tipo: 'select', opciones: ['Ø10', 'Ø12', 'Ø16', 'Ø20'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'columnas',
    nombre: 'Columnas',
    categoria: 'Fundación y Estructura',
    icono: '🏗️',
    descripcion: 'Elementos verticales estructurales',
    opciones: [
      {
        id: 'hormigon_armado',
        nombre: 'Hormigón Armado',
        descripcion: 'Columnas de hormigón armado',
        configuraciones: [
          { id: 'seccion', nombre: 'Sección', tipo: 'select', opciones: ['20x20cm', '25x25cm', '30x30cm', '25x40cm', '30x40cm'], requerido: true },
          { id: 'hormigon', nombre: 'Tipo de Hormigón', tipo: 'select', opciones: ['H20', 'H21', 'H25', 'H30'], requerido: true },
          { id: 'acero_principal', nombre: 'Acero Principal', tipo: 'select', opciones: ['4Ø12', '4Ø16', '6Ø16', '8Ø16'], requerido: true },
          { id: 'estribos', nombre: 'Estribos', tipo: 'select', opciones: ['Ø6', 'Ø8'], requerido: true }
        ]
      },
      {
        id: 'metalicas',
        nombre: 'Metálicas',
        descripcion: 'Columnas de acero',
        configuraciones: [
          { id: 'perfil', nombre: 'Perfil', tipo: 'select', opciones: ['IPE', 'HEB', 'HSS'], requerido: true },
          { id: 'dimensiones', nombre: 'Dimensiones', tipo: 'text', requerido: true },
          { id: 'acero', nombre: 'Calidad de Acero', tipo: 'select', opciones: ['A36', 'A50', 'A572'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'vigas',
    nombre: 'Vigas',
    categoria: 'Fundación y Estructura',
    icono: '🏗️',
    descripcion: 'Elementos horizontales estructurales',
    opciones: [
      {
        id: 'hormigon_armado',
        nombre: 'Hormigón Armado',
        descripcion: 'Vigas de hormigón armado',
        configuraciones: [
          { id: 'seccion', nombre: 'Sección', tipo: 'select', opciones: ['20x30cm', '25x40cm', '30x50cm', '25x60cm'], requerido: true },
          { id: 'hormigon', nombre: 'Tipo de Hormigón', tipo: 'select', opciones: ['H20', 'H21', 'H25', 'H30'], requerido: true },
          { id: 'acero', nombre: 'Acero', tipo: 'select', opciones: ['2Ø12', '3Ø16', '4Ø16', '6Ø16'], requerido: true }
        ]
      },
      {
        id: 'metalicas',
        nombre: 'Metálicas',
        descripcion: 'Vigas de acero',
        configuraciones: [
          { id: 'perfil', nombre: 'Perfil', tipo: 'select', opciones: ['IPE', 'HEB', 'HSS'], requerido: true },
          { id: 'dimensiones', nombre: 'Dimensiones', tipo: 'text', requerido: true },
          { id: 'acero', nombre: 'Calidad de Acero', tipo: 'select', opciones: ['A36', 'A50', 'A572'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'losas',
    nombre: 'Losas',
    categoria: 'Fundación y Estructura',
    icono: '🏗️',
    descripcion: 'Elementos horizontales de cubierta',
    opciones: [
      {
        id: 'maciza',
        nombre: 'Maciza',
        descripcion: 'Losa de hormigón macizo',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['0.10m', '0.12m', '0.15m', '0.18m'], requerido: true },
          { id: 'hormigon', nombre: 'Tipo de Hormigón', tipo: 'select', opciones: ['H20', 'H21', 'H25'], requerido: true },
          { id: 'acero', nombre: 'Acero', tipo: 'select', opciones: ['Ø8', 'Ø10', 'Ø12'], requerido: true }
        ]
      },
      {
        id: 'alivianada',
        nombre: 'Alivianada',
        descripcion: 'Losa con elementos alivianadores',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['0.20m', '0.25m', '0.30m'], requerido: true },
          { id: 'elemento', nombre: 'Elemento Alivianador', tipo: 'select', opciones: ['Bovedilla cerámica', 'Bovedilla de hormigón', 'Polietileno'], requerido: true },
          { id: 'hormigon', nombre: 'Tipo de Hormigón', tipo: 'select', opciones: ['H20', 'H21', 'H25'], requerido: true }
        ]
      },
      {
        id: 'pretensada',
        nombre: 'Pretensada',
        descripcion: 'Losa pretensada',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['0.15m', '0.20m', '0.25m'], requerido: true },
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Prefabricada', 'In situ'], requerido: true },
          { id: 'hormigon', nombre: 'Tipo de Hormigón', tipo: 'select', opciones: ['H25', 'H30', 'H35'], requerido: true }
        ]
      }
    ]
  },

  // 2. MUROS Y CERRAMIENTOS
  {
    id: 'muros_exteriores_ladrillo_comun',
    nombre: 'Muros Exteriores - Ladrillo Común',
    categoria: 'Muros y Cerramientos',
    icono: '🧱',
    descripcion: 'Muros exteriores de ladrillo común',
    opciones: [
      {
        id: '15cm',
        nombre: '15 cm',
        descripcion: 'Muro de 15 cm de espesor',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['15 cm'], requerido: true },
          { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['Sin aislación', 'EPS 50mm', 'EPS 100mm', 'Lana de vidrio'], requerido: true },
          { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Revoque', 'Pintura', 'Piedra', 'Siding', 'Ladrillo visto'], requerido: true }
        ]
      },
      {
        id: '30cm',
        nombre: '30 cm',
        descripcion: 'Muro doble de 30 cm',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['30 cm'], requerido: true },
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Simple', 'Doble muro'], requerido: true },
          { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['Sin aislación', 'EPS 50mm', 'EPS 100mm', 'Lana de vidrio'], requerido: true },
          { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Revoque', 'Pintura', 'Piedra', 'Siding', 'Ladrillo visto'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'muros_exteriores_ceramico',
    nombre: 'Muros Exteriores - Ladrillo Cerámico',
    categoria: 'Muros y Cerramientos',
    icono: '🧱',
    descripcion: 'Muros exteriores de ladrillo cerámico hueco',
    opciones: [
      {
        id: '18cm',
        nombre: '18 cm',
        descripcion: 'Ladrillo cerámico 18 cm',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['18 cm'], requerido: true },
          { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['Sin aislación', 'EPS 50mm', 'EPS 100mm'], requerido: true },
          { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Revoque', 'Pintura', 'Piedra'], requerido: true }
        ]
      },
      {
        id: '20cm',
        nombre: '20 cm',
        descripcion: 'Ladrillo cerámico 20 cm',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['20 cm'], requerido: true },
          { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['Sin aislación', 'EPS 50mm', 'EPS 100mm'], requerido: true },
          { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Revoque', 'Pintura', 'Piedra'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'muros_interiores_tabiques',
    nombre: 'Muros Interiores - Tabiques',
    categoria: 'Muros y Cerramientos',
    icono: '🧱',
    descripcion: 'Tabiques interiores divisorios',
    opciones: [
      {
        id: 'ladrillo_8cm',
        nombre: 'Ladrillo Cerámico 8 cm',
        descripcion: 'Tabique de ladrillo cerámico 8 cm',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['8 cm'], requerido: true },
          { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Pintura', 'Revoque fino', 'Cerámico'], requerido: true }
        ]
      },
      {
        id: 'ladrillo_12cm',
        nombre: 'Ladrillo Cerámico 12 cm',
        descripcion: 'Tabique de ladrillo cerámico 12 cm',
        configuraciones: [
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['12 cm'], requerido: true },
          { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Pintura', 'Revoque fino', 'Cerámico'], requerido: true }
        ]
      },
      {
        id: 'durlock_simple',
        nombre: 'Durlock Simple',
        descripcion: 'Tabique de durlock placa simple',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Placa simple'], requerido: true },
          { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Pintura', 'Papel pintado'], requerido: true }
        ]
      },
      {
        id: 'durlock_doble',
        nombre: 'Durlock Doble',
        descripcion: 'Tabique de durlock placa doble',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Placa doble'], requerido: true },
          { id: 'aislacion_acustica', nombre: 'Aislación Acústica', tipo: 'checkbox', requerido: false },
          { id: 'terminacion', nombre: 'Terminación', tipo: 'select', opciones: ['Pintura', 'Papel pintado'], requerido: true }
        ]
      }
    ]
  },

  // 3. INSTALACIONES
  {
    id: 'instalacion_sanitaria',
    nombre: 'Instalación Sanitaria',
    categoria: 'Instalaciones',
    icono: '🚿',
    descripcion: 'Instalaciones sanitarias completas',
    opciones: [
      {
        id: 'banos_completos',
        nombre: 'Baños Completos',
        descripcion: 'Instalación de baños completos',
        configuraciones: [
          { id: 'cantidad_banos', nombre: 'Cantidad de Baños', tipo: 'select', opciones: ['1', '2', '3', '4+'], requerido: true },
          { id: 'cocina', nombre: 'Cocina', tipo: 'checkbox', requerido: false },
          { id: 'lavadero', nombre: 'Lavadero', tipo: 'checkbox', requerido: false }
        ]
      },
      {
        id: 'tanque_agua',
        nombre: 'Tanque de Agua',
        descripcion: 'Sistema de almacenamiento de agua',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Superior', 'Cisterna'], requerido: true },
          { id: 'capacidad', nombre: 'Capacidad', tipo: 'select', opciones: ['500L', '1000L', '1500L', '2000L'], requerido: true },
          { id: 'bomba_presurizadora', nombre: 'Bomba Presurizadora', tipo: 'checkbox', requerido: false }
        ]
      }
    ]
  },
  {
    id: 'instalacion_electrica',
    nombre: 'Instalación Eléctrica',
    categoria: 'Instalaciones',
    icono: '⚡',
    descripcion: 'Instalación eléctrica completa',
    opciones: [
      {
        id: 'residencial',
        nombre: 'Residencial',
        descripcion: 'Instalación eléctrica residencial',
        configuraciones: [
          { id: 'habitaciones', nombre: 'Cantidad de Habitaciones', tipo: 'select', opciones: ['1', '2', '3', '4', '5+'], requerido: true },
          { id: 'bocas_luz', nombre: 'Bocas de Luz', tipo: 'number', min: 5, max: 50, unidad: 'unidades', requerido: true },
          { id: 'tomas', nombre: 'Tomas de Corriente', tipo: 'number', min: 10, max: 100, unidad: 'unidades', requerido: true },
          { id: 'tablero', nombre: 'Tablero Principal', tipo: 'select', opciones: ['Monofásico', 'Trifásico'], requerido: true },
          { id: 'prevision_aa', nombre: 'Previsión Aire Acondicionado', tipo: 'checkbox', requerido: false },
          { id: 'iluminacion_exterior', nombre: 'Iluminación Exterior', tipo: 'checkbox', requerido: false }
        ]
      }
    ]
  },
  {
    id: 'instalacion_gas',
    nombre: 'Instalación de Gas',
    categoria: 'Instalaciones',
    icono: '🔥',
    descripcion: 'Instalación de gas natural',
    opciones: [
      {
        id: 'residencial',
        nombre: 'Residencial',
        descripcion: 'Instalación de gas residencial',
        configuraciones: [
          { id: 'cañerias', nombre: 'Cañerías', tipo: 'select', opciones: ['Hierro galvanizado', 'Polietileno'], requerido: true },
          { id: 'cocina', nombre: 'Cocina', tipo: 'checkbox', requerido: false },
          { id: 'calefactor', nombre: 'Calefactor', tipo: 'checkbox', requerido: false },
          { id: 'caldera', nombre: 'Caldera', tipo: 'checkbox', requerido: false }
        ]
      }
    ]
  },
  {
    id: 'instalacion_pluvial',
    nombre: 'Instalación Pluvial',
    categoria: 'Instalaciones',
    icono: '🌧️',
    descripcion: 'Sistema de desagües pluviales',
    opciones: [
      {
        id: 'completa',
        nombre: 'Sistema Completo',
        descripcion: 'Instalación pluvial completa',
        configuraciones: [
          { id: 'canaletas', nombre: 'Canaletas', tipo: 'select', opciones: ['PVC', 'Aluminio', 'Zinc'], requerido: true },
          { id: 'desagues_verticales', nombre: 'Desagües Verticales', tipo: 'number', min: 1, max: 10, unidad: 'unidades', requerido: true },
          { id: 'sumideros', nombre: 'Sumideros', tipo: 'number', min: 1, max: 20, unidad: 'unidades', requerido: true }
        ]
      }
    ]
  },
  {
    id: 'climatizacion',
    nombre: 'Climatización',
    categoria: 'Instalaciones',
    icono: '🌡️',
    descripcion: 'Sistemas de climatización',
    opciones: [
      {
        id: 'radiadores',
        nombre: 'Radiadores',
        descripcion: 'Sistema de calefacción por radiadores',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Hierro fundido', 'Aluminio', 'Acero'], requerido: true },
          { id: 'cantidad', nombre: 'Cantidad', tipo: 'number', min: 1, max: 20, unidad: 'unidades', requerido: true }
        ]
      },
      {
        id: 'piso_radiante',
        nombre: 'Piso Radiante',
        descripcion: 'Sistema de calefacción por piso radiante',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Agua', 'Eléctrico'], requerido: true },
          { id: 'superficie', nombre: 'Superficie', tipo: 'number', min: 10, max: 500, unidad: 'm²', requerido: true }
        ]
      },
      {
        id: 'splits',
        nombre: 'Splits',
        descripcion: 'Aire acondicionado tipo split',
        configuraciones: [
          { id: 'cantidad', nombre: 'Cantidad', tipo: 'number', min: 1, max: 10, unidad: 'unidades', requerido: true },
          { id: 'capacidad', nombre: 'Capacidad', tipo: 'select', opciones: ['3000 BTU', '4500 BTU', '6000 BTU', '9000 BTU'], requerido: true }
        ]
      }
    ]
  },

  // 4. CUBIERTAS
  {
    id: 'cubierta_plana',
    nombre: 'Cubierta Plana',
    categoria: 'Cubiertas',
    icono: '🏠',
    descripcion: 'Cubierta plana de hormigón',
    opciones: [
      {
        id: 'impermeabilizada',
        nombre: 'Impermeabilizada',
        descripcion: 'Cubierta con impermeabilización',
        configuraciones: [
          { id: 'material', nombre: 'Material', tipo: 'select', opciones: ['Membrana asfáltica', 'PVC', 'EPDM'], requerido: true },
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['10cm', '15cm', '20cm'], requerido: true }
        ]
      },
      {
        id: 'invertida',
        nombre: 'Invertida',
        descripcion: 'Cubierta invertida con aislación',
        configuraciones: [
          { id: 'aislacion', nombre: 'Aislación', tipo: 'select', opciones: ['EPS', 'Poliuretano', 'XPS'], requerido: true },
          { id: 'espesor', nombre: 'Espesor', tipo: 'select', opciones: ['10cm', '15cm', '20cm'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'cubierta_inclinada',
    nombre: 'Cubierta Inclinada',
    categoria: 'Cubiertas',
    icono: '🏘️',
    descripcion: 'Cubierta inclinada',
    opciones: [
      {
        id: '2_aguas',
        nombre: '2 Aguas',
        descripcion: 'Cubierta de dos aguas',
        configuraciones: [
          { id: 'material', nombre: 'Material', tipo: 'select', opciones: ['Teja cerámica', 'Teja de hormigón', 'Chapa'], requerido: true },
          { id: 'pendiente', nombre: 'Pendiente', tipo: 'select', opciones: ['15%', '25%', '35%'], requerido: true }
        ]
      },
      {
        id: '4_aguas',
        nombre: '4 Aguas',
        descripcion: 'Cubierta de cuatro aguas',
        configuraciones: [
          { id: 'material', nombre: 'Material', tipo: 'select', opciones: ['Teja', 'Chapa'], requerido: true },
          { id: 'pendiente', nombre: 'Pendiente', tipo: 'select', opciones: ['15%', '25%', '35%'], requerido: true }
        ]
      }
    ]
  },

  // 5. SUELOS / PISOS
  {
    id: 'contrapiso',
    nombre: 'Contrapiso',
    categoria: 'Suelos / Pisos',
    icono: '🏠',
    descripcion: 'Base de contrapiso y carpeta',
    opciones: [
      {
        id: 'base',
        nombre: 'Base + Carpeta',
        descripcion: 'Contrapiso base con carpeta',
        configuraciones: [
          { id: 'espesor_contrapiso', nombre: 'Espesor Contrapiso', tipo: 'select', opciones: ['5cm', '8cm', '10cm'], requerido: true },
          { id: 'espesor_carpeta', nombre: 'Espesor Carpeta', tipo: 'select', opciones: ['2cm', '3cm', '4cm'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'pisos_interiores',
    nombre: 'Pisos Interiores',
    categoria: 'Suelos / Pisos',
    icono: '🏠',
    descripcion: 'Pisos para interiores',
    opciones: [
      {
        id: 'ceramico',
        nombre: 'Cerámico',
        descripcion: 'Piso cerámico',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Cerámico', 'Porcelanato'], requerido: true },
          { id: 'dimensiones', nombre: 'Dimensiones', tipo: 'select', opciones: ['30x30cm', '45x45cm', '60x60cm'], requerido: true },
          { id: 'acabado', nombre: 'Acabado', tipo: 'select', opciones: ['Brillante', 'Mate', 'Rústico'], requerido: true }
        ]
      },
      {
        id: 'madera',
        nombre: 'Madera',
        descripcion: 'Piso de madera',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Parquet', 'Laminado', 'Flotante'], requerido: true },
          { id: 'acabado', nombre: 'Acabado', tipo: 'select', opciones: ['Natural', 'Lacado', 'Aceitado'], requerido: true }
        ]
      }
    ]
  },

  // 6. AMENITIES
  {
    id: 'parrilla',
    nombre: 'Parrilla',
    categoria: 'Amenities',
    icono: '🔥',
    descripcion: 'Parrilla para exteriores',
    opciones: [
      {
        id: 'refractaria',
        nombre: 'Refractaria',
        descripcion: 'Parrilla de material refractario',
        configuraciones: [
          { id: 'material', nombre: 'Material', tipo: 'select', opciones: ['Ladrillo refractario', 'Hormigón refractario'], requerido: true },
          { id: 'tamaño', nombre: 'Tamaño', tipo: 'select', opciones: ['Pequeña (60cm)', 'Mediana (80cm)', 'Grande (100cm)'], requerido: true }
        ]
      },
      {
        id: 'metalica',
        nombre: 'Metálica',
        descripcion: 'Parrilla metálica',
        configuraciones: [
          { id: 'material', nombre: 'Material', tipo: 'select', opciones: ['Acero inoxidable', 'Hierro'], requerido: true },
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Portátil', 'Fija'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'pileta',
    nombre: 'Pileta',
    categoria: 'Amenities',
    icono: '🏊',
    descripcion: 'Pileta de natación',
    opciones: [
      {
        id: 'hormigon',
        nombre: 'Hormigón',
        descripcion: 'Pileta de hormigón',
        configuraciones: [
          { id: 'dimensiones', nombre: 'Dimensiones', tipo: 'text', requerido: true },
          { id: 'profundidad', nombre: 'Profundidad', tipo: 'select', opciones: ['1.2m', '1.5m', '2.0m'], requerido: true },
          { id: 'revestimiento', nombre: 'Revestimiento', tipo: 'select', opciones: ['Mosaico', 'Pintura', 'Membrana'], requerido: true }
        ]
      },
      {
        id: 'fibra',
        nombre: 'Fibra',
        descripcion: 'Pileta de fibra de vidrio',
        configuraciones: [
          { id: 'tamaño', nombre: 'Tamaño', tipo: 'select', opciones: ['6x3m', '8x4m', '10x5m'], requerido: true },
          { id: 'profundidad', nombre: 'Profundidad', tipo: 'select', opciones: ['1.2m', '1.5m', '1.8m'], requerido: true }
        ]
      }
    ]
  },

  // 7. PARQUIZADO
  {
    id: 'cesped',
    nombre: 'Césped',
    categoria: 'Parquizado',
    icono: '🌱',
    descripcion: 'Césped para exteriores',
    opciones: [
      {
        id: 'natural',
        nombre: 'Natural',
        descripcion: 'Césped natural',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Bermuda', 'Kikuyo', 'Pasto inglés'], requerido: true },
          { id: 'superficie', nombre: 'Superficie', tipo: 'number', min: 10, max: 1000, unidad: 'm²', requerido: true }
        ]
      },
      {
        id: 'sintetico',
        nombre: 'Sintético',
        descripcion: 'Césped sintético',
        configuraciones: [
          { id: 'altura', nombre: 'Altura', tipo: 'select', opciones: ['20mm', '30mm', '40mm'], requerido: true },
          { id: 'superficie', nombre: 'Superficie', tipo: 'number', min: 10, max: 1000, unidad: 'm²', requerido: true }
        ]
      }
    ]
  },
  {
    id: 'vegetacion',
    nombre: 'Vegetación',
    categoria: 'Parquizado',
    icono: '🌳',
    descripcion: 'Plantas y árboles',
    opciones: [
      {
        id: 'arboles',
        nombre: 'Árboles',
        descripcion: 'Plantación de árboles',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Nativos', 'Exóticos', 'Frutales'], requerido: true },
          { id: 'cantidad', nombre: 'Cantidad', tipo: 'number', min: 1, max: 50, unidad: 'unidades', requerido: true }
        ]
      },
      {
        id: 'arbustos',
        nombre: 'Arbustos',
        descripcion: 'Plantación de arbustos',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Floreales', 'Verdes', 'Mixtos'], requerido: true },
          { id: 'cantidad', nombre: 'Cantidad', tipo: 'number', min: 1, max: 100, unidad: 'unidades', requerido: true }
        ]
      }
    ]
  },
  {
    id: 'senderos',
    nombre: 'Senderos',
    categoria: 'Parquizado',
    icono: '🛤️',
    descripcion: 'Caminos y senderos',
    opciones: [
      {
        id: 'piedra',
        nombre: 'Piedra',
        descripcion: 'Senderos de piedra',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Laja', 'Canto rodado', 'Adoquín'], requerido: true },
          { id: 'ancho', nombre: 'Ancho', tipo: 'select', opciones: ['60cm', '80cm', '100cm'], requerido: true }
        ]
      },
      {
        id: 'hormigon',
        nombre: 'Hormigón',
        descripcion: 'Senderos de hormigón',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['Alisado', 'Rayado', 'Estampado'], requerido: true },
          { id: 'ancho', nombre: 'Ancho', tipo: 'select', opciones: ['60cm', '80cm', '100cm'], requerido: true }
        ]
      }
    ]
  },
  {
    id: 'iluminacion_exterior',
    nombre: 'Iluminación Exterior',
    categoria: 'Parquizado',
    icono: '💡',
    descripcion: 'Sistema de iluminación exterior',
    opciones: [
      {
        id: 'balizas',
        nombre: 'Balizas',
        descripcion: 'Iluminación con balizas',
        configuraciones: [
          { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: ['LED', 'Halógena', 'Solar'], requerido: true },
          { id: 'cantidad', nombre: 'Cantidad', tipo: 'number', min: 1, max: 50, unidad: 'unidades', requerido: true }
        ]
      },
      {
        id: 'reflectores',
        nombre: 'Reflectores',
        descripcion: 'Iluminación con reflectores',
        configuraciones: [
          { id: 'potencia', nombre: 'Potencia', tipo: 'select', opciones: ['50W', '100W', '150W'], requerido: true },
          { id: 'cantidad', nombre: 'Cantidad', tipo: 'number', min: 1, max: 20, unidad: 'unidades', requerido: true }
        ]
      }
    ]
  }
];

// Función para obtener elementos por categoría
export function getElementosPorCategoria(categoria: string): ElementoConstructivo[] {
  return CATALOGO_ELEMENTOS.filter(elemento => elemento.categoria === categoria);
}

// Función para obtener todas las categorías
export function getCategorias(): string[] {
  return [...new Set(CATALOGO_ELEMENTOS.map(elemento => elemento.categoria))];
}
