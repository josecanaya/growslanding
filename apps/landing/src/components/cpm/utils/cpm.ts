import { Task } from "@/data/cpm/sampleProject";

export type CpmNode = Task & {
  ES: number; EF: number; // Early Start/Finish
  LS: number; LF: number; // Late Start/Finish
  slack: number;
};

export function computeCPM(tasks: Task[]) {
  const map = new Map<string, CpmNode>();
  tasks.forEach(t => map.set(t.id, { ...t, ES: 0, EF: 0, LS: 0, LF: 0, slack: 0 }));

  // Forward pass
  for (const t of tasks) {
    const node = map.get(t.id)!;
    node.ES = Math.max(0, ...(t.deps.map(id => map.get(id)!.EF) || [0]));
    node.EF = node.ES + t.duration;
  }

  // Project duration
  const projectDuration = Math.max(...[...map.values()].map(n => n.EF));

  // Backward pass (reverse order)
  for (const t of [...tasks].reverse()) {
    const node = map.get(t.id)!;
    // sucesoras = tareas que dependen de t
    const succ = tasks.filter(x => x.deps.includes(t.id)).map(x => map.get(x.id)!);
    if (succ.length === 0) {
      node.LF = projectDuration;
    } else {
      node.LF = Math.min(...succ.map(s => s.LS));
    }
    node.LS = node.LF - node.duration;
    node.slack = node.LS - node.ES;
  }

  const cpmPath = [...map.values()]
    .sort((a, b) => a.ES - b.ES)
    .filter(n => n.slack === 0)
    .map(n => n.id);

  return {
    nodes: [...map.values()],
    edges: tasks.flatMap(t => t.deps.map(d => ({ from: d, to: t.id }))),
    projectDuration,
    cpmPath, // lista ordenada por ES
  };
}

