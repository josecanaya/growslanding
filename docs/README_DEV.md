# 🧭 GROWS – Documentación Técnica para Desarrolladores

## 🔍 Propósito del sistema

**GROWS** digitaliza la gestión constructiva entre **clientes (inversores)** y **socios constructores**.  
Centraliza el seguimiento de obras, tareas, cuadrillas y finanzas, automatizando la comunicación y control de avances.

---

## 🧱 Arquitectura General

- **Monorepo:** PNPM + Turborepo
- **Apps activas:**  
  - pps/web → paneles y frontend funcional  
  - pps/landing → sitio institucional
- **Base de datos:** Prisma ORM + Supabase
- **Automatizaciones:** n8n para flujos de tareas, correos, actualizaciones
- **Autenticación:** Supabase Auth (Google / email)
- **Despliegue:** Vercel (frontend), Supabase (DB y storage)

---

## ⚙️ Estructura funcional de pps/web

`
/app
├─ cliente/ → panel de cliente (obras, tareas, cuadrillas, validaciones)
├─ socio/ → panel de socio constructor
├─ obras/ → vistas y wizard de obras
├─ cuenta/ → cuenta y suscripción
├─ api/ → handlers API (Next.js routes)
└─ layout.tsx → layout global con theme-provider
`

---

## 🧩 Componentes activos

| Carpeta | Propósito |
|----------|------------|
| **cliente/** | Interfaces del panel cliente (dashboard, tareas, obras, modales) |
| **socio/** | Panel del socio constructor (mis tareas, oportunidades, cuenta) |
| **obras/** | Wizard de creación, timeline y listados de obras |
| **cuadrillas/** | Módulos compartidos entre cliente y socio |
| **ui/** | Biblioteca de componentes base y estilos Grows |
| **dev/** | Contiene demos, herramientas internas y código legacy |

---

## 💾 Prisma y Seeds

- **Schema principal:** /prisma/schema.prisma
- **Migraciones activas:** /prisma/migrations/
- **Seed principal:** /prisma/seed.ts
- **Seeds legacy:** /dev/seeds-legacy/ (referencia histórica)
- **Comandos:**
  `ash
  pnpm prisma migrate dev
  pnpm prisma db seed
  `

---

## 🔗 Integraciones

- **Supabase:** Base de datos + Auth + Storage.
- **n8n:** Automatización de actualizaciones (por ejemplo, cambio de estado de tarea o envío de mails).
- **Vercel:** Hosting principal.
- **Ngrok:** Túnel local para pruebas de webhooks.

---

## 🧠 Principales flujos internos

### 🔹 Cliente
- Crea o visualiza obras.
- Asigna cuadrillas o valida avances.
- Controla tareas en timeline.
- Visualiza reportes y presupuesto.

### 🔹 Socio Constructor
- Recibe tareas asignadas.
- Marca progreso, sube fotos y completa hitos.
- Visualiza ganancias, calendario y oportunidades.

---

## 🧰 Librerías clave

- Next.js / React
- TailwindCSS + ShadCN UI
- Zustand (stores locales)
- Framer Motion (animaciones)
- Lucide React (iconografía)
- Prisma ORM
- Supabase SDK

---

## 🧾 Scripts de desarrollo

`ash
pnpm dev                # inicia entorno local
pnpm build              # build de producción
pnpm prisma migrate dev # migraciones locales
pnpm prisma db seed     # ejecuta seed
pnpm lint               # linting del código
`

---

## 🧩 Deploy y ambiente

| Variable | Uso |
|----------|-----|
| NEXT_PUBLIC_SUPABASE_URL | conexión Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | API key pública |
| DATABASE_URL | conexión Prisma |
| NEXT_PUBLIC_SITE_URL | dominio base |
| VERCEL_ENV | entorno actual |

---

## 📦 Scripts auxiliares y Dev Tools

- /scripts/ → herramientas de mantenimiento (seeds, deploys, tests)
- /dev/ → contiene scripts legacy, diagnósticos y documentación técnica
- /docs/ → documentación viva del sistema

---

## 👷 Créditos

- Autor: Jose Contrera
- Año: 2025
- Proyecto: GROWS – Sistema integral de gestión constructiva
- Infraestructura: Supabase + Vercel + n8n
