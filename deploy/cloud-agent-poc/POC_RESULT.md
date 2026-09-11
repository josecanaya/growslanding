# POC Grows Cloud Worker — estado

**Estado:** `READY` — listo para probar en una VM real.
**Commit preparado:** `f60c9d7`
**Branch:** `main`
**Fecha:** 2026-09-11
**Hipótesis a demostrar:** *"Grows puede mandar un job a una EC2, el bridge de la
EC2 puede usar una sesión persistente de Claude Code y devolver una propuesta
válida al Canvas."*

---

## Veredicto de la auditoría

**El bridge Node ya podía correr en Ubuntu sin modificaciones.** No hizo falta
tocar ni una línea de `scripts/grows-bridge.mjs`.

Verificación punto por punto contra el código actual:

| Requisito | Estado | Evidencia en `scripts/grows-bridge.mjs` |
|---|---|---|
| Funciona en Linux | ✅ | L19 `spawnCli`: `if (!IS_WINDOWS) return spawn(bin, args, {shell:false})` |
| No depende de Tauri | ✅ | 6 imports, todos `node:`. Cero dependencias npm |
| Usa `GROWS_BRIDGE_URL` | ✅ | L459 `config.url ?? process.env.GROWS_BRIDGE_URL` |
| Usa `GROWS_BRIDGE_TOKEN` | ✅ | L460, mismo patrón |
| Encuentra `claude` por PATH | ✅ | L229 `discoverWindowsBins` devuelve `[]` en Linux → usa `fallbackBin: 'claude'`; el spawn sin shell resuelve por PATH |
| Conserva `HOME` | ✅ | L104 `childEnvironment` incluye `HOME`, `USER` |
| Ejecuta en cwd temporal | ✅ | L381 `mkdtemp(path.join(tmpdir(), 'grows-bridge-'))` |
| Heartbeat | ✅ | L417-425, cada 10 s, con detección de `cancelled` |
| Timeout | ✅ | L416, 600000 ms |
| Cancelación | ✅ | L422 `if (state?.cancelled) terminate(...)` |
| Descarga agent-context | ✅ | L474 + refresh cada 30 min |
| Compacta contexto | ✅ | L116 `compactJobContext` |
| Valida la respuesta | ✅ | L52 `validateResult` |
| complete/fail correcto | ✅ | L496-500, verifica `ok === false \|\| cancelled` |
| Token NO llega a Claude | ✅ | L104: la allowlist **no** incluye `GROWS_BRIDGE_TOKEN`. Cubierto por test |
| Atiende SIGTERM | ✅ | L483 `process.once('SIGTERM', ...)` |

**Conclusión:** la hipótesis es correcta a nivel de código. Lo único que faltaba
era el envoltorio operativo (systemd, usuario, configuración, diagnóstico), que es
lo que agrega esta POC.

---

## Qué está listo

### Archivos creados

| Archivo | Qué hace |
|---|---|
| `README.md` | Guía end-to-end en 8 partes, para alguien que no administra servidores |
| `install-ubuntu.sh` | Prepara la VM: usuario, Node 22, worker, Claude Code, systemd |
| `grows-agent.service` | Unit de systemd (User=grows-agent, HOME/PATH explícitos) |
| `grows-agent.env.example` | Plantilla de config sin secretos |
| `pair-from-link.sh` | Convierte el link `grows://pair…` en `/etc/grows-agent/grows-agent.env` |
| `check.sh` | Atajo que corre el diagnóstico con el usuario y HOME correctos |
| `cloud-agent-check.mjs` | Diagnóstico: Node, config, Claude, sesión, servidor, contrato |
| `cloud-agent-poc.test.mjs` | 9 tests de coherencia y no filtración |
| `../.gitattributes` | Fuerza LF en `.sh` y `.service` |

### Archivos modificados

**Ninguno.** Ni el worker, ni la app web, ni Tauri, ni el Canvas, ni el modelo de
datos. La POC es puramente aditiva.

### Tests

```
deploy/cloud-agent-poc/cloud-agent-poc.test.mjs    9 pass / 0 fail
scripts/grows-bridge.test.mjs                      6 pass / 0 fail   (sin regresión)
```

Ejecutados en Windows con Node v22.11.0.

### Decisiones tomadas

**Solo 2 archivos van a la VM** (`grows-bridge.mjs` y `cloud-agent-check.mjs`).
El worker es autocontenido: 6 imports, todos built-in de Node, cero paquetes npm.
No se instala Next.js, Supabase SDK, Prisma ni el frontend.

