export interface TareaConstructiva {
  id: string;
  nombre: string;
  unidad: string;
  coef_operativo: number;
  fase: 'estructura' | 'obra_gris' | 'terminaciones';
}

export const tareasConstructivas: TareaConstructiva[] = [
  {
    "id": "R00",
    "nombre": "Replanteo",
    "unidad": "unidad",
    "coef_operativo": 16.0,
    "fase": "estructura"
  },
  {
    "id": "D01",
    "nombre": "Excavación de bases",
    "unidad": "m3",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "D02",
    "nombre": "Excavación de pozo negro",
    "unidad": "5m",
    "coef_operativo": 72.0,
    "fase": "estructura"
  },
  {
    "id": "D03",
    "nombre": "Excavación de cimientos (40cm X 80 cm)",
    "unidad": "ml",
    "coef_operativo": 2.4,
    "fase": "estructura"
  },
  {
    "id": "D04",
    "nombre": "Demolición de paredes (15 cm)",
    "unidad": "m3",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "D05",
    "nombre": "Carga de escombros en volquetes (15 m)",
    "unidad": "m3",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "D06",
    "nombre": "Demolición de losas en P.B",
    "unidad": "m3",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "M01",
    "nombre": "Capa aisladora 3 hiladas en paredes de 30",
    "unidad": "ml",
    "coef_operativo": 2.4,
    "fase": "estructura"
  },
  {
    "id": "M02",
    "nombre": "Paredes de ladrillos comunes de 30 P.B",
    "unidad": "m2",
    "coef_operativo": 2.88,
    "fase": "estructura"
  },
  {
    "id": "M03",
    "nombre": "Paredes de ladrillos vistos de 30 P.B",
    "unidad": "m2",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "M04",
    "nombre": "Paredes de ladrillos comunes de 15 P.B",
    "unidad": "m2",
    "coef_operativo": 2.16,
    "fase": "estructura"
  },
  {
    "id": "M05",
    "nombre": "Paredes de ladrillos vistos de 15 P.B",
    "unidad": "m2",
    "coef_operativo": 2.88,
    "fase": "estructura"
  },
  {
    "id": "M06",
    "nombre": "Paredes de ladrillo hueco portante 13 y 18",
    "unidad": "m2",
    "coef_operativo": 2.4,
    "fase": "estructura"
  },
  {
    "id": "M07",
    "nombre": "Paredes de ladrillo hueco 8 y 12",
    "unidad": "m2",
    "coef_operativo": 2.4,
    "fase": "estructura"
  },
  {
    "id": "M08",
    "nombre": "Paredes de retak 20 x 25 x 50",
    "unidad": "m2",
    "coef_operativo": 2.88,
    "fase": "estructura"
  },
  {
    "id": "M09",
    "nombre": "Paredes de ladrillo de canto",
    "unidad": "m2",
    "coef_operativo": 2.88,
    "fase": "estructura"
  },
  {
    "id": "M10",
    "nombre": "Tomado de juntas de ladrillo visto",
    "unidad": "m2",
    "coef_operativo": 1.92,
    "fase": "estructura"
  },
  {
    "id": "M11",
    "nombre": "Paredes bajo mesada",
    "unidad": "un",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "M12",
    "nombre": "Mojinetes perimetral",
    "unidad": "ml",
    "coef_operativo": 2.4,
    "fase": "estructura"
  },
  {
    "id": "M13",
    "nombre": "Sardinel Visto",
    "unidad": "ml",
    "coef_operativo": 2.4,
    "fase": "estructura"
  },
  {
    "id": "M14",
    "nombre": "Parrillero completo",
    "unidad": "un",
    "coef_operativo": 72.0,
    "fase": "estructura"
  },
  {
    "id": "H01",
    "nombre": "Encadenado de 20 x 20",
    "unidad": "m³",
    "coef_operativo": 48.0,
    "fase": "estructura"
  },
  {
    "id": "H02",
    "nombre": "Bases",
    "unidad": "m3",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "H03",
    "nombre": "Losa maciza",
    "unidad": "m3",
    "coef_operativo": 48.0,
    "fase": "estructura"
  },
  {
    "id": "H04",
    "nombre": "Tabiques de 15 cm",
    "unidad": "m3",
    "coef_operativo": 48.0,
    "fase": "estructura"
  },
  {
    "id": "H05",
    "nombre": "Piso + fratachado",
    "unidad": "m2",
    "coef_operativo": 3.6,
    "fase": "estructura"
  },
  {
    "id": "H06",
    "nombre": "Columnas y vigas",
    "unidad": "m3",
    "coef_operativo": 48.0,
    "fase": "estructura"
  },
  {
    "id": "H07",
    "nombre": "Techo de viguetas en P.B",
    "unidad": "m2",
    "coef_operativo": 4.08,
    "fase": "estructura"
  },
  {
    "id": "H08",
    "nombre": "Escaleras de 16 escalones simples",
    "unidad": "un",
    "coef_operativo": 72.0,
    "fase": "estructura"
  },
  {
    "id": "H09",
    "nombre": "Albañal de hormigón armado 25x25",
    "unidad": "ml",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "H10",
    "nombre": "Base individual",
    "unidad": "un",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "H11",
    "nombre": "Viga de equilibrio encofrado",
    "unidad": "m3",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "S01",
    "nombre": "Tierra relleno y compactación",
    "unidad": "m3",
    "coef_operativo": 3.6,
    "fase": "estructura"
  },
  {
    "id": "S02",
    "nombre": "H° de pendiente (molido+carpeta+membrana)",
    "unidad": "m2",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "S03",
    "nombre": "Contra pisos",
    "unidad": "m2",
    "coef_operativo": 0.96,
    "fase": "estructura"
  },
  {
    "id": "S04",
    "nombre": "Carpeta 3x1",
    "unidad": "m2",
    "coef_operativo": 0.96,
    "fase": "estructura"
  },
  {
    "id": "S05",
    "nombre": "Banquinas c/carpeta",
    "unidad": "m2",
    "coef_operativo": 2.4,
    "fase": "estructura"
  },
  {
    "id": "S06",
    "nombre": "Barbetas perimetrales",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "S07",
    "nombre": "Juntas de dilatación y tomarlas",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "C01",
    "nombre": "Doblado de tejuelas",
    "unidad": "m2",
    "coef_operativo": 2.88,
    "fase": "estructura"
  },
  {
    "id": "C02",
    "nombre": "Techos de madera y teja francesa",
    "unidad": "m2",
    "coef_operativo": 9.6,
    "fase": "estructura"
  },
  {
    "id": "C03",
    "nombre": "Techos de madera y teja colonial",
    "unidad": "m2",
    "coef_operativo": 14.4,
    "fase": "estructura"
  },
  {
    "id": "C04",
    "nombre": "Techos de madera y chapa",
    "unidad": "m2",
    "coef_operativo": 3.6,
    "fase": "estructura"
  },
  {
    "id": "C05",
    "nombre": "Techos de estructura metálica y chapa",
    "unidad": "m2",
    "coef_operativo": 3.84,
    "fase": "estructura"
  },
  {
    "id": "C06",
    "nombre": "Colocar tejas solas",
    "unidad": "m2",
    "coef_operativo": 7.2,
    "fase": "estructura"
  },
  {
    "id": "C07",
    "nombre": "Colocar chapas solo",
    "unidad": "m2",
    "coef_operativo": 0.72,
    "fase": "estructura"
  },
  {
    "id": "C08",
    "nombre": "Entre piso de madera",
    "unidad": "m2",
    "coef_operativo": 2.88,
    "fase": "estructura"
  },
  {
    "id": "C09",
    "nombre": "Alero Con estructura madera y metal",
    "unidad": "m2",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "C10",
    "nombre": "Lucarnas",
    "unidad": "un",
    "coef_operativo": 72.0,
    "fase": "estructura"
  },
  {
    "id": "C11",
    "nombre": "Armado de cabreada",
    "unidad": "5 m",
    "coef_operativo": 48.0,
    "fase": "estructura"
  },
  {
    "id": "C12",
    "nombre": "Armado de viga doble o columna madera",
    "unidad": "un",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "C13",
    "nombre": "Armado de pergola columna y tirante",
    "unidad": "m2",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "C14",
    "nombre": "Armado de ménsula de madera o metálica",
    "unidad": "un",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "C15",
    "nombre": "Colocar zinguería",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "C16",
    "nombre": "Colocar columna prearmada",
    "unidad": "un",
    "coef_operativo": 4.8,
    "fase": "estructura"
  },
  {
    "id": "C17",
    "nombre": "Membrana en mojinete",
    "unidad": "ml",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "C18",
    "nombre": "Colocar membrana",
    "unidad": "x rollo",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "C19",
    "nombre": "Pintar pintura asfáltica",
    "unidad": "m²",
    "coef_operativo": 0.48,
    "fase": "estructura"
  },
  {
    "id": "C20",
    "nombre": "Pintar pintura techos",
    "unidad": "m²",
    "coef_operativo": 0.48,
    "fase": "estructura"
  },
  {
    "id": "C21",
    "nombre": "Colocar textil",
    "unidad": "x rollo",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "C22",
    "nombre": "pintar textil 4 manos",
    "unidad": "m²",
    "coef_operativo": 1.44,
    "fase": "estructura"
  },
  {
    "id": "R01",
    "nombre": "C/A vertical + Grueso + Fino",
    "unidad": "m2",
    "coef_operativo": 3.0,
    "fase": "obra_gris"
  },
  {
    "id": "R02",
    "nombre": "C/A vertical entre paredes",
    "unidad": "m2",
    "coef_operativo": 0.96,
    "fase": "obra_gris"
  },
  {
    "id": "R03",
    "nombre": "C/A vertical y Grueso",
    "unidad": "m2",
    "coef_operativo": 1.44,
    "fase": "obra_gris"
  },
  {
    "id": "R04",
    "nombre": "Grueso solo",
    "unidad": "m2",
    "coef_operativo": 1.44,
    "fase": "obra_gris"
  },
  {
    "id": "R05",
    "nombre": "Grueso y Fino",
    "unidad": "m2",
    "coef_operativo": 2.4,
    "fase": "obra_gris"
  },
  {
    "id": "R06",
    "nombre": "Material acrílico de frente",
    "unidad": "m2",
    "coef_operativo": 0.96,
    "fase": "obra_gris"
  },
  {
    "id": "R07",
    "nombre": "Enduido en yeso",
    "unidad": "m2",
    "coef_operativo": 0.72,
    "fase": "obra_gris"
  },
  {
    "id": "R08",
    "nombre": "Fino solo",
    "unidad": "m2",
    "coef_operativo": 0.72,
    "fase": "obra_gris"
  },
  {
    "id": "R09",
    "nombre": "Cantoneras de yeso",
    "unidad": "un",
    "coef_operativo": 3.6,
    "fase": "obra_gris"
  },
  {
    "id": "R10",
    "nombre": "Cielorraso aplicado en yeso",
    "unidad": "m2",
    "coef_operativo": 2.4,
    "fase": "obra_gris"
  },
  {
    "id": "R11",
    "nombre": "Fino a la cal",
    "unidad": "m2",
    "coef_operativo": 0.48,
    "fase": "obra_gris"
  },
  {
    "id": "R12",
    "nombre": "Cielorraso suspendido en yeso",
    "unidad": "m2",
    "coef_operativo": 3.36,
    "fase": "obra_gris"
  },
  {
    "id": "R13",
    "nombre": "Cielorraso suspendido en durlock",
    "unidad": "m2",
    "coef_operativo": 2.4,
    "fase": "obra_gris"
  },
  {
    "id": "EL01",
    "nombre": "Colocar caja reglamentaria en pared",
    "unidad": "un",
    "coef_operativo": 48.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL02",
    "nombre": "Pilar Con caja",
    "unidad": "un",
    "coef_operativo": 72.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL03",
    "nombre": "Colocar tablero general",
    "unidad": "un",
    "coef_operativo": 12.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL04",
    "nombre": "Cañerías de alimentación Canaletas y cajas",
    "unidad": "ml",
    "coef_operativo": 2.4,
    "fase": "obra_gris"
  },
  {
    "id": "EL05",
    "nombre": "Bocas de iluminación Cableado y cajas",
    "unidad": "u",
    "coef_operativo": 2.4,
    "fase": "obra_gris"
  },
  {
    "id": "EL06",
    "nombre": "Automatización flotante",
    "unidad": "un",
    "coef_operativo": 24.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL07",
    "nombre": "Tomas de Tv. Tel",
    "unidad": "u",
    "coef_operativo": 2.4,
    "fase": "obra_gris"
  },
  {
    "id": "EL08",
    "nombre": "Colocar cajas",
    "unidad": "u",
    "coef_operativo": 4.8,
    "fase": "obra_gris"
  },
  {
    "id": "PL01",
    "nombre": "Hacer excavacion y colocar biodigestor",
    "unidad": "u",
    "coef_operativo": 24.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL02",
    "nombre": "Excavar zanja y colocar caño 110",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "obra_gris"
  },
  {
    "id": "PL03",
    "nombre": "Camara 60 x 60",
    "unidad": "u",
    "coef_operativo": 12.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL04",
    "nombre": "Distribucion baño",
    "unidad": "u",
    "coef_operativo": 24.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL05",
    "nombre": "Distribucion cocina",
    "unidad": "u",
    "coef_operativo": 24.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL06",
    "nombre": "Drenaje con cama de piedra",
    "unidad": "u",
    "coef_operativo": 48.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL07",
    "nombre": "Cañeria 110 por piso o paredes",
    "unidad": "ml",
    "coef_operativo": 4.8,
    "fase": "obra_gris"
  },
  {
    "id": "PL08",
    "nombre": "Colocar cisterna enterrada 1000 l",
    "unidad": "u",
    "coef_operativo": 72.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL09",
    "nombre": "Hacer base tanque de reserva",
    "unidad": "u",
    "coef_operativo": 72.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL10",
    "nombre": "Colocar taque elevado",
    "unidad": "u",
    "coef_operativo": 12.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL11",
    "nombre": "Subida a tanque y bajada troncales",
    "unidad": "ml",
    "coef_operativo": 3.6,
    "fase": "obra_gris"
  },
  {
    "id": "PL12",
    "nombre": "Alimentacion a termotanque",
    "unidad": "ml",
    "coef_operativo": 3.6,
    "fase": "obra_gris"
  },
  {
    "id": "PL13",
    "nombre": "distribucion de baño/cocina lavadero",
    "unidad": "un",
    "coef_operativo": 24.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL14",
    "nombre": "Colocacion artefactos",
    "unidad": "C/u",
    "coef_operativo": 12.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL15",
    "nombre": "Colocacion bañera",
    "unidad": "u",
    "coef_operativo": 48.0,
    "fase": "obra_gris"
  },
  {
    "id": "TE01",
    "nombre": "Pisos Porcelanato sin zocales",
    "unidad": "m2",
    "coef_operativo": 2.4,
    "fase": "obra_gris"
  },
  {
    "id": "TE02",
    "nombre": "Baldosas Con cal",
    "unidad": "m2",
    "coef_operativo": 3.0,
    "fase": "obra_gris"
  },
  {
    "id": "TE03",
    "nombre": "Pisos flotantes con zocalos",
    "unidad": "m2",
    "coef_operativo": 2.88,
    "fase": "terminaciones"
  },
  {
    "id": "TE04",
    "nombre": "Revestimiento en pared sin guardas",
    "unidad": "m2",
    "coef_operativo": 4.8,
    "fase": "terminaciones"
  },
  {
    "id": "TE05",
    "nombre": "Colocar guardas",
    "unidad": "ml",
    "coef_operativo": 2.4,
    "fase": "terminaciones"
  },
  {
    "id": "TE06",
    "nombre": "Deck paredes",
    "unidad": "m2",
    "coef_operativo": 2.4,
    "fase": "terminaciones"
  },
  {
    "id": "TE07",
    "nombre": "Deck piso taco",
    "unidad": "m2",
    "coef_operativo": 3.6,
    "fase": "terminaciones"
  },
  {
    "id": "TE08",
    "nombre": "Zocalos con corte",
    "unidad": "ml",
    "coef_operativo": 1.2,
    "fase": "terminaciones"
  },
  {
    "id": "TE09",
    "nombre": "Colocar puertas placas",
    "unidad": "un",
    "coef_operativo": 7.2,
    "fase": "terminaciones"
  },
  {
    "id": "TE10",
    "nombre": "Colocar Ventanas o premarco",
    "unidad": "un",
    "coef_operativo": 7.2,
    "fase": "terminaciones"
  },
  {
    "id": "TE11",
    "nombre": "Colocar ventanas con Cortina enrollable",
    "unidad": "un",
    "coef_operativo": 12.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE12",
    "nombre": "Colocar Rejas amuradas",
    "unidad": "un",
    "coef_operativo": 14.4,
    "fase": "terminaciones"
  },
  {
    "id": "TE13",
    "nombre": "Colocar rejillas de ventilacion",
    "unidad": "un",
    "coef_operativo": 2.88,
    "fase": "terminaciones"
  },
  {
    "id": "TE14",
    "nombre": "Colocar mesada",
    "unidad": "un",
    "coef_operativo": 9.6,
    "fase": "terminaciones"
  },
  {
    "id": "TE15",
    "nombre": "Molduras en moldes",
    "unidad": "ml",
    "coef_operativo": 2.4,
    "fase": "terminaciones"
  },
  {
    "id": "TE16",
    "nombre": "Frisos perimetrales aberturas",
    "unidad": "ml",
    "coef_operativo": 2.4,
    "fase": "terminaciones"
  },
  {
    "id": "TE17",
    "nombre": "Colocar porton levadizo",
    "unidad": "un",
    "coef_operativo": 36.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE18",
    "nombre": "Reja planchuela perforada",
    "unidad": "m2",
    "coef_operativo": 7.2,
    "fase": "terminaciones"
  },
  {
    "id": "TE19",
    "nombre": "Llaves de rajaduras en paredes",
    "unidad": "u",
    "coef_operativo": 4.8,
    "fase": "terminaciones"
  },
  {
    "id": "TE20",
    "nombre": "Bloqueo de humedad en cimientos",
    "unidad": "ml",
    "coef_operativo": 4.8,
    "fase": "terminaciones"
  },
  {
    "id": "TE21",
    "nombre": "Picado de carpeta y contra piso",
    "unidad": "m2",
    "coef_operativo": 1.44,
    "fase": "terminaciones"
  },
  {
    "id": "TE22",
    "nombre": "Picado de revoque viejo",
    "unidad": "m2",
    "coef_operativo": 0.72,
    "fase": "terminaciones"
  },
  {
    "id": "TE23",
    "nombre": "Colocar perfiles picar y amurar",
    "unidad": "3 ml",
    "coef_operativo": 12.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE24",
    "nombre": "Pantalla armada",
    "unidad": "ml",
    "coef_operativo": 6.0,
    "fase": "terminaciones"
  },
  
  // Tareas adicionales por subgrupo - Replanteo (R)
  {
    "id": "R01",
    "nombre": "Replanteo de cimientos",
    "unidad": "ml",
    "coef_operativo": 0.8,
    "fase": "estructura"
  },
  {
    "id": "R02",
    "nombre": "Replanteo de columnas",
    "unidad": "unidad",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "R03",
    "nombre": "Replanteo de vigas",
    "unidad": "ml",
    "coef_operativo": 0.6,
    "fase": "estructura"
  },
  {
    "id": "R04",
    "nombre": "Replanteo de losas",
    "unidad": "m2",
    "coef_operativo": 0.4,
    "fase": "estructura"
  },
  {
    "id": "R05",
    "nombre": "Replanteo de escaleras",
    "unidad": "unidad",
    "coef_operativo": 2.0,
    "fase": "estructura"
  },
  {
    "id": "R06",
    "nombre": "Replanteo de instalaciones",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "obra_gris"
  },

  // Tareas adicionales por subgrupo - Demolición (D)
  {
    "id": "D07",
    "nombre": "Demolición de pisos",
    "unidad": "m2",
    "coef_operativo": 3.2,
    "fase": "estructura"
  },
  {
    "id": "D08",
    "nombre": "Demolición de techos",
    "unidad": "m2",
    "coef_operativo": 4.0,
    "fase": "estructura"
  },
  {
    "id": "D09",
    "nombre": "Demolición de baños",
    "unidad": "unidad",
    "coef_operativo": 8.0,
    "fase": "estructura"
  },
  {
    "id": "D10",
    "nombre": "Demolición de cocinas",
    "unidad": "unidad",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "D11",
    "nombre": "Demolición de escaleras",
    "unidad": "unidad",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "D12",
    "nombre": "Demolición de instalaciones",
    "unidad": "unidad",
    "coef_operativo": 5.0,
    "fase": "estructura"
  },

  // Tareas adicionales por subgrupo - Mampostería (M)
  {
    "id": "M15",
    "nombre": "Mampostería de chimeneas",
    "unidad": "unidad",
    "coef_operativo": 16.0,
    "fase": "estructura"
  },
  {
    "id": "M16",
    "nombre": "Mampostería de barbacoas",
    "unidad": "unidad",
    "coef_operativo": 20.0,
    "fase": "estructura"
  },
  {
    "id": "M17",
    "nombre": "Mampostería de jardineras",
    "unidad": "ml",
    "coef_operativo": 8.0,
    "fase": "estructura"
  },
  {
    "id": "M18",
    "nombre": "Mampostería de muros de contención",
    "unidad": "m2",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "M19",
    "nombre": "Mampostería de arcos",
    "unidad": "unidad",
    "coef_operativo": 24.0,
    "fase": "estructura"
  },
  {
    "id": "M20",
    "nombre": "Mampostería de pilares decorativos",
    "unidad": "unidad",
    "coef_operativo": 18.0,
    "fase": "estructura"
  },

  // Tareas adicionales por subgrupo - Hormigón (H)
  {
    "id": "H12",
    "nombre": "Hormigón de vigas pretensadas",
    "unidad": "ml",
    "coef_operativo": 8.0,
    "fase": "estructura"
  },
  {
    "id": "H13",
    "nombre": "Hormigón de losas alivianadas",
    "unidad": "m2",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "H14",
    "nombre": "Hormigón de escaleras helicoidales",
    "unidad": "unidad",
    "coef_operativo": 40.0,
    "fase": "estructura"
  },
  {
    "id": "H15",
    "nombre": "Hormigón de piscinas",
    "unidad": "m3",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "H16",
    "nombre": "Hormigón de tanques de agua",
    "unidad": "m3",
    "coef_operativo": 10.0,
    "fase": "estructura"
  },
  {
    "id": "H17",
    "nombre": "Hormigón de cunetas",
    "unidad": "ml",
    "coef_operativo": 3.0,
    "fase": "estructura"
  },

  // Tareas adicionales por subgrupo - Suelo (S)
  {
    "id": "S08",
    "nombre": "Compactación de suelo con rodillo",
    "unidad": "m2",
    "coef_operativo": 0.8,
    "fase": "estructura"
  },
  {
    "id": "S09",
    "nombre": "Nivelación de terreno",
    "unidad": "m2",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },
  {
    "id": "S10",
    "nombre": "Relleno con material seleccionado",
    "unidad": "m3",
    "coef_operativo": 2.0,
    "fase": "estructura"
  },
  {
    "id": "S11",
    "nombre": "Drenaje perimetral",
    "unidad": "ml",
    "coef_operativo": 4.0,
    "fase": "estructura"
  },
  {
    "id": "S12",
    "nombre": "Impermeabilización de suelo",
    "unidad": "m2",
    "coef_operativo": 3.0,
    "fase": "estructura"
  },
  {
    "id": "S13",
    "nombre": "Sellado de juntas de dilatación",
    "unidad": "ml",
    "coef_operativo": 2.5,
    "fase": "estructura"
  },

  // Tareas adicionales por subgrupo - Cubierta (C)
  {
    "id": "C20",
    "nombre": "Cubierta de tejas coloniales",
    "unidad": "m2",
    "coef_operativo": 8.0,
    "fase": "obra_gris"
  },
  {
    "id": "C21",
    "nombre": "Cubierta de chapa galvanizada",
    "unidad": "m2",
    "coef_operativo": 4.0,
    "fase": "obra_gris"
  },
  {
    "id": "C22",
    "nombre": "Cubierta de membranas asfálticas",
    "unidad": "m2",
    "coef_operativo": 6.0,
    "fase": "obra_gris"
  },
  {
    "id": "C23",
    "nombre": "Cubierta de policarbonato",
    "unidad": "m2",
    "coef_operativo": 5.0,
    "fase": "obra_gris"
  },
  {
    "id": "C24",
    "nombre": "Cubierta de zinc",
    "unidad": "m2",
    "coef_operativo": 3.5,
    "fase": "obra_gris"
  },
  {
    "id": "C25",
    "nombre": "Cubierta de pizarra",
    "unidad": "m2",
    "coef_operativo": 10.0,
    "fase": "obra_gris"
  },

  // Tareas adicionales por subgrupo - Revoque (RV)
  {
    "id": "RV01",
    "nombre": "Revoque grueso exterior",
    "unidad": "m2",
    "coef_operativo": 3.0,
    "fase": "obra_gris"
  },
  {
    "id": "RV02",
    "nombre": "Revoque fino exterior",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "obra_gris"
  },
  {
    "id": "RV03",
    "nombre": "Revoque grueso interior",
    "unidad": "m2",
    "coef_operativo": 2.5,
    "fase": "obra_gris"
  },
  {
    "id": "RV04",
    "nombre": "Revoque fino interior",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "obra_gris"
  },
  {
    "id": "RV05",
    "nombre": "Revoque de cielorrasos",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "obra_gris"
  },
  {
    "id": "RV06",
    "nombre": "Revoque de baños",
    "unidad": "m2",
    "coef_operativo": 3.5,
    "fase": "obra_gris"
  },

  // Tareas adicionales por subgrupo - Electricidad (EL)
  {
    "id": "EL01",
    "nombre": "Instalación de tablero principal",
    "unidad": "unidad",
    "coef_operativo": 8.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL02",
    "nombre": "Instalación de tomas de corriente",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "obra_gris"
  },
  {
    "id": "EL03",
    "nombre": "Instalación de interruptores",
    "unidad": "unidad",
    "coef_operativo": 1.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL04",
    "nombre": "Instalación de luminarias",
    "unidad": "unidad",
    "coef_operativo": 2.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL05",
    "nombre": "Instalación de cableado",
    "unidad": "ml",
    "coef_operativo": 0.5,
    "fase": "obra_gris"
  },
  {
    "id": "EL06",
    "nombre": "Instalación de sistema de puesta a tierra",
    "unidad": "unidad",
    "coef_operativo": 6.0,
    "fase": "obra_gris"
  },

  // Tareas adicionales por subgrupo - Plomería (PL)
  {
    "id": "PL01",
    "nombre": "Instalación de cañerías principales",
    "unidad": "ml",
    "coef_operativo": 3.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL02",
    "nombre": "Instalación de cañerías secundarias",
    "unidad": "ml",
    "coef_operativo": 2.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL03",
    "nombre": "Instalación de grifos",
    "unidad": "unidad",
    "coef_operativo": 2.5,
    "fase": "obra_gris"
  },
  {
    "id": "PL04",
    "nombre": "Instalación de inodoros",
    "unidad": "unidad",
    "coef_operativo": 4.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL05",
    "nombre": "Instalación de duchas",
    "unidad": "unidad",
    "coef_operativo": 3.5,
    "fase": "obra_gris"
  },
  {
    "id": "PL06",
    "nombre": "Instalación de calentadores",
    "unidad": "unidad",
    "coef_operativo": 6.0,
    "fase": "obra_gris"
  },

  // Tareas adicionales por subgrupo - Terminaciones (TE)
  {
    "id": "TE25",
    "nombre": "Pintura de exteriores",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE26",
    "nombre": "Pintura de interiores",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "terminaciones"
  },
  {
    "id": "TE27",
    "nombre": "Instalación de pisos de cerámica",
    "unidad": "m2",
    "coef_operativo": 4.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE28",
    "nombre": "Instalación de pisos de madera",
    "unidad": "m2",
    "coef_operativo": 6.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE29",
    "nombre": "Instalación de pisos de mármol",
    "unidad": "m2",
    "coef_operativo": 8.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE30",
    "nombre": "Instalación de molduras",
    "unidad": "ml",
    "coef_operativo": 2.5,
    "fase": "terminaciones"
  },

  // Segunda tanda de 70 tareas adicionales por subgrupo

  // Tareas adicionales Replanteo (R) - 7 más
  {
    "id": "R07",
    "nombre": "Replanteo de muros de contención",
    "unidad": "ml",
    "coef_operativo": 1.0,
    "fase": "estructura"
  },
  {
    "id": "R08",
    "nombre": "Replanteo de jardines",
    "unidad": "m2",
    "coef_operativo": 0.3,
    "fase": "estructura"
  },
  {
    "id": "R09",
    "nombre": "Replanteo de piscinas",
    "unidad": "unidad",
    "coef_operativo": 3.0,
    "fase": "estructura"
  },
  {
    "id": "R10",
    "nombre": "Replanteo de barbacoas",
    "unidad": "unidad",
    "coef_operativo": 2.0,
    "fase": "estructura"
  },
  {
    "id": "R11",
    "nombre": "Replanteo de chimeneas",
    "unidad": "unidad",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "R12",
    "nombre": "Replanteo de garajes",
    "unidad": "unidad",
    "coef_operativo": 2.5,
    "fase": "estructura"
  },
  {
    "id": "R13",
    "nombre": "Replanteo de terrazas",
    "unidad": "m2",
    "coef_operativo": 0.5,
    "fase": "estructura"
  },

  // Tareas adicionales Demolición (D) - 7 más
  {
    "id": "D13",
    "nombre": "Demolición de garajes",
    "unidad": "unidad",
    "coef_operativo": 15.0,
    "fase": "estructura"
  },
  {
    "id": "D14",
    "nombre": "Demolición de terrazas",
    "unidad": "m2",
    "coef_operativo": 2.5,
    "fase": "estructura"
  },
  {
    "id": "D15",
    "nombre": "Demolición de jardines",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "D16",
    "nombre": "Demolición de piscinas",
    "unidad": "unidad",
    "coef_operativo": 20.0,
    "fase": "estructura"
  },
  {
    "id": "D17",
    "nombre": "Demolición de barbacoas",
    "unidad": "unidad",
    "coef_operativo": 8.0,
    "fase": "estructura"
  },
  {
    "id": "D18",
    "nombre": "Demolición de chimeneas",
    "unidad": "unidad",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "D19",
    "nombre": "Demolición de muros perimetrales",
    "unidad": "ml",
    "coef_operativo": 3.0,
    "fase": "estructura"
  },

  // Tareas adicionales Mampostería (M) - 7 más
  {
    "id": "M21",
    "nombre": "Mampostería de muros de garaje",
    "unidad": "m2",
    "coef_operativo": 10.0,
    "fase": "estructura"
  },
  {
    "id": "M22",
    "nombre": "Mampostería de muros de terraza",
    "unidad": "ml",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "M23",
    "nombre": "Mampostería de muros de jardín",
    "unidad": "ml",
    "coef_operativo": 5.0,
    "fase": "estructura"
  },
  {
    "id": "M24",
    "nombre": "Mampostería de muros de piscina",
    "unidad": "m2",
    "coef_operativo": 15.0,
    "fase": "estructura"
  },
  {
    "id": "M25",
    "nombre": "Mampostería de muros de barbacoa",
    "unidad": "m2",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "M26",
    "nombre": "Mampostería de muros de chimenea",
    "unidad": "m2",
    "coef_operativo": 14.0,
    "fase": "estructura"
  },
  {
    "id": "M27",
    "nombre": "Mampostería de muros perimetrales",
    "unidad": "ml",
    "coef_operativo": 8.0,
    "fase": "estructura"
  },

  // Tareas adicionales Hormigón (H) - 7 más
  {
    "id": "H18",
    "nombre": "Hormigón de losas de garaje",
    "unidad": "m2",
    "coef_operativo": 5.0,
    "fase": "estructura"
  },
  {
    "id": "H19",
    "nombre": "Hormigón de losas de terraza",
    "unidad": "m2",
    "coef_operativo": 4.5,
    "fase": "estructura"
  },
  {
    "id": "H20",
    "nombre": "Hormigón de veredas",
    "unidad": "m2",
    "coef_operativo": 3.0,
    "fase": "estructura"
  },
  {
    "id": "H21",
    "nombre": "Hormigón de rampas",
    "unidad": "m2",
    "coef_operativo": 6.0,
    "fase": "estructura"
  },
  {
    "id": "H22",
    "nombre": "Hormigón de bordes de piscina",
    "unidad": "ml",
    "coef_operativo": 8.0,
    "fase": "estructura"
  },
  {
    "id": "H23",
    "nombre": "Hormigón de bases de barbacoa",
    "unidad": "unidad",
    "coef_operativo": 12.0,
    "fase": "estructura"
  },
  {
    "id": "H24",
    "nombre": "Hormigón de bases de chimenea",
    "unidad": "unidad",
    "coef_operativo": 10.0,
    "fase": "estructura"
  },

  // Tareas adicionales Suelo (S) - 7 más
  {
    "id": "S14",
    "nombre": "Preparación de suelo para jardín",
    "unidad": "m2",
    "coef_operativo": 1.5,
    "fase": "estructura"
  },
  {
    "id": "S15",
    "nombre": "Preparación de suelo para piscina",
    "unidad": "m2",
    "coef_operativo": 2.5,
    "fase": "estructura"
  },
  {
    "id": "S16",
    "nombre": "Preparación de suelo para terraza",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "estructura"
  },
  {
    "id": "S17",
    "nombre": "Preparación de suelo para garaje",
    "unidad": "m2",
    "coef_operativo": 1.8,
    "fase": "estructura"
  },
  {
    "id": "S18",
    "nombre": "Preparación de suelo para barbacoa",
    "unidad": "m2",
    "coef_operativo": 3.0,
    "fase": "estructura"
  },
  {
    "id": "S19",
    "nombre": "Preparación de suelo para chimenea",
    "unidad": "m2",
    "coef_operativo": 2.8,
    "fase": "estructura"
  },
  {
    "id": "S20",
    "nombre": "Preparación de suelo para veredas",
    "unidad": "m2",
    "coef_operativo": 1.2,
    "fase": "estructura"
  },

  // Tareas adicionales Cubierta (C) - 7 más
  {
    "id": "C26",
    "nombre": "Cubierta de garaje",
    "unidad": "m2",
    "coef_operativo": 3.5,
    "fase": "obra_gris"
  },
  {
    "id": "C27",
    "nombre": "Cubierta de terraza",
    "unidad": "m2",
    "coef_operativo": 4.5,
    "fase": "obra_gris"
  },
  {
    "id": "C28",
    "nombre": "Cubierta de quincho",
    "unidad": "m2",
    "coef_operativo": 5.0,
    "fase": "obra_gris"
  },
  {
    "id": "C29",
    "nombre": "Cubierta de galpón",
    "unidad": "m2",
    "coef_operativo": 3.0,
    "fase": "obra_gris"
  },
  {
    "id": "C30",
    "nombre": "Cubierta de pergola",
    "unidad": "m2",
    "coef_operativo": 6.0,
    "fase": "obra_gris"
  },
  {
    "id": "C31",
    "nombre": "Cubierta de galería",
    "unidad": "m2",
    "coef_operativo": 4.0,
    "fase": "obra_gris"
  },
  {
    "id": "C32",
    "nombre": "Cubierta de porche",
    "unidad": "m2",
    "coef_operativo": 5.5,
    "fase": "obra_gris"
  },

  // Tareas adicionales Revoque (RV) - 7 más
  {
    "id": "RV07",
    "nombre": "Revoque de garajes",
    "unidad": "m2",
    "coef_operativo": 2.5,
    "fase": "obra_gris"
  },
  {
    "id": "RV08",
    "nombre": "Revoque de terrazas",
    "unidad": "m2",
    "coef_operativo": 3.0,
    "fase": "obra_gris"
  },
  {
    "id": "RV09",
    "nombre": "Revoque de quinchos",
    "unidad": "m2",
    "coef_operativo": 3.5,
    "fase": "obra_gris"
  },
  {
    "id": "RV10",
    "nombre": "Revoque de galpones",
    "unidad": "m2",
    "coef_operativo": 2.0,
    "fase": "obra_gris"
  },
  {
    "id": "RV11",
    "nombre": "Revoque de pergolas",
    "unidad": "m2",
    "coef_operativo": 4.0,
    "fase": "obra_gris"
  },
  {
    "id": "RV12",
    "nombre": "Revoque de galerías",
    "unidad": "m2",
    "coef_operativo": 2.8,
    "fase": "obra_gris"
  },
  {
    "id": "RV13",
    "nombre": "Revoque de porches",
    "unidad": "m2",
    "coef_operativo": 3.2,
    "fase": "obra_gris"
  },

  // Tareas adicionales Electricidad (EL) - 7 más
  {
    "id": "EL07",
    "nombre": "Instalación eléctrica de garaje",
    "unidad": "unidad",
    "coef_operativo": 12.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL08",
    "nombre": "Instalación eléctrica de terraza",
    "unidad": "unidad",
    "coef_operativo": 8.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL09",
    "nombre": "Instalación eléctrica de quincho",
    "unidad": "unidad",
    "coef_operativo": 10.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL10",
    "nombre": "Instalación eléctrica de galpón",
    "unidad": "unidad",
    "coef_operativo": 6.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL11",
    "nombre": "Instalación eléctrica de pergola",
    "unidad": "unidad",
    "coef_operativo": 7.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL12",
    "nombre": "Instalación eléctrica de galería",
    "unidad": "unidad",
    "coef_operativo": 5.0,
    "fase": "obra_gris"
  },
  {
    "id": "EL13",
    "nombre": "Instalación eléctrica de porche",
    "unidad": "unidad",
    "coef_operativo": 6.5,
    "fase": "obra_gris"
  },

  // Tareas adicionales Plomería (PL) - 7 más
  {
    "id": "PL07",
    "nombre": "Instalación de plomería de garaje",
    "unidad": "unidad",
    "coef_operativo": 8.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL08",
    "nombre": "Instalación de plomería de terraza",
    "unidad": "unidad",
    "coef_operativo": 6.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL09",
    "nombre": "Instalación de plomería de quincho",
    "unidad": "unidad",
    "coef_operativo": 7.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL10",
    "nombre": "Instalación de plomería de galpón",
    "unidad": "unidad",
    "coef_operativo": 4.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL11",
    "nombre": "Instalación de plomería de pergola",
    "unidad": "unidad",
    "coef_operativo": 5.0,
    "fase": "obra_gris"
  },
  {
    "id": "PL12",
    "nombre": "Instalación de plomería de galería",
    "unidad": "unidad",
    "coef_operativo": 3.5,
    "fase": "obra_gris"
  },
  {
    "id": "PL13",
    "nombre": "Instalación de plomería de porche",
    "unidad": "unidad",
    "coef_operativo": 4.5,
    "fase": "obra_gris"
  },

  // Tareas adicionales Terminaciones (TE) - 7 más
  {
    "id": "TE31",
    "nombre": "Terminaciones de garaje",
    "unidad": "m2",
    "coef_operativo": 3.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE32",
    "nombre": "Terminaciones de terraza",
    "unidad": "m2",
    "coef_operativo": 4.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE33",
    "nombre": "Terminaciones de quincho",
    "unidad": "m2",
    "coef_operativo": 5.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE34",
    "nombre": "Terminaciones de galpón",
    "unidad": "m2",
    "coef_operativo": 2.5,
    "fase": "terminaciones"
  },
  {
    "id": "TE35",
    "nombre": "Terminaciones de pergola",
    "unidad": "m2",
    "coef_operativo": 6.0,
    "fase": "terminaciones"
  },
  {
    "id": "TE36",
    "nombre": "Terminaciones de galería",
    "unidad": "m2",
    "coef_operativo": 3.5,
    "fase": "terminaciones"
  },
  {
    "id": "TE37",
    "nombre": "Terminaciones de porche",
    "unidad": "m2",
    "coef_operativo": 4.5,
    "fase": "terminaciones"
  }
];

// Función helper para obtener tareas por fase
export const getTareasPorFase = (fase: 'estructura' | 'obra_gris' | 'terminaciones'): TareaConstructiva[] => {
  return tareasConstructivas.filter(tarea => tarea.fase === fase);
};

// Función helper para buscar tarea por ID
export const getTareaPorId = (id: string): TareaConstructiva | undefined => {
  return tareasConstructivas.find(tarea => tarea.id === id);
};
