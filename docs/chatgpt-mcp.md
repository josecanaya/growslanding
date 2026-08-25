# Conectar ChatGPT a Grows (MCP)

Hablar desde tu cuenta de ChatGPT y que proponga etapas/tareas en el **Organizar** de Grows (misma estructura CPM). Solo **propuesta**; vos aceptás/publicás en el front. No wallet / no realizada.

## 1. Variables en Vercel / `.env.local`

```bash
GROWS_MCP_TOKEN=un-secreto-largo-aleatorio
GROWS_MCP_ORG_ID=   # opcional: UUID de tu org para acotar obras
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Tras el deploy, el endpoint MCP es:

`https://TU-DOMINIO/api/mcp`

OpenAPI (Custom GPT Actions):

`https://TU-DOMINIO/api/mcp/openapi`

## 2. Opción A — Conector MCP en ChatGPT

1. ChatGPT → **Settings** → **Apps & Connectors** (o *Developer mode* / conectores avanzados, según tu plan).
2. Agregar servidor MCP remoto:
   - **URL:** `https://TU-DOMINIO/api/mcp`
   - **Auth:** Bearer → el valor de `GROWS_MCP_TOKEN`
3. En el chat, habilitá el conector Grows y pedí por ejemplo:
   - «Listá mis obras»
   - «En Mi edificio proponé: Definir programa → Unidades por piso»

## 3. Opción B — Custom GPT + Actions (si no tenés conectores MCP)

1. [chatgpt.com/create](https://chatgpt.com/create) → Create a GPT.
2. **Actions** → Import from URL: `https://TU-DOMINIO/api/mcp/openapi`
3. Authentication: **API Key** → Bearer → `GROWS_MCP_TOKEN`
4. Instructions del GPT (pegar):

```
Sos el copiloto de Grows. Trabajás sobre el canvas Organizar (etapas → tareas → precedencias CPM).
Flujo: listar_obras_vivas → leer_horizonte → si el humano pide un paso, proponer_paso con «verbo → detalle».
Nunca marques tareas como realizadas ni toques wallet/cobro. El humano acepta en /cliente/tareas/{id}/editor.
Respondé en español, breve.
```

## 4. Tools disponibles

| Tool | Qué hace |
|------|----------|
| `listar_obras_vivas` | Obras con Organizar |
| `leer_horizonte` | Etapas / tareas / precedencias |
| `proponer_paso` | Tarea bajo `00. Definición…` + edge |
| `anotar_hilo` | Guarda el diálogo en la obra |

## 5. Cursor (stdio local)

Seguí usando `mcp-grows-plataforma` en `.cursor/mcp.json` (command `node …/index.mjs`). El HTTP de esta app es para ChatGPT.
