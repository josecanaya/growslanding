import { z } from "zod";

export const tareaSchema = z.object({
  obra_id: z.string().uuid({ message: "obra_id debe ser un UUID válido" }),
  tipo: z.string().min(2, { message: "tipo debe tener al menos 2 caracteres" }),
  descripcion: z.string().min(5, { message: "descripcion debe tener al menos 5 caracteres" }),
  referente_id: z.string().uuid().optional().nullable(),
  socio_ids: z.array(z.string().uuid()).optional().default([]),
  precedencias: z.array(z.string().uuid()).optional().default([]),
});

export type TareaInput = z.infer<typeof tareaSchema>;
