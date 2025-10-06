export interface TareaElemento {
  id: string;
  nombre: string;
  unidad: string;
  coef_operativo: number;
  fase: 'estructura' | 'obra_gris' | 'terminaciones';
}

export interface ElementoConstructivo {
  id: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  tareas: TareaElemento[];
}

export const elementosConstructivos: ElementoConstructivo[] = [
  // 1. FUNDACIÓN Y ESTRUCTURA
  {
    id: "EXC_MAN001",
    nombre: "Excavación de fundación manual",
    categoria: "Fundación y Estructura",
    descripcion: "Excavación manual de fundaciones y cimientos",
    tareas: [
      { id: "REP001", nombre: "Replanteo general de obra", unidad: "unidad", coef_operativo: 16.0, fase: "estructura" },
      { id: "SUE003", nombre: "Excavación de bases", unidad: "m3", coef_operativo: 6.0, fase: "estructura" }
    ]
  },
  {
    id: "EXC_MEC001",
    nombre: "Excavación de fundación mecánica",
    categoria: "Fundación y Estructura",
    descripcion: "Excavación mecánica de fundaciones y cimientos",
    tareas: [
      { id: "REP001", nombre: "Replanteo general de obra", unidad: "unidad", coef_operativo: 16.0, fase: "estructura" },
      { id: "SUE004", nombre: "Excavación mecánica", unidad: "m3", coef_operativo: 3.0, fase: "estructura" }
    ]
  },
  {
    id: "HOR_PLA001",
    nombre: "Hormigón de fundación - Platea",
    categoria: "Fundación y Estructura",
    descripcion: "Platea de hormigón armado",
    tareas: [
      { id: "HOR001", nombre: "Hormigón de cimientos", unidad: "m3", coef_operativo: 1.2, fase: "estructura" },
      { id: "HOR002", nombre: "Hormigón de losa maciza", unidad: "m3", coef_operativo: 1.5, fase: "estructura" }
    ]
  },
  {
    id: "HOR_ZAP001",
    nombre: "Hormigón de fundación - Zapatas",
    categoria: "Fundación y Estructura",
    descripcion: "Zapatas de hormigón armado",
    tareas: [
      { id: "HOR001", nombre: "Hormigón de cimientos", unidad: "m3", coef_operativo: 1.2, fase: "estructura" },
      { id: "HOR003", nombre: "Hormigón de zapatas", unidad: "m3", coef_operativo: 1.2, fase: "estructura" }
    ]
  },
  {
    id: "BAS_HA001",
    nombre: "Bases de hormigón armado",
    categoria: "Fundación y Estructura",
    descripcion: "Bases de hormigón armado",
    tareas: [
      { id: "HOR004", nombre: "Hormigón de bases HA", unidad: "m3", coef_operativo: 1.2, fase: "estructura" }
    ]
  },
  {
    id: "COL_HA001",
    nombre: "Columnas de hormigón armado",
    categoria: "Fundación y Estructura",
    descripcion: "Columnas de hormigón armado",
    tareas: [
      { id: "REP002", nombre: "Replanteo de columnas", unidad: "unidad", coef_operativo: 8.0, fase: "estructura" },
      { id: "HOR005", nombre: "Hormigón de columnas y vigas", unidad: "m3", coef_operativo: 2.0, fase: "estructura" }
    ]
  },
  {
    id: "COL_MET001",
    nombre: "Columnas metálicas",
    categoria: "Fundación y Estructura",
    descripcion: "Columnas de acero estructural",
    tareas: [
      { id: "REP002", nombre: "Replanteo de columnas", unidad: "unidad", coef_operativo: 8.0, fase: "estructura" },
      { id: "MET001", nombre: "Montaje de estructura metálica", unidad: "kg", coef_operativo: 0.8, fase: "estructura" }
    ]
  },
  {
    id: "VIG_HA001",
    nombre: "Vigas de hormigón armado",
    categoria: "Fundación y Estructura",
    descripcion: "Vigas de hormigón armado",
    tareas: [
      { id: "HOR005", nombre: "Hormigón de columnas y vigas", unidad: "m3", coef_operativo: 2.0, fase: "estructura" }
    ]
  },
  {
    id: "VIG_MET001",
    nombre: "Vigas metálicas",
    categoria: "Fundación y Estructura",
    descripcion: "Vigas de acero estructural",
    tareas: [
      { id: "MET001", nombre: "Montaje de estructura metálica", unidad: "kg", coef_operativo: 0.8, fase: "estructura" }
    ]
  },
  {
    id: "LOS_MAC001",
    nombre: "Losas macizas",
    categoria: "Fundación y Estructura",
    descripcion: "Losas macizas de hormigón armado",
    tareas: [
      { id: "HOR002", nombre: "Hormigón de losa maciza", unidad: "m3", coef_operativo: 1.5, fase: "estructura" }
    ]
  },
  {
    id: "LOS_ALI001",
    nombre: "Losas alivianadas",
    categoria: "Fundación y Estructura",
    descripcion: "Losas alivianadas con viguetas",
    tareas: [
      { id: "HOR006", nombre: "Hormigón de losa alivianada", unidad: "m3", coef_operativo: 1.2, fase: "estructura" }
    ]
  },
  {
    id: "LOS_PRE001",
    nombre: "Losas pretensadas",
    categoria: "Fundación y Estructura",
    descripcion: "Losas pretensadas",
    tareas: [
      { id: "HOR007", nombre: "Hormigón de losa pretensada", unidad: "m3", coef_operativo: 1.0, fase: "estructura" }
    ]
  },

  // 2. MUROS Y CERRAMIENTOS
  // Muros Exteriores
  {
    id: "MUR_LAD15_001",
    nombre: "Muros exteriores - Ladrillo común 15cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de ladrillo común 15cm",
    tareas: [
      { id: "MUR001", nombre: "Mampostería de ladrillo común 15 cm", unidad: "m2", coef_operativo: 2.5, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_LAD30_001",
    nombre: "Muros exteriores - Ladrillo común 30cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de ladrillo común 30cm",
    tareas: [
      { id: "MUR002", nombre: "Mampostería de ladrillo común 30 cm", unidad: "m2", coef_operativo: 3.5, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_LAD_DOB001",
    nombre: "Muros exteriores - Ladrillo común doble muro",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de ladrillo común doble muro con cámara de aire",
    tareas: [
      { id: "MUR003", nombre: "Mampostería de ladrillo doble muro", unidad: "m2", coef_operativo: 5.0, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_LAD_CER18_001",
    nombre: "Muros exteriores - Ladrillo cerámico hueco 18cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de ladrillo cerámico hueco 18cm",
    tareas: [
      { id: "MUR004", nombre: "Mampostería de ladrillo cerámico 18 cm", unidad: "m2", coef_operativo: 2.0, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_LAD_CER20_001",
    nombre: "Muros exteriores - Ladrillo cerámico hueco 20cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de ladrillo cerámico hueco 20cm",
    tareas: [
      { id: "MUR005", nombre: "Mampostería de ladrillo cerámico 20 cm", unidad: "m2", coef_operativo: 2.2, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_BLO15_001",
    nombre: "Muros exteriores - Bloque hormigón 15cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de bloque de hormigón 15cm",
    tareas: [
      { id: "MUR006", nombre: "Mampostería de bloque hormigón 15 cm", unidad: "m2", coef_operativo: 1.8, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_BLO20_001",
    nombre: "Muros exteriores - Bloque hormigón 20cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de bloque de hormigón 20cm",
    tareas: [
      { id: "MUR007", nombre: "Mampostería de bloque hormigón 20 cm", unidad: "m2", coef_operativo: 2.0, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_BLO30_001",
    nombre: "Muros exteriores - Bloque hormigón 30cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de bloque de hormigón 30cm",
    tareas: [
      { id: "MUR008", nombre: "Mampostería de bloque hormigón 30 cm", unidad: "m2", coef_operativo: 2.8, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_RET15_001",
    nombre: "Muros exteriores - Retak/bloque celular 15cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de Retak/bloque celular 15cm",
    tareas: [
      { id: "MUR009", nombre: "Mampostería de bloque celular 15 cm", unidad: "m2", coef_operativo: 1.5, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_RET20_001",
    nombre: "Muros exteriores - Retak/bloque celular 20cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Muros exteriores de Retak/bloque celular 20cm",
    tareas: [
      { id: "MUR010", nombre: "Mampostería de bloque celular 20 cm", unidad: "m2", coef_operativo: 1.8, fase: "obra_gris" },
      { id: "REV001", nombre: "Revoque grueso y fino", unidad: "m2", coef_operativo: 1.8, fase: "terminaciones" }
    ]
  },
  {
    id: "MUR_PAN_SAN001",
    nombre: "Muros exteriores - Panel sándwich metálico",
    categoria: "Muros y Cerramientos",
    descripcion: "Panel sándwich metálico con aislación",
    tareas: [
      { id: "MET002", nombre: "Montaje de panel sándwich", unidad: "m2", coef_operativo: 0.8, fase: "obra_gris" }
    ]
  },
  {
    id: "MUR_COR_VID001",
    nombre: "Muros exteriores - Muro cortina de vidrio",
    categoria: "Muros y Cerramientos",
    descripcion: "Muro cortina de vidrio con DVH",
    tareas: [
      { id: "MET003", nombre: "Montaje de muro cortina", unidad: "m2", coef_operativo: 1.2, fase: "obra_gris" }
    ]
  },
  // Muros Interiores
  {
    id: "TAB_LAD8_001",
    nombre: "Tabiques interiores - Ladrillo cerámico 8cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Tabiques interiores de ladrillo cerámico 8cm",
    tareas: [
      { id: "TAB001", nombre: "Mampostería de tabique ladrillo 8 cm", unidad: "m2", coef_operativo: 1.5, fase: "obra_gris" },
      { id: "REV002", nombre: "Revoque fino", unidad: "m2", coef_operativo: 1.2, fase: "terminaciones" }
    ]
  },
  {
    id: "TAB_LAD12_001",
    nombre: "Tabiques interiores - Ladrillo cerámico 12cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Tabiques interiores de ladrillo cerámico 12cm",
    tareas: [
      { id: "TAB002", nombre: "Mampostería de tabique ladrillo 12 cm", unidad: "m2", coef_operativo: 2.0, fase: "obra_gris" },
      { id: "REV002", nombre: "Revoque fino", unidad: "m2", coef_operativo: 1.2, fase: "terminaciones" }
    ]
  },
  {
    id: "TAB_DUR_SIM001",
    nombre: "Tabiques interiores - Durlock placa simple",
    categoria: "Muros y Cerramientos",
    descripcion: "Tabiques interiores de durlock placa simple",
    tareas: [
      { id: "TAB003", nombre: "Montaje de durlock simple", unidad: "m2", coef_operativo: 0.8, fase: "obra_gris" }
    ]
  },
  {
    id: "TAB_DUR_DOB001",
    nombre: "Tabiques interiores - Durlock placa doble",
    categoria: "Muros y Cerramientos",
    descripcion: "Tabiques interiores de durlock placa doble",
    tareas: [
      { id: "TAB004", nombre: "Montaje de durlock doble", unidad: "m2", coef_operativo: 1.2, fase: "obra_gris" }
    ]
  },
  {
    id: "TAB_DUR_ACI001",
    nombre: "Tabiques interiores - Durlock con aislación acústica",
    categoria: "Muros y Cerramientos",
    descripcion: "Tabiques interiores de durlock con aislación acústica",
    tareas: [
      { id: "TAB005", nombre: "Montaje de durlock acústico", unidad: "m2", coef_operativo: 1.5, fase: "obra_gris" }
    ]
  },
  {
    id: "TAB_RET10_001",
    nombre: "Tabiques interiores - Retak 10cm",
    categoria: "Muros y Cerramientos",
    descripcion: "Tabiques interiores de Retak 10cm",
    tareas: [
      { id: "TAB006", nombre: "Mampostería de tabique Retak 10 cm", unidad: "m2", coef_operativo: 1.2, fase: "obra_gris" },
      { id: "REV002", nombre: "Revoque fino", unidad: "m2", coef_operativo: 1.2, fase: "terminaciones" }
    ]
  },

  // 3. INSTALACIONES
  {
    id: "PLO_SAN_1B001",
    nombre: "Instalación sanitaria - 1 baño",
    categoria: "Instalaciones",
    descripcion: "Instalación sanitaria completa para 1 baño + cocina + lavadero",
    tareas: [
      { id: "PLO001", nombre: "Instalación sanitaria", unidad: "unidad", coef_operativo: 8.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_SAN_2B001",
    nombre: "Instalación sanitaria - 2 baños",
    categoria: "Instalaciones",
    descripcion: "Instalación sanitaria completa para 2 baños + cocina + lavadero",
    tareas: [
      { id: "PLO002", nombre: "Instalación sanitaria 2 baños", unidad: "unidad", coef_operativo: 12.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_SAN_3B001",
    nombre: "Instalación sanitaria - 3 baños",
    categoria: "Instalaciones",
    descripcion: "Instalación sanitaria completa para 3 baños + cocina + lavadero",
    tareas: [
      { id: "PLO003", nombre: "Instalación sanitaria 3 baños", unidad: "unidad", coef_operativo: 16.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_SAN_TAN_SUP001",
    nombre: "Tanque de agua superior",
    categoria: "Instalaciones",
    descripcion: "Tanque de agua superior",
    tareas: [
      { id: "PLO004", nombre: "Instalación tanque superior", unidad: "unidad", coef_operativo: 4.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_SAN_TAN_CIS001",
    nombre: "Tanque de agua cisterna",
    categoria: "Instalaciones",
    descripcion: "Tanque de agua cisterna",
    tareas: [
      { id: "PLO005", nombre: "Instalación cisterna", unidad: "unidad", coef_operativo: 6.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_SAN_BOM_PRE001",
    nombre: "Bomba presurizadora",
    categoria: "Instalaciones",
    descripcion: "Bomba presurizadora de agua",
    tareas: [
      { id: "PLO006", nombre: "Instalación bomba presurizadora", unidad: "unidad", coef_operativo: 2.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_ELE_HAB001",
    nombre: "Instalación eléctrica por habitaciones",
    categoria: "Instalaciones",
    descripcion: "Instalación eléctrica según cantidad de habitaciones",
    tareas: [
      { id: "PLO007", nombre: "Instalación eléctrica", unidad: "unidad", coef_operativo: 10.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_ELE_BOC001",
    nombre: "Bocas de luz y tomas",
    categoria: "Instalaciones",
    descripcion: "Bocas de luz y tomas eléctricas",
    tareas: [
      { id: "PLO008", nombre: "Instalación bocas y tomas", unidad: "unidad", coef_operativo: 1.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_ELE_TAB001",
    nombre: "Tablero principal",
    categoria: "Instalaciones",
    descripcion: "Tablero principal eléctrico",
    tareas: [
      { id: "PLO009", nombre: "Instalación tablero principal", unidad: "unidad", coef_operativo: 3.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_ELE_PRE_AA001",
    nombre: "Previsión aire acondicionado",
    categoria: "Instalaciones",
    descripcion: "Previsión eléctrica para aire acondicionado",
    tareas: [
      { id: "PLO010", nombre: "Previsión AA", unidad: "unidad", coef_operativo: 2.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_ELE_ILU_EXT001",
    nombre: "Iluminación exterior",
    categoria: "Instalaciones",
    descripcion: "Iluminación exterior",
    tareas: [
      { id: "PLO011", nombre: "Instalación iluminación exterior", unidad: "unidad", coef_operativo: 4.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_GAS_CAÑ001",
    nombre: "Instalación de gas - Cañerías",
    categoria: "Instalaciones",
    descripcion: "Cañerías de gas + artefactos (cocina, calefactor, caldera)",
    tareas: [
      { id: "PLO012", nombre: "Instalación gas", unidad: "unidad", coef_operativo: 6.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_PLU_CAN001",
    nombre: "Instalación pluvial - Canaletas",
    categoria: "Instalaciones",
    descripcion: "Canaletas y desagües verticales",
    tareas: [
      { id: "PLO013", nombre: "Instalación pluvial", unidad: "unidad", coef_operativo: 3.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_CLI_RAD001",
    nombre: "Climatización - Radiadores",
    categoria: "Instalaciones",
    descripcion: "Sistema de radiadores",
    tareas: [
      { id: "PLO014", nombre: "Instalación radiadores", unidad: "unidad", coef_operativo: 4.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_CLI_PIS001",
    nombre: "Climatización - Piso radiante",
    categoria: "Instalaciones",
    descripcion: "Sistema de piso radiante",
    tareas: [
      { id: "PLO015", nombre: "Instalación piso radiante", unidad: "unidad", coef_operativo: 8.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PLO_CLI_SPL001",
    nombre: "Climatización - Splits",
    categoria: "Instalaciones",
    descripcion: "Sistema de splits",
    tareas: [
      { id: "PLO016", nombre: "Instalación splits", unidad: "unidad", coef_operativo: 3.0, fase: "obra_gris" }
    ]
  },

  // 4. CUBIERTAS
  {
    id: "CUB_PLA_IMP001",
    nombre: "Cubierta plana - Impermeabilizada",
    categoria: "Cubiertas",
    descripcion: "Cubierta plana de hormigón impermeabilizada",
    tareas: [
      { id: "CUB001", nombre: "Cubierta plana impermeabilizada", unidad: "m2", coef_operativo: 3.0, fase: "obra_gris" }
    ]
  },
  {
    id: "CUB_PLA_INV001",
    nombre: "Cubierta plana - Invertida",
    categoria: "Cubiertas",
    descripcion: "Cubierta plana de hormigón invertida",
    tareas: [
      { id: "CUB002", nombre: "Cubierta plana invertida", unidad: "m2", coef_operativo: 3.5, fase: "obra_gris" }
    ]
  },
  {
    id: "CUB_2A_TEJ_CER001",
    nombre: "Cubierta 2 aguas - Teja cerámica",
    categoria: "Cubiertas",
    descripcion: "Cubierta inclinada 2 aguas con teja cerámica",
    tareas: [
      { id: "CUB003", nombre: "Cubierta 2 aguas teja cerámica", unidad: "m2", coef_operativo: 2.5, fase: "obra_gris" }
    ]
  },
  {
    id: "CUB_2A_TEJ_HOR001",
    nombre: "Cubierta 2 aguas - Teja hormigón",
    categoria: "Cubiertas",
    descripcion: "Cubierta inclinada 2 aguas con teja de hormigón",
    tareas: [
      { id: "CUB004", nombre: "Cubierta 2 aguas teja hormigón", unidad: "m2", coef_operativo: 2.2, fase: "obra_gris" }
    ]
  },
  {
    id: "CUB_2A_CHA001",
    nombre: "Cubierta 2 aguas - Chapa",
    categoria: "Cubiertas",
    descripcion: "Cubierta inclinada 2 aguas con chapa",
    tareas: [
      { id: "CUB005", nombre: "Cubierta 2 aguas chapa", unidad: "m2", coef_operativo: 1.8, fase: "obra_gris" }
    ]
  },
  {
    id: "CUB_4A_TEJ001",
    nombre: "Cubierta 4 aguas - Teja",
    categoria: "Cubiertas",
    descripcion: "Cubierta inclinada 4 aguas con teja",
    tareas: [
      { id: "CUB006", nombre: "Cubierta 4 aguas teja", unidad: "m2", coef_operativo: 3.0, fase: "obra_gris" }
    ]
  },
  {
    id: "CUB_4A_CHA001",
    nombre: "Cubierta 4 aguas - Chapa",
    categoria: "Cubiertas",
    descripcion: "Cubierta inclinada 4 aguas con chapa",
    tareas: [
      { id: "CUB007", nombre: "Cubierta 4 aguas chapa", unidad: "m2", coef_operativo: 2.5, fase: "obra_gris" }
    ]
  },
  {
    id: "CUB_IND_DIE001",
    nombre: "Cubierta industrial - Diente de sierra",
    categoria: "Cubiertas",
    descripcion: "Cubierta industrial diente de sierra",
    tareas: [
      { id: "CUB008", nombre: "Cubierta industrial diente sierra", unidad: "m2", coef_operativo: 2.0, fase: "obra_gris" }
    ]
  },
  {
    id: "CUB_LIV_POL001",
    nombre: "Cubierta liviana - Policarbonato",
    categoria: "Cubiertas",
    descripcion: "Cubierta liviana de policarbonato",
    tareas: [
      { id: "CUB009", nombre: "Cubierta liviana policarbonato", unidad: "m2", coef_operativo: 1.5, fase: "obra_gris" }
    ]
  },
  {
    id: "CUB_LIV_VID001",
    nombre: "Cubierta liviana - Vidrio",
    categoria: "Cubiertas",
    descripcion: "Cubierta liviana de vidrio",
    tareas: [
      { id: "CUB010", nombre: "Cubierta liviana vidrio", unidad: "m2", coef_operativo: 3.5, fase: "obra_gris" }
    ]
  },

  // 5. SUELOS / PISOS
  {
    id: "PIS_BAS_CON001",
    nombre: "Pisos - Base contrapiso + carpeta",
    categoria: "Suelos / Pisos",
    descripcion: "Base de contrapiso + carpeta",
    tareas: [
      { id: "PIS001", nombre: "Contrapiso y carpeta", unidad: "m2", coef_operativo: 2.0, fase: "obra_gris" }
    ]
  },
  {
    id: "PIS_INT_CER001",
    nombre: "Pisos interiores - Cerámico",
    categoria: "Suelos / Pisos",
    descripcion: "Pisos interiores de cerámico",
    tareas: [
      { id: "PIS002", nombre: "Piso cerámico", unidad: "m2", coef_operativo: 3.0, fase: "terminaciones" }
    ]
  },
  {
    id: "PIS_INT_POR001",
    nombre: "Pisos interiores - Porcelanato",
    categoria: "Suelos / Pisos",
    descripcion: "Pisos interiores de porcelanato",
    tareas: [
      { id: "PIS003", nombre: "Piso porcelanato", unidad: "m2", coef_operativo: 3.5, fase: "terminaciones" }
    ]
  },
  {
    id: "PIS_INT_MAD001",
    nombre: "Pisos interiores - Madera",
    categoria: "Suelos / Pisos",
    descripcion: "Pisos interiores de madera",
    tareas: [
      { id: "PIS004", nombre: "Piso madera", unidad: "m2", coef_operativo: 4.0, fase: "terminaciones" }
    ]
  },
  {
    id: "PIS_INT_FLO001",
    nombre: "Pisos interiores - Flotante",
    categoria: "Suelos / Pisos",
    descripcion: "Pisos interiores flotantes",
    tareas: [
      { id: "PIS005", nombre: "Piso flotante", unidad: "m2", coef_operativo: 2.5, fase: "terminaciones" }
    ]
  },
  {
    id: "PIS_INT_MIC001",
    nombre: "Pisos interiores - Microcemento",
    categoria: "Suelos / Pisos",
    descripcion: "Pisos interiores de microcemento",
    tareas: [
      { id: "PIS006", nombre: "Piso microcemento", unidad: "m2", coef_operativo: 5.0, fase: "terminaciones" }
    ]
  },
  {
    id: "PIS_INT_HOR001",
    nombre: "Pisos interiores - Hormigón alisado",
    categoria: "Suelos / Pisos",
    descripcion: "Pisos interiores de hormigón alisado",
    tareas: [
      { id: "PIS007", nombre: "Piso hormigón alisado", unidad: "m2", coef_operativo: 3.5, fase: "terminaciones" }
    ]
  },
  {
    id: "PIS_EXT_ANT001",
    nombre: "Pisos exteriores - Antideslizante",
    categoria: "Suelos / Pisos",
    descripcion: "Pisos exteriores antideslizantes",
    tareas: [
      { id: "PIS008", nombre: "Piso antideslizante exterior", unidad: "m2", coef_operativo: 3.0, fase: "terminaciones" }
    ]
  },
  {
    id: "PIS_EXT_DECK_MAD001",
    nombre: "Pisos exteriores - Deck madera",
    categoria: "Suelos / Pisos",
    descripcion: "Pisos exteriores deck de madera",
    tareas: [
      { id: "PIS009", nombre: "Deck madera exterior", unidad: "m2", coef_operativo: 4.5, fase: "terminaciones" }
    ]
  },
  {
    id: "PIS_EXT_DECK_WPC001",
    nombre: "Pisos exteriores - Deck WPC",
    categoria: "Suelos / Pisos",
    descripcion: "Pisos exteriores deck de WPC",
    tareas: [
      { id: "PIS010", nombre: "Deck WPC exterior", unidad: "m2", coef_operativo: 3.5, fase: "terminaciones" }
    ]
  },

  // 6. AMENITIES
  {
    id: "AME_PAR_REF001",
    nombre: "Parrilla refractaria",
    categoria: "Amenities",
    descripcion: "Parrilla refractaria",
    tareas: [
      { id: "AME001", nombre: "Construcción parrilla refractaria", unidad: "unidad", coef_operativo: 8.0, fase: "terminaciones" }
    ]
  },
  {
    id: "AME_PAR_MET001",
    nombre: "Parrilla metálica",
    categoria: "Amenities",
    descripcion: "Parrilla metálica",
    tareas: [
      { id: "AME002", nombre: "Instalación parrilla metálica", unidad: "unidad", coef_operativo: 3.0, fase: "terminaciones" }
    ]
  },
  {
    id: "AME_QUI_EST_MET001",
    nombre: "Quincho/galería - Estructura metálica",
    categoria: "Amenities",
    descripcion: "Quincho/galería cubierta con estructura metálica",
    tareas: [
      { id: "AME003", nombre: "Quincho estructura metálica", unidad: "unidad", coef_operativo: 6.0, fase: "obra_gris" }
    ]
  },
  {
    id: "AME_QUI_EST_MAD001",
    nombre: "Quincho/galería - Estructura madera",
    categoria: "Amenities",
    descripcion: "Quincho/galería cubierta con estructura de madera",
    tareas: [
      { id: "AME004", nombre: "Quincho estructura madera", unidad: "unidad", coef_operativo: 5.0, fase: "obra_gris" }
    ]
  },
  {
    id: "AME_PIL_HOR001",
    nombre: "Pileta - Hormigón",
    categoria: "Amenities",
    descripcion: "Pileta de hormigón",
    tareas: [
      { id: "AME005", nombre: "Construcción pileta hormigón", unidad: "unidad", coef_operativo: 12.0, fase: "obra_gris" }
    ]
  },
  {
    id: "AME_PIL_FIB001",
    nombre: "Pileta - Fibra",
    categoria: "Amenities",
    descripcion: "Pileta de fibra",
    tareas: [
      { id: "AME006", nombre: "Instalación pileta fibra", unidad: "unidad", coef_operativo: 4.0, fase: "obra_gris" }
    ]
  },
  {
    id: "AME_SOL_ATE001",
    nombre: "Solárium - Piso atérmico",
    categoria: "Amenities",
    descripcion: "Solárium con piso atérmico",
    tareas: [
      { id: "AME007", nombre: "Solárium piso atérmico", unidad: "m2", coef_operativo: 3.0, fase: "terminaciones" }
    ]
  },
  {
    id: "AME_SOL_DECK001",
    nombre: "Solárium - Deck",
    categoria: "Amenities",
    descripcion: "Solárium con deck",
    tareas: [
      { id: "AME008", nombre: "Solárium deck", unidad: "m2", coef_operativo: 4.0, fase: "terminaciones" }
    ]
  },

  // 7. PARQUIZADO
  {
    id: "PAR_CES_NAT001",
    nombre: "Parquizado - Césped natural",
    categoria: "Parquizado",
    descripcion: "Parquizado con césped natural",
    tareas: [
      { id: "PAR001", nombre: "Parquizado césped natural", unidad: "m2", coef_operativo: 2.0, fase: "terminaciones" }
    ]
  },
  {
    id: "PAR_CES_SIN001",
    nombre: "Parquizado - Césped sintético",
    categoria: "Parquizado",
    descripcion: "Parquizado con césped sintético",
    tareas: [
      { id: "PAR002", nombre: "Parquizado césped sintético", unidad: "m2", coef_operativo: 3.0, fase: "terminaciones" }
    ]
  },
  {
    id: "PAR_VEG_ARB001",
    nombre: "Parquizado - Vegetación (árboles, arbustos)",
    categoria: "Parquizado",
    descripcion: "Parquizado con vegetación (árboles, arbustos)",
    tareas: [
      { id: "PAR003", nombre: "Parquizado vegetación", unidad: "unidad", coef_operativo: 1.0, fase: "terminaciones" }
    ]
  },
  {
    id: "PAR_SEN_PIE001",
    nombre: "Parquizado - Senderos piedra",
    categoria: "Parquizado",
    descripcion: "Senderos de piedra",
    tareas: [
      { id: "PAR004", nombre: "Senderos piedra", unidad: "m2", coef_operativo: 4.0, fase: "terminaciones" }
    ]
  },
  {
    id: "PAR_SEN_HOR001",
    nombre: "Parquizado - Senderos hormigón",
    categoria: "Parquizado",
    descripcion: "Senderos de hormigón",
    tareas: [
      { id: "PAR005", nombre: "Senderos hormigón", unidad: "m2", coef_operativo: 2.5, fase: "terminaciones" }
    ]
  },
  {
    id: "PAR_ILU_BAL001",
    nombre: "Parquizado - Iluminación balizas",
    categoria: "Parquizado",
    descripcion: "Iluminación exterior con balizas",
    tareas: [
      { id: "PAR006", nombre: "Iluminación balizas", unidad: "unidad", coef_operativo: 1.5, fase: "terminaciones" }
    ]
  },
  {
    id: "PAR_ILU_REF001",
    nombre: "Parquizado - Iluminación reflectores",
    categoria: "Parquizado",
    descripcion: "Iluminación exterior con reflectores",
    tareas: [
      { id: "PAR007", nombre: "Iluminación reflectores", unidad: "unidad", coef_operativo: 2.0, fase: "terminaciones" }
    ]
  }
];
