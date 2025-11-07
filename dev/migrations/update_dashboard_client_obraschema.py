from pathlib import Path

path = Path(r'grows/apps/web/app/(dashboard)/dashboard/dashboard-client.tsx')
text = path.read_text(encoding='utf-8')
old = "const obraSchema = z.object({\n  nombre: z.string().min(2),\n  localizacion: z.string().optional(),\n  cliente: z.string().optional(),\n});"
new = "const obraSchema = z\n  .object({\n    nombre: z.string().min(2, 'Ingresa el nombre de la obra'),\n    cliente: z.string().min(2, 'Ingresa el cliente asociado'),\n    tipo: z.enum(['nueva', 'reforma', 'ampliacion']),\n    fecha_inicio: z\n      .string()\n      .min(1, 'Selecciona una fecha de inicio')\n      .refine((value) => !Number.isNaN(Date.parse(value)), 'Fecha de inicio no valida'),\n    permiso_numero: z\n      .preprocess(\n        (value) => (typeof value === 'string' && value.trim().length === 0 ? undefined : value),\n        z.string().min(3, 'Indica al menos 3 caracteres').optional()\n      ),\n  });"
if old not in text:
    raise SystemExit('obraSchema block not found')
path.write_text(text.replace(old, new), encoding='utf-8')
