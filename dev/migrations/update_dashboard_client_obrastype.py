from pathlib import Path

path = Path(r'grows/apps/web/app/(dashboard)/dashboard/dashboard-client.tsx')
text = path.read_text(encoding='utf-8')
old = "  obras: Array<{\n    id: string;\n    org_id: string;\n    nombre: string;\n    cliente: string | null;\n    localizacion: string | null;\n  }>;"
new = "  obras: Array<{\n    id: string;\n    org_id: string;\n    nombre: string;\n    cliente: string | null;\n    localizacion: string | null;\n    tipo: 'nueva' | 'reforma' | 'ampliacion' | null;\n    fecha_inicio: string | null;\n    permiso_numero: string | null;\n    legajo_path: string | null;\n  }>;"
if old not in text:
    raise SystemExit('obras type block not found')
path.write_text(text.replace(old, new), encoding='utf-8')
