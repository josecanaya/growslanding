# 🧱 GROWS – Sistema Integral de Gestión Constructiva

**GROWS** es una aplicación web y móvil desarrollada en **Next.js (Turborepo)** para la gestión integral de proyectos de construcción.  
Permite conectar **socios constructores** y **clientes** en un flujo digital unificado: planificación, ejecución, control de tareas, cuadrillas y seguimiento financiero.

---

## 🚀 Estructura del Monorepo

```
/
├─ apps/
│  ├─ web/ → Aplicación principal Next.js (paneles cliente y socio)
│  └─ landing/ → Landing page institucional y marketing
│
├─ prisma/ → Base de datos y ORM Prisma
│  ├─ schema.prisma → Definición de tablas y relaciones
│  ├─ migrations/ → Migraciones oficiales
│  └─ seed.ts → Seeder principal
│
├─ scripts/ → Scripts de mantenimiento y despliegue
│
├─ docs/ → Documentación técnica, flujos e integraciones
│  └─ README_DEV.md → Guía completa para desarrolladores
│
├─ dev/ → Carpeta de desarrollo / legacy (scripts antiguos, seeds de prueba, etc.)
│
├─ package.json → Dependencias y scripts raíz
├─ tsconfig.json → Configuración TypeScript global
├─ turbo.json → Configuración Turborepo (build y caching)
├─ pnpm-workspace.yaml → Definición de workspaces activos (apps/*)
└─ vercel.json → Configuración de despliegue (si se usa Vercel)
```

---

## 🧩 Roles y funcionalidades principales

| Rol | Funcionalidades clave |
|-----|------------------------|
| **Cliente** | Crear obras, gestionar cuadrillas, supervisar tareas, validar avances, emitir pagos. |
| **Socio Constructor** | Ver tareas asignadas, registrar progreso, subir evidencias, visualizar ganancias y calendario. |

El flujo general une ambos roles dentro de **una base Supabase**, sincronizada con **n8n** para automatizaciones (notificaciones, integraciones externas, reportes).

---

## 🧰 Tecnologías principales

- **Frontend:** Next.js 14 + React 18 + TailwindCSS + ShadCN UI  
- **Base de datos:** Prisma ORM + PostgreSQL (Supabase)  
- **Automatización:** n8n  
- **Hosting:** Vercel (apps) y Supabase (DB)  
- **Control de código:** GitHub + PNPM Workspaces + Turborepo  
- **Autenticación:** Supabase Auth / OAuth Google

---

## 🗂️ Convenciones de carpetas

| Carpeta | Función |
|----------|---------|
| `/apps/web/components/cliente` | Componentes activos del panel de cliente |
| `/apps/web/components/socio` | Panel del socio constructor |
| `/apps/web/components/obras` | Listados y wizard de creación de obras |
| `/apps/web/components/ui` | Sistema visual base (ShadCN + Grows custom) |
| `/apps/web/components/cuadrillas` | Widgets de cuadrillas compartidos |
| `/apps/web/lib` | Hooks, stores y servicios globales |
| `/prisma` | ORM y migraciones |
| `/scripts` | Utilidades y mantenimiento |
| `/docs` | Documentación y flujos |
| `/dev` | Material de desarrollo, seeds legacy, scripts y demos no productivos |

---

## 🧾 Scripts comunes

```
# Iniciar entorno local
pnpm dev

# Correr migraciones Prisma
pnpm prisma migrate dev

# Generar cliente Prisma
pnpm prisma generate

# Ejecutar seed
pnpm prisma db seed

# Build para producción
pnpm build
```
