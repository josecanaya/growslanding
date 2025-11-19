export interface TareaConstructiva {
  id: string;
  nombre: string;
  unidad: string;
  coef_operativo: number;
  fase: 'estructura' | 'obra_gris' | 'terminaciones';
}

export const tareasConstructivas: TareaConstructiva[] = [
  // REPLANTEOS
  {
    "id": "REP001",
    "nombre": "Replanteo general de obra",
    "unidad": "unidad",
    "coef_operativo": 16.0,
    "fase": "estructura"
  },
  {
    "id": "REP002",
    "nombre": "Replanteo de columnas",
    "unidad": "unidad",
    "coef_operativo": 8.0,
    "fase": "estructura"
  },
  {
    "id": "REP003",
    "nombre": "Replanteo de vigas",
    "unidad": "unidad",
    "coef_operativo": 8.0,
    "fase": "estructura"
  },
  {
    "id": "REP004",
    "nombre": "Replanteo de losas",
    "unidad": "unidad",
    "coef_operativo": 8.0,
    "fase": "estructura"
  },
  {
    "id": "REP010",
    "nombre": "Replanteo de pisos exteriores",
    "unidad": "unidad",
    "coef_operativo": 4.0,
    "fase": "terminaciones"
  },

  // DEMOLICIONES
  {
    "id": "DEM001",
    "nombre": "Demolición de paredes",
    "unidad": "m3",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "DEM002",
    "nombre": "Demolición de losas",
    "unidad": "m3",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },

  // SUELOS
  {
    "id": "SUE001",
    "nombre": "Compactación de suelo",
    "unidad": "m2",
    "coef_operativo": 0.2,
    "fase": "estructura"
  },
  {
    "id": "SUE002",
    "nombre": "Nivelación de suelo",
    "unidad": "m2",
    "coef_operativo": 0.3,
    "fase": "estructura"
  },
  {
    "id": "SUE003",
    "nombre": "Excavación de bases",
    "unidad": "m3",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "SUE004",
    "nombre": "Excavación mecánica",
    "unidad": "m3",
    "coef_operativo": 3.0,
    "fase": "estructura"
  },
  {
    "id": "SUE005",
    "nombre": "Contrapiso de hormigón",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "estructura"
  },
  {
    "id": "SUE006",
    "nombre": "Carpeta de nivelación",
    "unidad": "m2",
    "coef_operativo": 0.6,
    "fase": "obra_gris"
  },
  {
    "id": "SUE007",
    "nombre": "Aislamiento horizontal",
    "unidad": "m2",
    "coef_operativo": 0.3,
    "fase": "obra_gris"
  },

  // HORMIGONES
  {
    "id": "HOR001",
    "nombre": "Hormigón de cimientos",
    "unidad": "m3",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "HOR002",
    "nombre": "Hormigón de losa maciza",
    "unidad": "m3",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "HOR003",
    "nombre": "Hormigón de zapatas",
    "unidad": "m3",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "HOR004",
    "nombre": "Hormigón de bases HA",
    "unidad": "m3",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "HOR005",
    "nombre": "Hormigón de columnas y vigas",
    "unidad": "m3",
    "coef_operativo": 2.0,
    "fase": "estructura"
  },
  {
    "id": "HOR006",
    "nombre": "Hormigón losa alivianada - viguetas",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "estructura"
  },
  {
    "id": "HOR007",
    "nombre": "Hormigón losa alivianada - bovedillas",
    "unidad": "m2",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "HOR008",
    "nombre": "Hormigón losa pretensada",
    "unidad": "m2",
    "coef_operativo": 0.6,
    "fase": "estructura"
  },

  // NUEVAS TAREAS - COLUMNAS Y VIGAS METÁLICAS
  {
    "id": "NEW_COL001",
    "nombre": "Colocación de columna metálica",
    "unidad": "unidad",
    "coef_operativo": 4.0,
    "fase": "estructura"
  },
  {
    "id": "NEW_VIG001",
    "nombre": "Montaje de viga metálica",
    "unidad": "unidad",
    "coef_operativo": 3.0,
    "fase": "estructura"
  },

  // IMPERMEABILIZACIONES
  {
    "id": "NEW_IMP001",
    "nombre": "Impermeabilización de losa",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },

  // MUROS
  {
    "id": "MUR001",
    "nombre": "Mampostería ladrillo común 15cm",
    "unidad": "m2",
    "coef_operativo": 2.16,
    "fase": "estructura"
  },
  {
    "id": "MUR002",
    "nombre": "Mampostería ladrillo común 30cm",
    "unidad": "m2",
    "coef_operativo": 3.5,
    "fase": "estructura"
  },
  {
    "id": "MUR003",
    "nombre": "Mampostería ladrillo cerámico hueco",
    "unidad": "m2",
    "coef_operativo": 2.4,
    "fase": "estructura"
  },
  {
    "id": "MUR004",
    "nombre": "Mampostería tabiques cerámicos",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "estructura"
  },
  {
    "id": "MUR005",
    "nombre": "Mampostería bloque hormigón",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "estructura"
  },
  {
    "id": "MUR006",
    "nombre": "Mampostería Retak",
    "unidad": "m2",
    "coef_operativo": 1.8,
    "fase": "estructura"
  },

  // REVOQUES
  {
    "id": "REV001",
    "nombre": "Revoque grueso exterior",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },
  {
    "id": "REV002",
    "nombre": "Revoque fino exterior",
    "unidad": "m2",
    "coef_operativo": 0.6,
    "fase": "obra_gris"
  },
  {
    "id": "NEW_REV003",
    "nombre": "Revoque 3 en 1 (hidrófugo + grueso + fino)",
    "unidad": "m2",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "NEW_REV004",
    "nombre": "Revoque especial retak interior",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },

  // TERMINACIONES
  {
    "id": "TER001",
    "nombre": "Pintura exterior",
    "unidad": "m2",
    "coef_operativo": 0.4,
    "fase": "terminaciones"
  },
  {
    "id": "TER002",
    "nombre": "Pintura interior",
    "unidad": "m2",
    "coef_operativo": 0.4,
    "fase": "terminaciones"
  },
  {
    "id": "TER010",
    "nombre": "Piso cerámico interior",
    "unidad": "m2",
    "coef_operativo": 1.0,
    "fase": "terminaciones"
  },
  {
    "id": "TER011",
    "nombre": "Piso porcelanato interior",
    "unidad": "m2",
    "coef_operativo": 1.2,
    "fase": "terminaciones"
  },
  {
    "id": "TER012",
    "nombre": "Piso madera interior",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "terminaciones"
  },
  {
    "id": "TER013",
    "nombre": "Piso flotante interior",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "terminaciones"
  },
  {
    "id": "TER014",
    "nombre": "Microcemento interior",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "terminaciones"
  },
  {
    "id": "TER015",
    "nombre": "Piso antideslizante exterior",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "terminaciones"
  },
  {
    "id": "TER016",
    "nombre": "Deck madera exterior",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "terminaciones"
  },
  {
    "id": "TER017",
    "nombre": "Terminación deck madera",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "terminaciones"
  },
  {
    "id": "TER018",
    "nombre": "Revestimiento solárium",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "terminaciones"
  },
  {
    "id": "TER019",
    "nombre": "Terminación solárium",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "terminaciones"
  },

  // NUEVOS PISOS
  {
    "id": "NEW_PIS004",
    "nombre": "Revestimiento antideslizante",
    "unidad": "m2",
    "coef_operativo": 1.2,
    "fase": "terminaciones"
  },
  {
    "id": "NEW_PIS005",
    "nombre": "Montaje de deck WPC",
    "unidad": "m2",
    "coef_operativo": 1.8,
    "fase": "terminaciones"
  },

  // CUBIERTAS
  {
    "id": "CUB001",
    "nombre": "Estructura de cubierta",
    "unidad": "m2",
    "coef_operativo": 1.0,
    "fase": "estructura"
  },
  {
    "id": "CUB002",
    "nombre": "Cubierta plana HA",
    "unidad": "m2",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "CUB003",
    "nombre": "Estructura 2 aguas",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "CUB004",
    "nombre": "Cubierta 2 aguas",
    "unidad": "m2",
    "coef_operativo": 1.0,
    "fase": "obra_gris"
  },
  {
    "id": "CUB005",
    "nombre": "Cubierta industrial",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },
  {
    "id": "NEW_CUB006",
    "nombre": "Cubierta liviana policarbonato/vidrio",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "obra_gris"
  },

  // NUEVOS MUROS
  {
    "id": "NEW_MS001",
    "nombre": "Montaje de panel sándwich con aislación",
    "unidad": "m2",
    "coef_operativo": 1.8,
    "fase": "obra_gris"
  },
  {
    "id": "NEW_MC001",
    "nombre": "Colocación de muro cortina con DVH",
    "unidad": "m2",
    "coef_operativo": 2.5,
    "fase": "obra_gris"
  },

  // INSTALACIONES SANITARIAS
  {
    "id": "INS001",
    "nombre": "Instalación sanitaria baños",
    "unidad": "unidad",
    "coef_operativo": 8.0,
    "fase": "obra_gris"
  },
  {
    "id": "INS002",
    "nombre": "Instalación sanitaria cocina",
    "unidad": "unidad",
    "coef_operativo": 4.0,
    "fase": "obra_gris"
  },
  {
    "id": "INS003",
    "nombre": "Instalación sanitaria lavadero",
    "unidad": "unidad",
    "coef_operativo": 3.0,
    "fase": "obra_gris"
  },
  {
    "id": "INS004",
    "nombre": "Tanque de agua y bomba",
    "unidad": "unidad",
    "coef_operativo": 6.0,
    "fase": "obra_gris"
  },

  // INSTALACIONES ELÉCTRICAS
  {
    "id": "ELE001",
    "nombre": "Instalación eléctrica habitaciones",
    "unidad": "unidad",
    "coef_operativo": 2.0,
    "fase": "obra_gris"
  },
  {
    "id": "ELE002",
    "nombre": "Puntos de luz",
    "unidad": "unidad",
    "coef_operativo": 0.5,
    "fase": "obra_gris"
  },
  {
    "id": "ELE003",
    "nombre": "Tomas de corriente",
    "unidad": "unidad",
    "coef_operativo": 0.3,
    "fase": "obra_gris"
  },
  {
    "id": "ELE004",
    "nombre": "Tablero principal",
    "unidad": "unidad",
    "coef_operativo": 4.0,
    "fase": "obra_gris"
  },
  {
    "id": "ELE005",
    "nombre": "Preinstalación AC e iluminación exterior",
    "unidad": "unidad",
    "coef_operativo": 3.0,
    "fase": "obra_gris"
  },

  // INSTALACIONES GAS
  {
    "id": "GAS001",
    "nombre": "Cañerías de gas",
    "unidad": "ml",
    "coef_operativo": 1.0,
    "fase": "obra_gris"
  },
  {
    "id": "GAS002",
    "nombre": "Artefactos de gas",
    "unidad": "unidad",
    "coef_operativo": 2.0,
    "fase": "obra_gris"
  },
  {
    "id": "GAS003",
    "nombre": "Pruebas de gas",
    "unidad": "unidad",
    "coef_operativo": 1.0,
    "fase": "obra_gris"
  },

  // INSTALACIONES PLUVIALES
  {
    "id": "PLU001",
    "nombre": "Canaletas pluviales",
    "unidad": "ml",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },
  {
    "id": "PLU002",
    "nombre": "Bajadas pluviales",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "obra_gris"
  },

  // CLIMATIZACIÓN
  {
    "id": "CLI001",
    "nombre": "Radiadores",
    "unidad": "unidad",
    "coef_operativo": 2.0,
    "fase": "obra_gris"
  },
  {
    "id": "CLI002",
    "nombre": "Calefacción por losa",
    "unidad": "m2",
    "coef_operativo": 1.0,
    "fase": "obra_gris"
  },
  {
    "id": "CLI003",
    "nombre": "Splits",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "obra_gris"
  },

  // DURLOCK
  {
    "id": "RIG001",
    "nombre": "Estructura durlock",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },
  {
    "id": "DRY001",
    "nombre": "Placas durlock",
    "unidad": "m2",
    "coef_operativo": 0.6,
    "fase": "obra_gris"
  },
  {
    "id": "DRY002",
    "nombre": "Cinta y masilla durlock",
    "unidad": "m2",
    "coef_operativo": 0.4,
    "fase": "obra_gris"
  },
  {
    "id": "DRY003",
    "nombre": "Terminación durlock",
    "unidad": "m2",
    "coef_operativo": 0.6,
    "fase": "terminaciones"
  },

  // MANPOSTERÍA
  {
    "id": "MAN001",
    "nombre": "Mampostería de parrilla",
    "unidad": "m3",
    "coef_operativo": 3.0,
    "fase": "estructura"
  },
  {
    "id": "MAN002",
    "nombre": "Mampostería de quincho",
    "unidad": "m3",
    "coef_operativo": 2.5,
    "fase": "estructura"
  },

  // PILETAS
  {
    "id": "NEW_PIL001",
    "nombre": "Excavación pileta",
    "unidad": "m3",
    "coef_operativo": 4.0,
    "fase": "estructura"
  },
  {
    "id": "NEW_PIL002",
    "nombre": "Hormigón de pileta",
    "unidad": "m3",
    "coef_operativo": 2.0,
    "fase": "estructura"
  },
  {
    "id": "NEW_PIL003",
    "nombre": "Impermeabilización pileta",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "obra_gris"
  },

  // SOLÁRIUM
  {
    "id": "NEW_SOL001",
    "nombre": "Replanteo solárium",
    "unidad": "unidad",
    "coef_operativo": 2.0,
    "fase": "terminaciones"
  },

  // PARQUIZADO
  {
    "id": "PQT001",
    "nombre": "Preparación césped natural",
    "unidad": "m2",
    "coef_operativo": 0.5,
    "fase": "terminaciones"
  },
  {
    "id": "PQT002",
    "nombre": "Colocación césped sintético",
    "unidad": "m2",
    "coef_operativo": 1.0,
    "fase": "terminaciones"
  },
  {
    "id": "PQT003",
    "nombre": "Plantación árboles",
    "unidad": "unidad",
    "coef_operativo": 2.0,
    "fase": "terminaciones"
  },
  {
    "id": "PQT004",
    "nombre": "Plantación arbustos",
    "unidad": "unidad",
    "coef_operativo": 1.0,
    "fase": "terminaciones"
  },
  {
    "id": "PQT005",
    "nombre": "Senderos piedra",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "terminaciones"
  },
  {
    "id": "PQT006",
    "nombre": "Senderos hormigón",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "terminaciones"
  },
  {
    "id": "PQT007",
    "nombre": "Iluminación exterior LED",
    "unidad": "unidad",
    "coef_operativo": 1.0,
    "fase": "terminaciones"
  },
  {
    "id": "PQT008",
    "nombre": "Cableado iluminación exterior",
    "unidad": "ml",
    "coef_operativo": 0.3,
    "fase": "terminaciones"
  },
  {
    "id": "1RACA001",
    "nombre": "1ra capa placas",
    "unidad": "m2",
    "coef_operativo": 0.4,
    "fase": "terminaciones"
  },
  {
    "id": "2DACA001",
    "nombre": "2da capa base",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "2DALI001",
    "nombre": "2da lijada",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "AISAC001",
    "nombre": "Aislación acústica",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },
  {
    "id": "AISHI001",
    "nombre": "Aislación hidrófuga",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },
  {
    "id": "AISTE001",
    "nombre": "Aislación térmica",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },
  {
    "id": "AISXP001",
    "nombre": "Aislación XPS",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },
  {
    "id": "ALIME001",
    "nombre": "Alisado mecánico",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "ARMAD001",
    "nombre": "Armado",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "ASPER001",
    "nombre": "Aspersores",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "ATAFI001",
    "nombre": "Atado o fijación",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "BABET001",
    "nombre": "Babetas",
    "unidad": "ml",
    "coef_operativo": 0.8,
    "fase": "terminaciones"
  },
  {
    "id": "BARHU001",
    "nombre": "Barrera humedad",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "BARNI001",
    "nombre": "Barniz/laca",
    "unidad": "m2",
    "coef_operativo": 0.4,
    "fase": "terminaciones"
  },
  {
    "id": "BASCA001",
    "nombre": "Base cascajo",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "BOCAS001",
    "nombre": "Bocas",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "BOMAP001",
    "nombre": "Bomba (si aplica)",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CAB3X001",
    "nombre": "Cable 3x2.5mm²",
    "unidad": "ml",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CABAL001",
    "nombre": "Caballete",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CABIN001",
    "nombre": "Cableado interno",
    "unidad": "ml",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CAJEA001",
    "nombre": "Cajeado",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CAMAP001",
    "nombre": "Campana (si aplica)",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CAMAR001",
    "nombre": "Cama de arena",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CANAG001",
    "nombre": "Cañerías agua fría",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CANAL001",
    "nombre": "Cañería alimentación",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CANEL001",
    "nombre": "Cañería eléctrica",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CANPR001",
    "nombre": "Cañería principal agua fría",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CAPCO001",
    "nombre": "Capa de compresión",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CAPMI001",
    "nombre": "Capa micro",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CARCE001",
    "nombre": "Carpeta cemento",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CARGA001",
    "nombre": "Cargar",
    "unidad": "m3",
    "coef_operativo": 0.5,
    "fase": "obra_gris"
  },
  {
    "id": "CARGA002",
    "nombre": "Carga gas",
    "unidad": "m3",
    "coef_operativo": 0.5,
    "fase": "obra_gris"
  },
  {
    "id": "CARHI001",
    "nombre": "Carpeta hidrófuga",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CARVO001",
    "nombre": "Carga en volquete",
    "unidad": "m3",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "CERRA001",
    "nombre": "Cerramiento",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CLIFI001",
    "nombre": "Clips fijación",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "COLAI001",
    "nombre": "Colocar aislación (si aplica)",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "obra_gris"
  },
  {
    "id": "COLAL001",
    "nombre": "Colocación alivianamiento",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "COLAR001",
    "nombre": "Colocación armadura",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "COLBA001",
    "nombre": "Colocación baño químico",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "COLBO001",
    "nombre": "Colocación bovedillas",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "COLCA001",
    "nombre": "Colocación casilla",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "COLCA002",
    "nombre": "Colocación carpintería",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "COLES001",
    "nombre": "Colocación estribos",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CONAR001",
    "nombre": "Conexión artefactos",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "terminaciones"
  },
  {
    "id": "CONCA001",
    "nombre": "Conexión cañerías",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONCA002",
    "nombre": "Conexión canaleta superior",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONCA003",
    "nombre": "Construcción cámara combustión",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CONCI001",
    "nombre": "Construcción cisterna",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CONCO001",
    "nombre": "Conexión colectores",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONDE001",
    "nombre": "Conexión desagüe inferior",
    "unidad": "m2",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONDI001",
    "nombre": "Conexión disyuntores",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONEL001",
    "nombre": "Conexión eléctrica",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONEV001",
    "nombre": "Conducto evacuación",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CONFR001",
    "nombre": "Conexión frigorífica",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONLA001",
    "nombre": "Conexión lavarropas",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONLI001",
    "nombre": "Conexión a línea municipal",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONME001",
    "nombre": "Conexión medidor",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONMI001",
    "nombre": "Conexiones mínimas",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "CONPI001",
    "nombre": "Conexión pilar",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "CORDI001",
    "nombre": "Cortes dilatación",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CORRE001",
    "nombre": "Correas",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CORUN001",
    "nombre": "Corte y unión",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "CURAD001",
    "nombre": "Curado",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "DERIV001",
    "nombre": "Derivaciones",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "DESCL001",
    "nombre": "Desagües cloacales",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "DESCO001",
    "nombre": "Desagüe cocina",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "DESLA001",
    "nombre": "Desagüe lavadero",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "DESMA001",
    "nombre": "Desmalezado",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "DISSI001",
    "nombre": "Diseño sistema",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "ENCOF001",
    "nombre": "Encofrado",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "ESTME001",
    "nombre": "Estructura metálica",
    "unidad": "m2",
    "coef_operativo": 2,
    "fase": "estructura"
  },
  {
    "id": "ESTSO001",
    "nombre": "Estructura sombra (si aplica)",
    "unidad": "m2",
    "coef_operativo": 2,
    "fase": "estructura"
  },
  {
    "id": "EXTCE001",
    "nombre": "Extendido césped",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "FIJAC001",
    "nombre": "Fijaciones",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "FIJPA001",
    "nombre": "Fijación pared",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "FRATA001",
    "nombre": "Fratazado",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "FUNDA001",
    "nombre": "Fundación",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "GEOTE001",
    "nombre": "Geotextil",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "GRIFE001",
    "nombre": "Grifería",
    "unidad": "unidad",
    "coef_operativo": 0.8,
    "fase": "terminaciones"
  },
  {
    "id": "HIERR001",
    "nombre": "Hierros",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "HORMI001",
    "nombre": "Hormigonado",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "IDECI001",
    "nombre": "Identificación circuitos",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "ILUCE001",
    "nombre": "Iluminación cenital",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "IMPCA001",
    "nombre": "Impresión cartel",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "IMPRI001",
    "nombre": "Imprimación",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "INSCO001",
    "nombre": "Instalación contenedor",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "INSPA001",
    "nombre": "Instalación parrilla",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "INSTA001",
    "nombre": "Instalaciones",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "JUNES001",
    "nombre": "Juntar escombros",
    "unidad": "m3",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "LEVTA001",
    "nombre": "Levantar tabique",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "LIJAD001",
    "nombre": "Lijado",
    "unidad": "m2",
    "coef_operativo": 0.5,
    "fase": "terminaciones"
  },
  {
    "id": "LIMAT001",
    "nombre": "Limatesas",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "LIMPI001",
    "nombre": "Limpieza",
    "unidad": "unidad",
    "coef_operativo": 0.5,
    "fase": "obra_gris"
  },
  {
    "id": "LISTO001",
    "nombre": "Listones",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "LLATE001",
    "nombre": "Llave térmica dedicada",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "LLAVE001",
    "nombre": "Llaves",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "LLENA001",
    "nombre": "Llenado",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "LOSHO001",
    "nombre": "Losa hormigón",
    "unidad": "m3",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "MALAN001",
    "nombre": "Malla antimaleza",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "MALSU001",
    "nombre": "Malla superior",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "MANTE001",
    "nombre": "Mantenimiento",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "MASIL001",
    "nombre": "Masillado",
    "unidad": "m2",
    "coef_operativo": 0.6,
    "fase": "terminaciones"
  },
  {
    "id": "MON1R001",
    "nombre": "Montaje 1ra estructura",
    "unidad": "m2",
    "coef_operativo": 2,
    "fase": "estructura"
  },
  {
    "id": "MONES001",
    "nombre": "Montaje estructura soporte",
    "unidad": "m2",
    "coef_operativo": 2,
    "fase": "estructura"
  },
  {
    "id": "MONLU001",
    "nombre": "Montaje luminaria",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "MONTA001",
    "nombre": "Montaje tanque",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "MONUN001",
    "nombre": "Montaje unidad interior",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "MONVI001",
    "nombre": "Montaje viguetas",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "MULCH001",
    "nombre": "Mulching",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "NIVBA001",
    "nombre": "Nivelación base",
    "unidad": "m2",
    "coef_operativo": 0.5,
    "fase": "obra_gris"
  },
  {
    "id": "NIVSU001",
    "nombre": "Nivelación superficie",
    "unidad": "m2",
    "coef_operativo": 0.5,
    "fase": "obra_gris"
  },
  {
    "id": "NUETA001",
    "nombre": "Nueva tarea",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "ORIEN001",
    "nombre": "Orientación",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PASPA001",
    "nombre": "Pase pared",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PASTI001",
    "nombre": "Pastinado",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PEGAD001",
    "nombre": "Pegado adhesivo especial",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PEGCE001",
    "nombre": "Pegado cerámicos",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PENDI001",
    "nombre": "Pendientes",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PERFI001",
    "nombre": "Perfilería",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PISEL001",
    "nombre": "Piso elegido",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PLALA001",
    "nombre": "Placas lado 1",
    "unidad": "m2",
    "coef_operativo": 0.4,
    "fase": "terminaciones"
  },
  {
    "id": "PLAYA001",
    "nombre": "Playa/borde",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PREBA001",
    "nombre": "Preparación base",
    "unidad": "m2",
    "coef_operativo": 0.4,
    "fase": "obra_gris"
  },
  {
    "id": "PRESU001",
    "nombre": "Preparación superficie",
    "unidad": "m2",
    "coef_operativo": 0.4,
    "fase": "obra_gris"
  },
  {
    "id": "PRICO001",
    "nombre": "Primer corte",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PROGR001",
    "nombre": "Programación",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PROTE001",
    "nombre": "Protección",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PRUES001",
    "nombre": "Prueba estanqueidad",
    "unidad": "unidad",
    "coef_operativo": 0.3,
    "fase": "obra_gris"
  },
  {
    "id": "PRUHI001",
    "nombre": "Prueba hidráulica",
    "unidad": "unidad",
    "coef_operativo": 0.3,
    "fase": "obra_gris"
  },
  {
    "id": "PUEMA001",
    "nombre": "Puesta en marcha",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "PULAP001",
    "nombre": "Pulido (si aplica)",
    "unidad": "m2",
    "coef_operativo": 0.5,
    "fase": "terminaciones"
  },
  {
    "id": "PURGA001",
    "nombre": "Purgado",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "RASAP001",
    "nombre": "Rastreles (si aplica)",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "REBOS001",
    "nombre": "Rebose",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "REGUL001",
    "nombre": "Regulador",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "RELLE001",
    "nombre": "Relleno",
    "unidad": "m3",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "REMAT001",
    "nombre": "Remates",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "RETBA001",
    "nombre": "Retiro de basura",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "RETFI001",
    "nombre": "Retiro final",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "REVAP001",
    "nombre": "Revoque (si aplica)",
    "unidad": "m2",
    "coef_operativo": 0.7,
    "fase": "obra_gris"
  },
  {
    "id": "RIEIN001",
    "nombre": "Riego inicial",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "SELJU001",
    "nombre": "Sellado juntas",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "SELLA001",
    "nombre": "Sellador",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "SIEMB001",
    "nombre": "Siembra/panes",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "SOLDA001",
    "nombre": "Soldadura/bulonado",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "SOPOR001",
    "nombre": "Soportes",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "TAPA001",
    "nombre": "Tapa",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "TENSA001",
    "nombre": "Tensado",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "TIEPR001",
    "nombre": "Tierra preparada",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "TIEVE001",
    "nombre": "Tierra vegetal",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "TOMDE001",
    "nombre": "Toma dedicada",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "TRAAP001",
    "nombre": "Tratamiento (si aplica)",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "TRAPR001",
    "nombre": "Tratamiento protector",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "TRASL001",
    "nombre": "Traslado",
    "unidad": "unidad",
    "coef_operativo": 0.5,
    "fase": "obra_gris"
  },
  {
    "id": "TUTOR001",
    "nombre": "Tutor",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "UNION001",
    "nombre": "Uniones",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "VALVU001",
    "nombre": "Válvulas",
    "unidad": "unidad",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "VENTI001",
    "nombre": "Ventilación",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "VERIF001",
    "nombre": "Verificación",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "VIBRA001",
    "nombre": "Vibrado",
    "unidad": "m2",
    "coef_operativo": 1,
    "fase": "obra_gris"
  },
  {
    "id": "ZOCAL001",
    "nombre": "Zócalos",
    "unidad": "ml",
    "coef_operativo": 0.8,
    "fase": "terminaciones"
  }
];