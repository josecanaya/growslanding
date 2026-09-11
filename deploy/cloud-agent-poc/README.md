# Grows Cloud Worker — POC en AWS EC2

Correr el bridge de Grows en una VM Ubuntu de AWS, con una sesión de Claude Code
que vive **dentro de la VM**, para que Grows pueda usar agentes de IA aunque tu
computadora esté apagada.

**Qué demuestra esta prueba:** que una EC2 puede reemplazar físicamente a tu PC.
Nada más. No es la arquitectura cloud definitiva.

---

## Cómo funciona (una sola imagen)

```
  Vos, desde cualquier lugar
        │
        ▼
   GROWS WEB  ──────────────►  SUPABASE  (el pedido queda en la cola)
   (app.grows.com.ar)                │
                                     │  el worker pregunta "¿hay trabajo?"
                                     ▼
                          ┌──────────────────────────┐
                          │   AWS EC2 — Ubuntu       │
                          │                          │
                          │   grows-bridge.mjs       │  ← el worker (systemd)
                          │          │               │
                          │          ▼               │
                          │   claude (CLI)           │  ← tu sesión, persistente
                          └──────────┬───────────────┘
                                     │  devuelve {reply, operations}
                                     ▼
                                SUPABASE
                                     │
                                     ▼
                          GROWS WEB muestra la propuesta
                                     │
                                     ▼
                          VOS ACEPTÁS  →  cambia el Canvas
```

La EC2 **nunca** escribe en el Canvas. Solo propone. Vos seguís aceptando cada cambio.

**Lo que se instala en la VM:** dos archivos de JavaScript y Claude Code. Nada más.
Ni Next.js, ni Supabase, ni el frontend. El worker no tiene ninguna dependencia de npm.

---

## Antes de empezar

Necesitás:

- Una cuenta de AWS.
- Una cuenta de Claude **Pro, Max, Team o Enterprise**. (El plan gratuito de
  Claude.ai no incluye Claude Code.)
- Una obra ya creada en Grows.
- Saber copiar y pegar comandos en una terminal. Nada más.

Tiempo estimado la primera vez: **30–40 minutos**.

---

## PARTE 1 — AWS: crear la VM

En la consola de AWS, **EC2 → Instances → Launch instances**:

| Campo | Valor | Por qué |
|---|---|---|
| **Name** | `grows-agent-poc` | Para reconocerla |
| **AMI** | **Ubuntu Server 24.04 LTS** | Claude Code requiere Ubuntu 20.04+ |
| **Architecture** | 64-bit (x86) | También sirve ARM, pero x86 evita sorpresas |
| **Instance type** | **t3.small** | Claude Code pide 4 GB de RAM. `t3.micro` (1 GB) **no alcanza** |
| **Key pair** | Creá uno nuevo, descargá el `.pem` | Es tu llave para entrar. Si la perdés, perdés la VM |
| **Network → Allow SSH** | Marcado, **My IP** | *No* uses "Anywhere" |
| **Storage** | **20 GiB gp3** | El disco por defecto (8 GiB) queda justo |

> **Importante sobre el disco:** dejá marcado **"Delete on termination"** tal como
> viene. El disco root de EC2 es persistente ante **Stop/Start** — que es lo que
> vamos a probar. Solo se borra si hacés **Terminate**. No hace falta crear un
> volumen EBS aparte para esta prueba.

Tocá **Launch instance** y esperá a que el estado sea **Running**.

Copiá la **Public IPv4 address** que aparece en el detalle de la instancia.

### Entrar a la VM

Desde tu PC (PowerShell en Windows, Terminal en Mac/Linux), en la carpeta donde
bajaste el `.pem`:

```bash
# Solo la primera vez en Mac/Linux: proteger la llave
chmod 400 grows-agent-poc.pem

ssh -i grows-agent-poc.pem ubuntu@LA_IP_QUE_COPIASTE
```

En Windows, si `chmod` no existe, ignoralo: PowerShell no lo necesita.

La primera vez pregunta `Are you sure you want to continue connecting?` → escribí
`yes`.

Si ves un prompt tipo `ubuntu@ip-172-31-x-x:~$`, estás adentro. ✅

---

## PARTE 2 — VM: instalar el worker

Pegá esto tal cual (un solo comando):

