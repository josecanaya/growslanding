from pathlib import Path

path = Path(r'grows/apps/web/app/(dashboard)/dashboard/dashboard-client.tsx')
text = path.read_text(encoding='utf-8')
old = "  async function handleSubmit(\n    url: string,\n    values: Record<string, unknown>,\n    reset?: () => void\n  ) {\n    const response = await fetch(url, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify(values),\n    });\n\n    if (response.ok) {\n      feedback.pushMessage('Guardado correctamente', 'success');\n      reset?.();\n      router.refresh();\n    } else {\n      const error = await response.json().catch(() => ({ message: 'Error' }));\n      feedback.pushMessage(error.message ?? 'No se pudo guardar', 'error');\n    }\n  }"
new = "  async function handleSubmit(\n    url: string,\n    values: Record<string, unknown>,\n    options?: { reset?: () => void; onSuccess?: (data: unknown) => void }\n  ) {\n    const response = await fetch(url, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify(values),\n    });\n\n    if (response.ok) {\n      const data = await response.json().catch(() => null);\n      feedback.pushMessage('Guardado correctamente', 'success');\n      options?.onSuccess?.(data);\n      options?.reset?.();\n      router.refresh();\n    } else {\n      const error = await response.json().catch(() => ({ message: 'Error' }));\n      feedback.pushMessage(error.message ?? 'No se pudo guardar', 'error');\n    }\n  }"
if old not in text:
    raise SystemExit('handleSubmit block not found')
path.write_text(text.replace(old, new), encoding='utf-8')
