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
    "id": "H01",
    "nombre": "Hormigón",
    "unidad": "m3",
    "coef_operativo": 2.5,
    "fase": "estructura"
  },
  {
    "id": "PL01",
    "nombre": "Plomería",
    "unidad": "ml",
    "coef_operativo": 1.8,
    "fase": "obra_gris"
  }
];

export const getTareasPorFase = (fase: 'estructura' | 'obra_gris' | 'terminaciones'): TareaConstructiva[] => {
  return tareasConstructivas.filter(tarea => tarea.fase === fase);
};

export const getTareaPorId = (id: string): TareaConstructiva | undefined => {
  return tareasConstructivas.find(tarea => tarea.id === id);
};
