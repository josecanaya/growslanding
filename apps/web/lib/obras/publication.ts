import { z } from 'zod';

const publicMapPoint = z.object({
  lat: z.number().min(-85).max(85),
  lng: z.number().min(-180).max(180),
});

const simulationSchema = z.object({
  dia: z.number().int().min(0).max(112),
  corrida: z.string().regex(/^\d{1,24}$/),
  fecha: z.string().datetime(),
  avance_fisico_pct: z.number().min(0).max(100),
  certificado_pct: z.number().min(0).max(100),
  pagado_pct: z.number().min(0).max(100),
  rondas: z.array(z.object({
    estado: z.string().regex(/^[a-z_]{1,40}$/),
    mcu_integradas: z.number().int().nonnegative().safe(),
  })).max(12),
});

export const postSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  text: z.string().trim().min(2).max(2400),
  author: z.string().trim().min(2).max(160),
  publishedAt: z.string().datetime({ offset: true }),
  coverUrl: z.string().url().refine((url) => url.startsWith('https://')).optional(),
  category: z.enum(['proyecto', 'pliegos', 'planificacion', 'avance']),
});
export type WorkPost = z.infer<typeof postSchema>;

export const publicationSchema = z.object({
  visible: z.boolean(),
  posts: z.array(postSchema).max(100).default([]),
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(2400),
  location: z.string().trim().max(160),
  mapPoint: publicMapPoint.optional(),
  stage: z.string().trim().max(120),
  coverUrl: z.union([z.literal(''), z.string().url().refine((url) => url.startsWith('https://'))]),
  progress: z.number().int().min(0).max(100),
  contractorNotes: z.string().trim().max(2400),
  investorNotes: z.string().trim().max(2400),
  milestones: z.array(z.object({
    title: z.string().trim().min(1).max(160),
    status: z.enum(['pendiente', 'en_curso', 'validado']),
  })).max(20),
});

export type Publication = z.infer<typeof publicationSchema> & {
  publishedAt?: string;
  simulation?: z.infer<typeof simulationSchema>;
};
export type PublicObra = Publication & { id: string };

export function readPublication(value: unknown): Publication | null {
  const parsed = publicationSchema.safeParse(value);
  if (!parsed.success) return null;
  const { publishedAt, simulation } = value as Record<string, unknown>;
  const validatedRun = simulationSchema.safeParse(simulation);
  return {
    ...parsed.data,
    publishedAt: typeof publishedAt === 'string' ? publishedAt : undefined,
    ...(validatedRun.success ? { simulation: validatedRun.data } : {}),
  };
}

export function emptyPublication(name: string): Publication {
  return { posts: [], visible: false, title: name, summary: '', location: '', stage: '', coverUrl: '', progress: 0, contractorNotes: '', investorNotes: '', milestones: [] };
}
