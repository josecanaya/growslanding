from pathlib import Path

path = Path(r'grows/apps/web/app/(dashboard)/dashboard/dashboard-client.tsx')
text = path.read_text(encoding='utf-8')
anchor = "  const feedback = useServerActionFeedback();\n  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);"
insertion = "  const feedback = useServerActionFeedback();\n  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);\n  const [recentObra, setRecentObra] = useState<{ id: string; nombre: string } | null>(null);\n  const [legajoStatus, setLegajoStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);\n  const [isUploadingLegajo, setIsUploadingLegajo] = useState(false);"
if anchor not in text:
    raise SystemExit('processingInviteId block not found')
text = text.replace(anchor, insertion)
path.write_text(text, encoding='utf-8')
