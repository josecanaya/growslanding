import { CpmNode } from "./cpm";

export type Positioned = CpmNode & { x: number; y: number; w: number; h: number; level: number };
export type Edge = { from: string; to: string };

type LayoutOpts = {
  width: number;
  colWidth?: number;
  colGap?: number;
  rowGap?: number;
  rowHeight?: number;
};

// Mapa de niveles fijos según tipo de tarea
function getVerticalLevel(taskName: string): number {
  const name = taskName.toLowerCase();
  
  // Nivel 0: Acabados finales (arriba)
  if (name.includes('pintura')) return 0;
  
  // Nivel 1: Camino crítico (centro)
  if (name.includes('cimentación') || name.includes('muros') || 
      name.includes('techos') || name.includes('pisos')) return 1;
  
  // Nivel 2: Instalaciones y oficios (abajo)
  if (name.includes('inst.') || name.includes('carp.')) return 2;
  
  // Por defecto, nivel 1 (centro)
  return 1;
}

export function levelize(nodes: CpmNode[], edges: Edge[]) {
  const indeg = new Map(nodes.map(n => [n.id, 0]));
  edges.forEach(e => indeg.set(e.to, (indeg.get(e.to) || 0) + 1));

  const out = new Map(nodes.map(n => [n.id, [] as string[]]));
  edges.forEach(e => out.get(e.from)!.push(e.to));

  const q = nodes.filter(n => (indeg.get(n.id) ?? 0) === 0).map(n => [n.id, 0] as [string, number]);
  const level = new Map<string, number>();
  q.forEach(([id, l]) => level.set(id, l));

  while (q.length) {
    const [u, l] = q.shift()!;
    for (const v of out.get(u)!) {
      const cand = Math.max(l + 1, level.get(v) ?? 0);
      level.set(v, cand);
      indeg.set(v, (indeg.get(v) ?? 1) - 1);
      if (indeg.get(v) === 0) q.push([v, level.get(v)!]);
    }
  }
  return nodes.map(n => ({ node: n, level: level.get(n.id) ?? 0 }));
}

export function layoutByLevels(
  nodes: CpmNode[],
  edges: Edge[],
  opts: LayoutOpts
): { P: Positioned[]; size: { width: number; height: number } } {
  const { width, colWidth = 180, colGap = 32, rowGap = 70, rowHeight = 120 } = opts;

  const levels = levelize(nodes, edges);
  const maxLevel = Math.max(...levels.map(l => l.level));
  
  const grouped = new Map<number, CpmNode[]>();
  levels.forEach(l => {
    const arr = grouped.get(l.level) || [];
    arr.push(l.node);
    grouped.set(l.level, arr);
  });

  const cols = maxLevel + 1;
  const diagramWidth = cols * colWidth + (cols - 1) * colGap;
  const offsetX = Math.max(0, (width - diagramWidth) / 2);

  const colX: number[] = [];
  for (let c = 0; c < cols; c++) {
    colX.push(offsetX + c * (colWidth + colGap));
  }

  const P: Positioned[] = [];
  
  // Altura base del contenedor (centro vertical)
  const baseY = 350;
  
  // Mapa de niveles verticales fijos
  const levelY = {
    0: baseY - 200,  // Arriba: Pintura
    1: baseY,        // Centro: Camino crítico
    2: baseY + 200,  // Abajo: Instalaciones
  };
  
  // Agrupar tareas por columna (topológica)
  const tasksByCol = new Map<number, CpmNode[]>();
  nodes.forEach(node => {
    const col = levels.find(l => l.node.id === node.id)?.level ?? 0;
    const arr = tasksByCol.get(col) || [];
    arr.push(node);
    tasksByCol.set(col, arr);
  });
  
  // Posicionar cada tarea
  nodes.forEach(node => {
    const col = levels.find(l => l.node.id === node.id)?.level ?? 0;
    const xPos = colX[col];
    const verticalLevel = getVerticalLevel(node.name);
    const yPos = levelY[verticalLevel as keyof typeof levelY] || baseY;
    
    P.push({
      ...node,
      level: col,
      x: xPos,
      y: yPos,
      w: colWidth,
      h: rowHeight,
    });
  });

  const height = 700;
  return { P, size: { width: Math.max(width, diagramWidth), height } };
}