**Diagnóstico como script separado**, no como flag `--check` del bridge. Así no se
toca el core (menor riesgo de romper Windows) y el check reutiliza
`detectCapabilities()` y `fetchAgentContext()` en vez de reimplementarlos.

**El diagnóstico verifica el device con una acción inválida** (`__diagnostico__`).
El endpoint valida el token antes que el esquema del cuerpo, así que un `400`
confirma credencial válida sin reclamar ni modificar ningún job. Un `401` significa
token rechazado.

**Pairing sin cambios en la web.** La UI ya muestra el link
`grows://pair?url=…&token=…` en pantalla al tocar "Conectar"
(`GrowsCommandBar.tsx` L118). `pair-from-link.sh` lo parsea. No hizo falta agregar
ninguna pantalla de admin ni endpoint nuevo.

**Instalación de Claude Code verificada en la documentación oficial**, no inventada:
`curl -fsSL https://claude.ai/install.sh | bash` (code.claude.com/docs/en/setup).
Se ejecuta como `grows-agent` para que la sesión quede en su HOME. El **login es
manual** por diseño: requiere el flujo OAuth del navegador y no se puede automatizar.

**Hardening de systemd deliberadamente mínimo:** solo `NoNewPrivileges=true`. No se
usan `ProtectHome` ni `ProtectSystem=strict` porque romperían el acceso a
`~/.claude` (credenciales) y a `~/.local/share/claude` (auto-updater). Priorizamos
POC funcional sobre sandbox, como se pidió.

### Un bug encontrado y corregido durante la preparación

Git estaba guardando los `.sh` y el `.service` con **CRLF** (por `core.autocrlf` en
Windows). En Linux eso habría fallado con `bash: \r: command not found` y el unit
de systemd no habría cargado. Se agregó `deploy/.gitattributes` con `eol=lf` y se
reindexaron los archivos. Verificado: los blobs de git ahora tienen LF.

---

## Qué tenés que hacer vos, a mano

Nada de esto se puede automatizar desde acá.

### 1. En AWS

Crear la instancia EC2. Detalle completo en `README.md` → PARTE 1.

- **AMI:** Ubuntu Server 24.04 LTS
- **Tipo:** `t3.small` — **`t3.micro` no sirve**, Claude Code pide 4 GB de RAM
- **Disco:** 20 GiB gp3
- **Security group:** SSH solo desde tu IP
- Guardar el `.pem`

### 2. En la VM

```bash
curl -fsSL https://raw.githubusercontent.com/josecanaya/growslanding/main/deploy/cloud-agent-poc/install-ubuntu.sh -o install-ubuntu.sh && sudo bash install-ubuntu.sh
```

### 3. Autenticar Claude (una sola vez)

```bash
sudo -iu grows-agent
claude
# pegás la URL en el navegador de TU PC, copiás el código, lo pegás acá
/exit
exit
```

**Crítico:** tiene que ser con `sudo -iu grows-agent`. Si lo hacés como `ubuntu` o
`root`, el servicio no va a encontrar la sesión.

### 4. Configurar URL y token

En Grows: panel del enchufe → **Conectar** en Anthropic · Claude → copiar el link
`grows://pair?url=…&token=…`. Después, en la VM:

```bash
sudo bash /opt/grows-agent/pair-from-link.sh
```

### 5. Verificar y arrancar

```bash
sudo bash /opt/grows-agent/check.sh      # tiene que decir "Ready."
sudo systemctl start grows-agent
journalctl -u grows-agent -f
```

---

## Qué falta probar en la VM real

Nada de esto pude verificarlo desde Windows. Son los criterios de aceptación:

| # | Qué verificar | Cómo |
|---|---|---|
| 1 | `install-ubuntu.sh` corre limpio en Ubuntu 24.04 | Ver que termine sin rojo |
| 2 | Node 22 se instala desde NodeSource | `node --version` |
| 3 | Claude Code se instala como `grows-agent` | `sudo -iu grows-agent claude --version` |
| 4 | El login OAuth funciona headless | PARTE 3 del README |
| 5 | El diagnóstico da `Ready.` | `sudo bash /opt/grows-agent/check.sh` |
| 6 | El servicio arranca y no corre como root | `systemctl status grows-agent` → `User=grows-agent` |
| 7 | La VM aparece conectada en Grows | Panel del enchufe, en ~30 s |
| 8 | **TEST A** — un job end-to-end devuelve propuesta | README PARTE 6 |
| 9 | La propuesta requiere aceptación humana | No debe aplicarse sola |
| 10 | **TEST B** — sobrevive `sudo reboot` sin re-login | README PARTE 7 |
| 11 | **TEST C** — sobrevive Stop/Start de EC2 sin re-login | README PARTE 7 |
| 12 | Heartbeat mantiene el job vivo >30 s | Pedido complejo; no debe pasar a `failed` |
| 13 | Cancelar desde Grows mata el proceso en la VM | `ps aux \| grep claude` tras cancelar |
| 14 | Los logs no filtran el token ni los prompts | `journalctl -u grows-agent \| grep -i token` |