```bash
curl -fsSL https://raw.githubusercontent.com/josecanaya/growslanding/main/deploy/cloud-agent-poc/install-ubuntu.sh -o install-ubuntu.sh && sudo bash install-ubuntu.sh
```

El instalador hace todo esto solo:

1. Verifica que el sistema y la arquitectura sirvan.
2. Crea el usuario **`grows-agent`** (la sesión de Claude va a vivir en su carpeta).
3. Instala **Node.js 22** si no está.
4. Copia el worker a `/opt/grows-agent/`.
5. Instala **Claude Code** para el usuario `grows-agent` (no como root).
6. Crea `/etc/grows-agent/grows-agent.env` vacío, con permisos restringidos.
7. Instala el servicio de systemd y lo habilita para que arranque solo al prender la VM.
8. **No arranca nada todavía** — faltan el login de Claude y la configuración.

Tarda 2–4 minutos. Al final imprime un resumen con los dos pasos que faltan.

> Si algo falla, el script se detiene con un mensaje en rojo. No sigas: mirá la
> [PARTE 8](#parte-8--errores-qué-hacer-si-algo-no-anda).

---

## PARTE 3 — CLAUDE: autenticar la sesión

Este es **el paso más importante de toda la prueba**. Lo hacés **una sola vez**.

Convertite en el usuario `grows-agent` y abrí Claude:

```bash
sudo -iu grows-agent
claude
```

> **Por qué `sudo -iu grows-agent` y no simplemente `claude`:** la sesión se guarda
> en la carpeta del usuario que la crea (`/home/grows-agent/.claude`). El servicio
> corre como `grows-agent`. Si hacés el login como `ubuntu` o como `root`, el
> servicio **no va a encontrar la sesión** y nada va a funcionar.

Claude va a imprimir algo como:

```
Browser didn't open? Use the url below to sign in:
https://claude.ai/oauth/authorize?code=true&client_id=...
```

1. **Copiá esa URL completa** y pegala en el navegador **de tu PC** (no de la VM —
   la VM no tiene navegador).
2. Iniciá sesión con tu cuenta de Claude y autorizá.
3. La página te da un **código**. Copialo.
4. Volvé a la terminal SSH y **pegá el código**. Enter.

Cuando veas el prompt de Claude, ya estás autenticado. Salí escribiendo:

```
/exit
```

Verificá que quedó bien:

```bash
claude auth status
```

Tiene que decir `"loggedIn": true`. Si dice `false`, repetí el login.

Volvé a tu usuario normal:

```bash
exit
```

---

## PARTE 4 — GROWS: conseguir la URL y el token

El worker necesita dos datos para hablar con Grows: la **URL** y un **token** que
identifica a esta VM como un dispositivo autorizado.

En tu PC, en el navegador:

1. Abrí Grows y entrá a la obra que vas a usar para la prueba.
2. Abrí el panel de Grows (el ícono del **enchufe** 🔌 arriba a la derecha del chat).
3. En la tarjeta **Anthropic · Claude**, tocá **Conectar**.
4. Va a aparecer un cuadro con un link que empieza con `grows://pair?url=…&token=…`
5. **Seleccioná ese link completo y copialo.**

> El token se muestra **una sola vez**, al crearlo. Si cerrás la ventana sin
> copiarlo, no pasa nada: tocá **Conectar** de nuevo y se genera otro.

> Como esta VM va a tomar el lugar de tu PC, ignorá el mensaje de "esperando
> respuesta" y cerrá el cuadro. La VM va a aparecer conectada en unos minutos.

Ahora, **en la terminal SSH de la VM**:

```bash
sudo bash /opt/grows-agent/pair-from-link.sh
```

Te va a pedir el link. Pegalo y Enter. El script:

- Lo interpreta y valida que el token tenga el formato correcto.
- Escribe `/etc/grows-agent/grows-agent.env` con los permisos justos
  (`root:grows-agent`, `0640` — solo root escribe, el worker lee).
- **No** muestra el token en pantalla.

---

## PARTE 5 — WORKER: verificar y arrancar

Primero el diagnóstico, que revisa todo **sin procesar ningún pedido**:

```bash
sudo bash /opt/grows-agent/check.sh
```

Lo que querés ver:

```
Grows Cloud Worker

Node               OK     v22.11.0
Config URL         OK     https://app.grows.com.ar
Config token       OK     presente (64 hex)
Claude CLI         OK     /home/grows-agent/.local/bin/claude
Claude session     OK     sesión activa
Otros proveedores  AVISO  sin Codex ni Cursor (opcional en esta POC)
Grows server       OK     dispositivo autorizado
Agent context      OK     2.3 KB

Ready.
```

`AVISO` no es un problema: Codex y Cursor son opcionales en esta prueba.
Solo importan los `OK`.

Si todo está en orden, arrancá el worker:

```bash
sudo systemctl start grows-agent
```

Y miralo funcionar en vivo:

```bash
journalctl -u grows-agent -f
```

Deberías ver:

```
Puente Grows conectado. Esperando pedidos; Ctrl+C para detener.
```

Dejá esa ventana abierta. Salís del seguimiento con **Ctrl+C** (eso no detiene el
servicio, solo deja de mostrar los logs).

---

## PARTE 6 — TEST: probar que funciona

En Grows, en la misma obra:

1. Entrá a un scope cualquiera con doble clic (por ejemplo una etapa).
2. En el selector de proveedor elegí **Anthropic · Claude**.
3. Escribí un pedido concreto. Por ejemplo:

   ```
   Creá una etapa "Búsqueda de inversores" con dos tareas adentro:
   "Preparar pitch deck" y "Reuniones con inversores", y una flecha
   de la primera a la segunda.
   ```

4. Enviá.

**Qué tiene que pasar:**

- En la terminal de la VM (`journalctl -u grows-agent -f`) aparece:
  ```
  Procesando pedido <uuid> con claude · sonnet
  Propuesta entregada para revisión humana.
  ```
- En Grows aparece la propuesta con los cambios para revisar.
- Tocás **Aceptar cambios** y los cuadros aparecen en el Canvas.

Si llegaste hasta acá: **la hipótesis está demostrada.** La EC2 reemplazó a tu PC.

---

## PARTE 7 — REBOOT: probar que la sesión sobrevive

Esto es lo que realmente queremos demostrar: que **no hay que volver a loguear
Claude nunca más**.

### TEST A — funciona de entrada

Ya lo hiciste en la PARTE 6. ✅

### TEST B — sobrevive a un reinicio

```bash
sudo reboot
```

La conexión SSH se corta. Esperá **1 minuto** y volvé a entrar:

```bash
ssh -i grows-agent-poc.pem ubuntu@LA_IP
```

Verificá el servicio **sin volver a loguear Claude**:

```bash
systemctl status grows-agent
```

Tiene que decir `active (running)`. Ahora mandá otro pedido desde Grows.

**Tiene que funcionar sin que hagas nada más.** Si te pide login otra vez, algo
está mal con el HOME del servicio (ver PARTE 8).

### TEST C — sobrevive a apagar y prender la VM

En la consola de AWS: **Instance state → Stop instance**. Esperá a `Stopped`.
Después **Instance state → Start instance**.

> **Ojo:** al prender de nuevo, **la IP pública cambia** (salvo que uses una IP
> elástica). Copiá la IP nueva del detalle de la instancia.

```bash
ssh -i grows-agent-poc.pem ubuntu@LA_IP_NUEVA
systemctl status grows-agent
```

Mandá otro pedido desde Grows. **Tiene que funcionar sin re-loguear Claude.**

Si los tres tests pasan, la persistencia de `/home/grows-agent` está demostrada.

| Acción en AWS | ¿Se conserva la sesión de Claude? |
|---|---|
| **Reboot** (desde la VM) | Sí |
| **Stop / Start** | Sí — el disco root es persistente |
| **Terminate** | **No.** Se borra el disco y hay que empezar de cero |

No hagas **Terminate** hasta terminar la prueba.

---

## PARTE 8 — ERRORES: qué hacer si algo no anda

### Comandos de diagnóstico

```bash
# ¿Está corriendo el servicio?
systemctl status grows-agent

# Logs en vivo
journalctl -u grows-agent -f

# Últimas 100 líneas
journalctl -u grows-agent -n 100 --no-pager

# Diagnóstico completo (no procesa pedidos)
sudo bash /opt/grows-agent/check.sh

# Reiniciar el worker
sudo systemctl restart grows-agent
```

### Problemas frecuentes

**El diagnóstico dice `Claude session FALTA — sin sesión`**

El login se hizo con el usuario equivocado. Rehacelo así:

```bash
sudo -iu grows-agent
claude
# seguí el flujo, después /exit
exit
sudo systemctl restart grows-agent
```

---

**El diagnóstico dice `Claude CLI FALTA — no está en el PATH`**

Instalalo como `grows-agent`:

```bash
sudo -iu grows-agent
curl -fsSL https://claude.ai/install.sh | bash
claude --version
exit
```

---

**El diagnóstico dice `Grows server FALTA — token rechazado`**

El token venció, fue revocado, o se copió mal. Generá uno nuevo desde Grows
(PARTE 4) y volvé a correr:

```bash
sudo bash /opt/grows-agent/pair-from-link.sh
sudo systemctl restart grows-agent
```

---

**En Grows la PC aparece desconectada**

El worker avisa su presencia cada 3 segundos. Si no aparece en ~30 segundos:

```bash
systemctl status grows-agent      # ¿está corriendo?
journalctl -u grows-agent -n 50 --no-pager   # ¿qué error tira?
```

Un `Puente HTTP 401` significa token inválido → generá uno nuevo.

---

**Grows dice "ese proveedor no está conectado"**

El worker detecta los CLIs **una vez cada 30 minutos** y guarda el resultado. Si
logueaste Claude *después* de arrancar el servicio, todavía no lo vio. Forzá una
nueva detección reiniciando:

```bash
sudo systemctl restart grows-agent
```

---

**El pedido queda "pendiente" y nunca avanza**

Mirá los logs mientras mandás el pedido:

```bash
journalctl -u grows-agent -f
```

Si no aparece `Procesando pedido…`, el worker no está tomando trabajos: revisá que
el token corresponda a **esta misma obra**.

---

**Quiero empezar de cero sin destruir la VM**

```bash
sudo systemctl stop grows-agent
sudo rm -f /etc/grows-agent/grows-agent.env
sudo -iu grows-agent claude auth logout   # opcional: cierra la sesión de Claude
```

Después repetí desde la PARTE 3.

---

## Preguntas razonables

**¿Cuánto cuesta tener esto prendido?**
Una `t3.small` en us-east-1 ronda los **USD 15/mes** si la dejás 24/7, más el disco
(~USD 1.60/mes por 20 GiB). Si la parás cuando no la usás, pagás solo el disco.
Verificá los precios actuales en la calculadora de AWS.

**¿El token de Grows llega a Claude?**
No. El worker filtra las variables de entorno antes de lanzar el CLI: solo le pasa
`PATH`, `HOME` y unas pocas más. `GROWS_BRIDGE_TOKEN` **nunca** se le pasa al agente.
Hay un test automático que lo verifica.

**¿La VM puede modificar mi obra sin que yo lo apruebe?**
No. El worker solo devuelve una propuesta en JSON. El Canvas cambia únicamente
cuando vos tocás "Aceptar cambios" en Grows. Es exactamente el mismo flujo que con
tu PC.

**¿Qué pasa si la VM se apaga en medio de un pedido?**
El pedido queda reservado por 10 minutos. Cuando vence, Grows lo reintenta
(hasta 3 veces). No se pierde ni se aplica a medias.

**¿Esto reemplaza a Grows Agent de escritorio?**
No. Son dos caminos para lo mismo, y conviven. La app de escritorio usa tu PC;
esta VM sirve cuando tu PC está apagada.

**¿Puedo usar Codex o Cursor acá también?**
Esta POC prueba solo Claude. El worker ya soporta los tres, así que en principio sí,
pero no está verificado en Linux todavía. Su ausencia no rompe nada.

---

## Archivos de esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `README.md` | Esta guía |
| `install-ubuntu.sh` | Prepara la VM (usuario, Node, worker, Claude, systemd) |
| `grows-agent.service` | Definición del servicio de systemd |
| `grows-agent.env.example` | Plantilla de configuración (sin secretos) |
| `pair-from-link.sh` | Convierte el link `grows://pair…` en configuración |
| `check.sh` | Atajo para correr el diagnóstico con el usuario correcto |
| `cloud-agent-check.mjs` | El diagnóstico en sí |
| `POC_RESULT.md` | Estado de la prueba y qué falta verificar |

**Lo que corre en la VM** es solo `/opt/grows-agent/grows-bridge.mjs`, que es una
copia exacta de `scripts/grows-bridge.mjs` del repo. El mismo archivo que usa la app
de escritorio en Windows.
