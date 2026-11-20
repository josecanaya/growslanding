import { z } from 'zod';

const code = z.string().regex(/^[A-Za-z0-9_-]{1,30}$/);
export const taskSchema = z.object({
  code, stage: z.string().trim().min(2).max(120), title: z.string().trim().min(2).max(160),
  quantity: z.number().positive().max(1e7), unit: z.string().trim().min(1).max(30),
  unitPrice: z.number().nonnegative().max(1e8), duration: z.number().int().min(1).max(2000),
  dependsOn: z.array(code).max(30),
});
export type PlanTask = z.infer<typeof taskSchema>;
export function preparePlan(tasks: PlanTask[]) {
  const rows = z.array(taskSchema).min(1).max(300).parse(tasks);
  const byCode = new Map(rows.map((task) => [task.code, task]));
  if (byCode.size !== rows.length) throw new Error('Cada tarea necesita un código único.');
  const finished = new Map<string, number>();
  const visiting = new Set<string>();
  function finish(id: string): number {
    if (finished.has(id)) return finished.get(id)!;
    const task = byCode.get(id);
    if (!task) throw new Error('Dependencia inexistente: ' + id);
    if (visiting.has(id)) throw new Error('Las dependencias contienen un ciclo.');
    visiting.add(id);
    const start = Math.max(0, ...task.dependsOn.map(finish));
    const end = start + task.duration;
    visiting.delete(id);
    finished.set(id, end);
    return end;
  }
  return rows.map((task) => {
    const endDay = finish(task.code);
    return { ...task, startDay: endDay - task.duration, endDay, amount: Math.round(task.quantity * task.unitPrice * 100) / 100 };
  });
}
export function parsePlan(text: string) {
  return preparePlan(text.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    const fields = line.split('|').map((part) => part.trim());
    if (fields.length !== 8) throw new Error('La línea ' + (index + 1) + ' debe tener ocho campos separados por |.');
    const [code, stage, title, quantity, unit, unitPrice, duration, dependencies] = fields;
    return { code, stage, title, quantity: Number(quantity), unit, unitPrice: Number(unitPrice), duration: Number(duration), dependsOn: dependencies ? dependencies.split(',').map((id) => id.trim()) : [] };
  }));
}
const escapeXml = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
export function projectXml(tasks: PlanTask[], name: string) {
  const plan = preparePlan(tasks);
  const ids = new Map(plan.map((task, index) => [task.code, index + 1]));
  const rows = plan.map((task, index) => `<Task><UID>${index + 1}</UID><ID>${index + 1}</ID><Name>${escapeXml(task.title)}</Name><OutlineLevel>1</OutlineLevel><Duration>PT${task.duration * 8}H0M0S</Duration><DurationFormat>7</DurationFormat><Manual>0</Manual>${task.dependsOn.map((dep) => `<PredecessorLink><PredecessorUID>${ids.get(dep)}</PredecessorUID><Type>1</Type><LinkLag>0</LinkLag></PredecessorLink>`).join('')}<Notes>${escapeXml(task.code + ' · ' + task.stage + ' · ' + task.quantity + ' ' + task.unit + ' · USD ' + task.amount)}</Notes></Task>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><Project xmlns="http://schemas.microsoft.com/project"><Name>${escapeXml(name)}</Name><ScheduleFromStart>1</ScheduleFromStart><MinutesPerDay>480</MinutesPerDay><MinutesPerWeek>2400</MinutesPerWeek><Tasks>${rows}</Tasks></Project>`;
}
export const studioSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('profile'), title: z.string().trim().min(2).max(160), description: z.string().trim().min(20).max(2400), audience: z.string().trim().min(2).max(400), destination: z.enum(['venta','alquiler','mixto']), delivery: z.string().date() }),
  z.object({ action: z.literal('import'), tasks: z.array(taskSchema).min(1).max(300) }),
  z.object({ action: z.literal('round'), goal: z.number().positive().max(1e10), closes: z.string().date(), conditions: z.string().trim().min(80).max(6000) }),
  z.object({ action: z.literal('change'), title: z.string().trim().min(2).max(160), reason: z.string().trim().min(10).max(2400), amount: z.number().nonnegative().max(1e10), days: z.number().int().min(0).max(2000) }),
  z.object({ action: z.literal('post'), title: z.string().trim().min(2).max(160), text: z.string().trim().min(10).max(2400), coverUrl: z.string().url().refine((url) => url.startsWith('https://')) }),
  z.object({ action: z.literal('sister'), other: z.string().uuid() }),
]);
