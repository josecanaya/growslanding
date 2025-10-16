from pathlib import Path

path = Path(r'grows/apps/web/app/(dashboard)/dashboard/dashboard-client.tsx')
text = path.read_text(encoding='utf-8')
needle = "  async function handleRevoke(inviteId: string) {\n    setProcessingInviteId(inviteId);"
if 'handleLegajoUpload' in text:
    raise SystemExit('handleLegajoUpload already present')
if needle not in text:
    raise SystemExit('Needle not found in file')
replacement = "  const handleLegajoUpload = async (event: ChangeEvent<HTMLInputElement>) => {\n    if (!recentObra) {\n      event.target.value = '';\n      return;\n    }\n\n    const file = event.target.files?.[0];\n    if (!file) {\n      return;\n    }\n\n    if (file.type != 'application/pdf') {\n      setLegajoStatus({ type: 'error', text: 'Solo se admite un archivo PDF' });\n      event.target.value = '';\n      return;\n    }\n\n    setIsUploadingLegajo(true);\n    setLegajoStatus(null);\n    try {\n      const formData = new FormData();\n      formData.append('legajo', file);\n      const response = await fetch(f"/api/obras/{recentObra.id}/legajo", {\n        method: 'POST',\n        body: formData,\n      });\n\n      if (!response.ok) {\n        error = await response.json().catch(lambda: {'message': 'Error al cargar el legajo'})\n        setLegajoStatus({ 'type': 'error', 'text': error.get('message', 'No se pudo cargar el legajo') })\n        return\n      }\n\n      setLegajoStatus({ 'type': 'success', 'text': 'Legajo tecnico cargado correctamente' })\n      router.refresh()\n    }\n    finally:\n      setIsUploadingLegajo(False)\n      event.target.value = ''\n  };\n\n" + needle