**Los tests 10 y 11 son el corazón de la POC.** Si la sesión de Claude sobrevive a
un reboot y a un Stop/Start sin volver a autenticar, la hipótesis queda demostrada.

---

## Riesgos conocidos

**Detección de CLIs con cache de 30 minutos.** `detectCapabilities` cachea el
resultado (L305). Si autenticás Claude *después* de arrancar el servicio, Grows
puede tardar hasta 30 min en ver el proveedor. **Mitigación:** hacer el login antes
de arrancar, o `sudo systemctl restart grows-agent` para forzar la re-detección.
Documentado en el README, PARTE 8.

**`TimeoutStopSec=120` con jobs largos.** Un job puede tardar hasta 10 min. Si
parás el servicio en medio, systemd lo mata a los 2 min. **No se pierde trabajo:**
el server reintenta cuando vence el lease (`claim_grows_bridge_job` permite hasta
3 intentos).

**La IP pública cambia con Stop/Start.** Sin IP elástica, hay que buscar la IP
nueva para volver a entrar por SSH. No afecta al worker (él sale hacia Grows, no
recibe conexiones). Documentado en el README, PARTE 7.

**Costo si queda encendida.** `t3.small` 24/7 ≈ USD 15/mes + ~USD 1.60 de disco.
Parada, solo se paga el disco.

**Terminate destruye la sesión.** El disco root tiene `Delete on termination`
activado por defecto. Stop/Start conserva todo; Terminate obliga a rehacer desde
cero. Advertido en el README.

---

## Qué NO se modificó

Nada de esto se tocó, tal como se pidió:

- `scripts/grows-bridge.mjs` — **cero cambios**. Windows y Tauri intactos
- `bridge-tauri/` — Grows Agent Desktop sigue igual
- El Canvas y su modelo de cuadros dentro de cuadros
- `apps/web/lib/bridge/operations.ts` y el aplicador de operaciones
- Los endpoints `/api/bridge/worker`, `/api/bridge/agent-context`, `/api/obras/[id]/bridge`
- `grows_bridge_devices`, `grows_bridge_jobs`, `claim_grows_bridge_job`,
  `apply_grows_bridge_job` — **el modelo device→obra sigue igual**
- La UI de Grows — ni un componente modificado
- Tareas, socios, cliente, presupuestos, wallet, IFC

---

## Qué NO se construyó (a propósito)

Fuera de alcance hasta que confirmes que la prueba funcionó:

- Multi-obra por device
- Runtime cloud definitivo, multi-tenancy, pools de workers
- Arranque/apagado de la EC2 desde Grows
- Terraform, CloudFormation, contenedores, ECS, Lambda, Kubernetes
- Credenciales por usuario, Secrets Manager, SSM
- WebSockets, MCP, Redis, colas nuevas
- Snapshots automáticos, volumen EBS separado
- Codex y Cursor en Linux (el worker los soporta, pero no están verificados ahí;
  su ausencia no rompe nada — el diagnóstico los marca como `AVISO`)

---

## Arquitectura demostrada

```
GROWS WEB
    │
    ▼
SERVER / SUPABASE  (grows_bridge_jobs)
    │
    │  /api/bridge/worker   (claim → heartbeat → complete)
    ▼
AWS EC2 UBUNTU
    │  systemd: grows-agent (User=grows-agent, HOME=/home/grows-agent)
    │  /opt/grows-agent/grows-bridge.mjs
    ▼
CLAUDE CODE CLI  (sesión persistente en /home/grows-agent/.claude)
    │
    ▼
JSON {reply, operations}
    │
    ▼
SERVER  (valida con bridgeResultSchema)
    │
    ▼
REVISIÓN HUMANA  ← el Canvas no cambia sin esto
    │
    ▼
CANVAS
```

La EC2 se comporta ante Grows **exactamente como una PC conectada**. Usa los mismos
endpoints, la misma cola y el mismo contrato. No hay ningún camino nuevo.

---

## Siguiente paso

1. Seguir el `README.md` de punta a punta en una VM real.
2. Correr los tests A, B y C.
3. Contarme qué falló, si algo falló.

**Recién después** de que confirmes que la EC2 ejecutó Claude y devolvió una
propuesta al Canvas, tiene sentido discutir multiobra, runtime cloud definitivo y
automatización de infraestructura.
