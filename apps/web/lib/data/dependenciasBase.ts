export type DependenciaBase = {
  id: string;
  siguientes: string[];
};

/**
 * Secuencia constructiva base para ordenar tareas de manera natural.
 * No modifica datos reales: solo sirve como guía para ordenar la visual.
 */
export const dependenciasBase: DependenciaBase[] = [
  { id: 'fundaciones', siguientes: ['estructura'] },
  { id: 'estructura', siguientes: ['muros', 'cubiertas'] },
  { id: 'muros', siguientes: ['revoques', 'instalaciones'] },
  { id: 'revoques', siguientes: ['instalaciones', 'cubiertas', 'pintura', 'revestimientos'] },
  { id: 'instalaciones', siguientes: ['cubiertas', 'terminaciones', 'pintura'] },
  { id: 'cubiertas', siguientes: ['terminaciones'] },
  { id: 'terminaciones', siguientes: ['pintura', 'revestimientos'] },
  { id: 'pintura', siguientes: [] },
  { id: 'revestimientos', siguientes: [] },
];

