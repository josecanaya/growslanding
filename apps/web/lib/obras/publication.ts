import { z } from 'zod';

export const publicationSchema = z.object({
  visible: z.boolean(),
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(2400),
  location: z.string().trim().max(160),
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

export type Publication = z.infer<typeof publicationSchema> & { publishedAt?: string };
export type PublicObra = Publication & { id: string };

export function readPublication(value: unknown): Publication | null {
  const parsed = publicationSchema.safeParse(value);
  if (!parsed.success) return null;
  const timestamp = (value as Record<string, unknown>).publishedAt;
  return { ...parsed.data, publishedAt: typeof timestamp === 'string' ? timestamp : undefined };
}

export function emptyPublication(name: string): Publication {
  return { visible: false, title: name, summary: '', location: '', stage: '', coverUrl: '', progress: 0, contractorNotes: '', investorNotes: '', milestones: [] };
}
