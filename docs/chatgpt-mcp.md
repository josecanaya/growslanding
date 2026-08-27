# Conectar ChatGPT a Grows (MCP + OAuth)

Cualquier usuario conecta su ChatGPT a Grows **como se conecta a GitHub**: hace clic en
"Conectar", inicia sesión con **su cuenta de Grows**, autoriza, y ChatGPT queda atado a
**su cuenta** — ve y opera **solo sus obras** (las de sus orgs, como dueño o socio).

Todo es **propuesta**: ChatGPT propone etapas/tareas en el Organizar; el humano acepta/publica
en el front. No wallet / no realizada.

---

## 0. Arquitectura (qué se construyó)

Grows es a la vez **Authorization Server** y **Resource Server** de OAuth 2.1 (PKCE),
usando **Supabase Auth** como identidad. Piezas:

| Ruta | Qué hace |
|------|----------|
| `/.well-known/oauth-protected-resource` | Le dice a ChatGPT qué servidor de autorización usar |
| `/.well-known/oauth-authorization-server` | Metadata OAuth (endpoints, PKCE) |
| `POST /api/oauth/register` | Registro dinámico de cliente (ChatGPT se registra solo) |
| `GET/POST /api/oauth/authorize` | Login de Grows + emite el código de autorización |
| `POST /api/oauth/token` | Canjea código → access_token (JWT 1h) + refresh_token (30d) |
| `POST /api/mcp` | Endpoint MCP; valida el token y filtra obras por usuario |

Tokens = JWT HS256 firmados con `GROWS_MCP_JWT_SECRET`. No hace falta guardarlos.

---

## 1. Migración de base de datos (una sola vez)

Corré el SQL en **Supabase → SQL Editor** (o `supabase db push` si usás la CLI):

`apps/web/supabase/migrations/20260827120000_mcp_oauth.sql`

Crea dos tablas: `mcp_oauth_clients` y `mcp_oauth_codes`. Es aditivo y seguro
(`create table if not exists`).

## 2. Variables de entorno (Vercel + `.env.local`)

```bash
# Identidad / datos (ya las tenías)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# MCP / OAuth
GROWS_MCP_TOKEN=<secreto-largo>       # token del DUEÑO (acceso total) + firma JWT por defecto
GROWS_MCP_JWT_SECRET=<opcional>       # si querés separar la firma del token del dueño
GROWS_MCP_ORG_ID=<opcional>           # solo afecta al token estático del dueño
```

Generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Importante:** en Vercel, agregá las variables y **volvé a desplegar** para que tomen efecto.
> El endpoint necesita URL pública (ChatGPT no llega a `localhost`).

---

## 3. Conectar desde ChatGPT (flujo "como GitHub")

1. ChatGPT → **Settings → Connectors** (o *Apps & Connectors* / modo desarrollador, según tu plan).
2. **Add / New connector** → MCP remoto:
   - **URL:** `https://TU-DOMINIO/api/mcp`
   - **Authentication:** **OAuth** (ChatGPT detecta el resto solo vía discovery).
3. ChatGPT abre la pantalla de **login de Grows** → iniciás sesión con tu email/contraseña → **Autorizar**.
4. Listo. En el chat, con el conector Grows activo:
   - «Listá mis obras»
   - «Leé el estado de *Mi edificio*»
   - «En *Mi edificio* proponé: Definir programa → Unidades por piso»

Cada persona que repita esto queda conectada **a su propia cuenta**.

### Alternativa — Custom GPT + Actions (token estático)

Si tu plan no tiene conectores MCP con OAuth, podés usar un Custom GPT con el token del dueño:

1. [chatgpt.com/create](https://chatgpt.com/create) → **Actions** → Import from URL:
   `https://TU-DOMINIO/api/mcp/openapi`
2. Authentication: **API Key** → Bearer → `GROWS_MCP_TOKEN`.
3. Esto usa el **token del dueño** (ve todas las obras / las de `GROWS_MCP_ORG_ID`). No es multiusuario.

---

## 4. Tools disponibles

| Tool | Qué hace |
|------|----------|
| `listar_obras_vivas` | Obras del usuario (Organizar) |
| `leer_horizonte` | Etapas / tareas / precedencias de una obra |
| `proponer_paso` | Tarea bajo `00. Definición…` + precedencia (propuesta) |
| `anotar_hilo` | Guarda el diálogo en la obra |

## 5. Seguridad / alcance

- **Aislamiento por usuario:** el access_token lleva el `user_id`; las tools filtran obras por
  las orgs de ese usuario (`organizations.user_id` + `socios.user_id`). Verificado: un usuario
  con 5 obras propias no ve las 9 de la plataforma.
- **PKCE S256** obligatorio en el intercambio de código.
- **Token del dueño** (`GROWS_MCP_TOKEN`) sigue funcionando como respaldo con acceso total.
- Revocar acceso: por ahora, rotando `GROWS_MCP_JWT_SECRET` (invalida todos los tokens emitidos).

## 6. Cursor (stdio local)

Seguí usando `mcp-grows-plataforma` en `.cursor/mcp.json`. El HTTP de esta app es para ChatGPT.
