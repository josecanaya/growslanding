import json
from pathlib import Path
path = Path('apps/web/components/clienteTecnico/ObrasSection.tsx')
text = path.read_text(encoding='utf-8')
start_token = '  const crearObraEnBD'
marker = '  const handleCrearObra'
start_idx = text.find(start_token)
if start_idx == -1: raise SystemExit('crearObraEnBD not found')
end_idx = text.find(marker, start_idx)
if end_idx == -1: raise SystemExit('handleCrearObra marker not found')
replacement_lines = [
