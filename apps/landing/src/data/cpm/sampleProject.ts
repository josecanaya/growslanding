export type Task = {
  id: string;
  name: string;
  owner: string;
  duration: number; // días
  deps: string[];   // ids predecesoras
};

export const sampleTasks: Task[] = [
  { id: "A", name: "Cimentación", owner: "Ing. López", duration: 5, deps: [] },
  { id: "B", name: "Muros PB", owner: "Arq. Pérez", duration: 4, deps: ["A"] },
  { id: "C", name: "Inst. eléct", owner: "Téc. García", duration: 3, deps: ["A"] },
  { id: "D", name: "Muros PA", owner: "Arq. Pérez", duration: 4, deps: ["B"] },
  { id: "E", name: "Techos", owner: "Ing. Martín", duration: 5, deps: ["D"] },
  { id: "F", name: "Inst. plom", owner: "Téc. Ruiz", duration: 3, deps: ["A"] },
  { id: "G", name: "Inst. sanit", owner: "Téc. Silva", duration: 2, deps: ["A"] },
  { id: "H", name: "Carp. marco", owner: "Maestro", duration: 3, deps: ["C"] },
  { id: "I", name: "Pisos", owner: "Arq. Díaz", duration: 4, deps: ["E", "H"] },
  { id: "J", name: "Pintura", owner: "Pintor", duration: 2, deps: ["B"] },
];
