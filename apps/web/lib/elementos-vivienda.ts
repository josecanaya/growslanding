interface Fases {
  estructura: string[];
  obra_gris: string[];
  terminaciones: string[];
}

interface TipoElemento {
  nombre: string;
  fases: Fases;
}

interface Elemento {
  categoria: string;
  tipos: TipoElemento[];
}

export const elementos: Elemento[] = [
  // 🏗️ FUNDACIONES Y ESTRUCTURAS
  {
    categoria: "Fundaciones y Estructuras",
    tipos: [
      {
        nombre: "Cimiento corrido",
        fases: {
          estructura: ["R00","D01","D03"],
          obra_gris: ["M01","M02"],
          terminaciones: []
        }
      },
      {
        nombre: "Base aislada",
        fases: {
          estructura: ["R00","D01","H11"],
          obra_gris: ["M01"],
          terminaciones: []
        }
      },
      {
        nombre: "Columna hormigón armado",
        fases: {
          estructura: ["R01","H01"],
          obra_gris: ["M01"],
          terminaciones: []
        }
      },
      {
        nombre: "Encadenado fundación",
        fases: {
          estructura: ["R02","H15"],
          obra_gris: [],
          terminaciones: []
        }
      },
      {
        nombre: "Losa de fundación (platea)",
        fases: {
          estructura: ["R03","H16"],
          obra_gris: ["M01"],
          terminaciones: []
        }
      },
      {
        nombre: "Viga hormigón armado",
        fases: {
          estructura: ["R03","H17"],
          obra_gris: [],
          terminaciones: []
        }
      }
    ]
  },

  // 🧱 MUROS
  {
    categoria: "Muros",
    tipos: [
      {
        nombre: "Muro común 15 cm",
        fases: {
          estructura: ["R01","M27"],
          obra_gris: ["RV01","RV03","RV02","RV04","EL02","EL03"],
          terminaciones: ["RV05","RV06","TE30"]
        }
      },
      {
        nombre: "Muro común 30 cm (doble muro portante)",
        fases: {
          estructura: ["R01","M27","M25"],
          obra_gris: ["RV01","RV02","RV03","RV04","EL02","EL03"],
          terminaciones: ["RV05","RV06","TE30"]
        }
      },
      {
        nombre: "Muro de ladrillo visto",
        fases: {
          estructura: ["R01","M27"],
          obra_gris: ["RV01","RV02"],
          terminaciones: ["TE30"]
        }
      },
      {
        nombre: "Muro de Retak",
        fases: {
          estructura: ["R01","M27"],
          obra_gris: ["RV01","RV02","RV03","RV04","EL02","EL03"],
          terminaciones: ["RV05","RV06","TE30"]
        }
      },
      {
        nombre: "Tabique interior 15 cm",
        fases: {
          estructura: ["M27"],
          obra_gris: ["RV01","RV02","RV03","RV04","EL02","EL03"],
          terminaciones: ["RV05","RV06","TE30"]
        }
      }
    ]
  },

  // 🏠 PISOS
  {
    categoria: "Pisos",
    tipos: [
      {
        nombre: "Losa de hormigón armado",
        fases: {
          estructura: ["R04","H16"],
          obra_gris: ["M01"],
          terminaciones: ["TE01","TE02"]
        }
      },
      {
        nombre: "Contrapiso de hormigón",
        fases: {
          estructura: ["H16"],
          obra_gris: ["M01"],
          terminaciones: ["TE01","TE02"]
        }
      },
      {
        nombre: "Piso de cerámica",
        fases: {
          estructura: [],
          obra_gris: ["M01"],
          terminaciones: ["TE01","TE02","TE03"]
        }
      },
      {
        nombre: "Piso de porcelanato",
        fases: {
          estructura: [],
          obra_gris: ["M01"],
          terminaciones: ["TE01","TE02","TE04"]
        }
      }
    ]
  },

  // 🏠 CUBIERTAS
  {
    categoria: "Cubiertas",
    tipos: [
      {
        nombre: "Losa de techo",
        fases: {
          estructura: ["R04","H16"],
          obra_gris: ["M01","EL01"],
          terminaciones: ["TE05","TE06"]
        }
      },
      {
        nombre: "Cubierta de chapa",
        fases: {
          estructura: ["R04","H16"],
          obra_gris: ["M01","C01","C02"],
          terminaciones: ["TE07"]
        }
      },
      {
        nombre: "Cubierta de teja",
        fases: {
          estructura: ["R04","H16"],
          obra_gris: ["M01","C03","C04"],
          terminaciones: ["TE08"]
        }
      }
    ]
  },

  // 🪜 ESCALERAS
  {
    categoria: "Escaleras",
    tipos: [
      {
        nombre: "Escalera de hormigón",
        fases: {
          estructura: ["R01","H01"],
          obra_gris: ["M01","RV01","RV02"],
          terminaciones: ["TE09","TE10"]
        }
      },
      {
        nombre: "Escalera metálica",
        fases: {
          estructura: ["R01"],
          obra_gris: ["M01","C05","C06"],
          terminaciones: ["TE11"]
        }
      }
    ]
  },

  // 🪟 CARPINTERÍAS
  {
    categoria: "Carpinterías",
    tipos: [
      {
        nombre: "Puerta de madera",
        fases: {
          estructura: [],
          obra_gris: ["M01"],
          terminaciones: ["C07","C08","TE12"]
        }
      },
      {
        nombre: "Ventana de madera",
        fases: {
          estructura: [],
          obra_gris: ["M01"],
          terminaciones: ["C09","C10","TE13"]
        }
      },
      {
        nombre: "Puerta de aluminio",
        fases: {
          estructura: [],
          obra_gris: ["M01"],
          terminaciones: ["C11","C12","TE14"]
        }
      },
      {
        nombre: "Ventana de aluminio",
        fases: {
          estructura: [],
          obra_gris: ["M01"],
          terminaciones: ["C13","C14","TE15"]
        }
      }
    ]
  }
];
  