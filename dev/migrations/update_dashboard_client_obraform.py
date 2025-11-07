from pathlib import Path

path = Path(r'grows/apps/web/app/(dashboard)/dashboard/dashboard-client.tsx')
text = path.read_text(encoding='utf-8')
old = "  const obraForm = useForm<ObraFormValues>({\n    resolver: zodResolver(obraSchema),\n    defaultValues: { nombre: '' },\n  });"
new = "  const obraForm = useForm<ObraFormValues>({\n    resolver: zodResolver(obraSchema),\n    defaultValues: {\n      nombre: '',\n      cliente: '',\n      tipo: 'nueva',\n      fecha_inicio: '',\n      permiso_numero: '',\n    },\n  });"
if old not in text:
    raise SystemExit('obraForm init block not found')
path.write_text(text.replace(old, new), encoding='utf-8')
