export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export const checklistPlantillas: Record<string, ChecklistItem[]> = {
  "Instalación eléctrica habitaciones": [
    { id: "elec1", label: "Verificar recorrido y planos", done: false },
    { id: "elec2", label: "Preparar alturas de tomas y llaves", done: false },
    { id: "elec3", label: "Pasar caños y fijarlos", done: false },
    { id: "elec4", label: "Colocar cajas y asegurar", done: false },
    { id: "elec5", label: "Revisar continuidad y obstrucciones", done: false },
  ],

  "Levantamiento de muro": [
    { id: "muro1", label: "Preparar mezcla", done: false },
    { id: "muro2", label: "Revisar plomada y nivel", done: false },
    { id: "muro3", label: "Humedecer ladrillos", done: false },
    { id: "muro4", label: "Colocar primera hilada", done: false },
    { id: "muro5", label: "Verificar juntas", done: false },
  ],

  "Albañilería": [
    { id: "alb1", label: "Preparar mezcla", done: false },
    { id: "alb2", label: "Revisar plomada y nivel", done: false },
    { id: "alb3", label: "Humedecer ladrillos", done: false },
    { id: "alb4", label: "Colocar primera hilada", done: false },
    { id: "alb5", label: "Verificar juntas", done: false },
  ],

  "Revoque grueso": [
    { id: "revg1", label: "Preparar superficie", done: false },
    { id: "revg2", label: "Colocar guías maestras", done: false },
    { id: "revg3", label: "Preparar mezcla", done: false },
    { id: "revg4", label: "Aplicar primera capa", done: false },
    { id: "revg5", label: "Controlar plomo y regla", done: false },
  ],

  "Revoque fino": [
    { id: "revf1", label: "Humedecer superficie", done: false },
    { id: "revf2", label: "Preparar mezcla fina", done: false },
    { id: "revf3", label: "Aplicar segunda capa", done: false },
    { id: "revf4", label: "Tirar llana y flotar", done: false },
    { id: "revf5", label: "Revisar imperfecciones", done: false },
  ],

  "Instalación sanitaria": [
    { id: "san1", label: "Verificar pendiente", done: false },
    { id: "san2", label: "Fijar caños", done: false },
    { id: "san3", label: "Probar estanqueidad", done: false },
    { id: "san4", label: "Sellar uniones", done: false },
    { id: "san5", label: "Tapar canaleta", done: false },
  ],

  "Colocación de piso": [
    { id: "piso1", label: "Nivelar superficie", done: false },
    { id: "piso2", label: "Preparar adhesivo", done: false },
    { id: "piso3", label: "Presentar piezas", done: false },
    { id: "piso4", label: "Corregir juntas", done: false },
    { id: "piso5", label: "Lavar y sellar", done: false },
  ],

  "Pintura": [
    { id: "pint1", label: "Cubrir superficies", done: false },
    { id: "pint2", label: "Sellador base", done: false },
    { id: "pint3", label: "Primera mano", done: false },
    { id: "pint4", label: "Segunda mano", done: false },
    { id: "pint5", label: "Control de tonos", done: false },
  ],
};

// Checklist genérico por defecto (fallback)
export const checklistDefault: ChecklistItem[] = [
  { id: "gen1", label: "Verificar materiales", done: false },
  { id: "gen2", label: "Preparar superficie", done: false },
  { id: "gen3", label: "Revisar nivelación", done: false },
  { id: "gen4", label: "Ejecutar tarea", done: false },
  { id: "gen5", label: "Control de calidad", done: false },
];

// Función helper para obtener checklist por nombre de tarea
export function obtenerChecklistPorTarea(nombreTarea: string): ChecklistItem[] {
  // Buscar plantilla exacta
  if (checklistPlantillas[nombreTarea]) {
    return checklistPlantillas[nombreTarea].map(item => ({ ...item }));
  }

  // Buscar por coincidencia parcial
  const nombreLower = nombreTarea.toLowerCase();
  const claveEncontrada = Object.keys(checklistPlantillas).find(
    clave => nombreLower.includes(clave.toLowerCase()) || clave.toLowerCase().includes(nombreLower)
  );

  if (claveEncontrada) {
    return checklistPlantillas[claveEncontrada].map(item => ({ ...item }));
  }

  // Fallback a checklist genérico
  return checklistDefault.map(item => ({ ...item }));
}

