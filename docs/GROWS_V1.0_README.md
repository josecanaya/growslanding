🧱 GROWS v1.0 – README MIXTO (Técnico + en criollo)

Estado: v1.0 estable  
Última actualización: 2025  
Tecnologías base: Next.js 14, Supabase, Prisma, Tailwind, ShadCN UI

✅ 1) Qué es GROWS (versión corta y clara)

GROWS es una plataforma web que une a Clientes Técnicos (quienes gestionan obras) con Socios/Contratistas (quienes ejecutan tareas) dentro de un mismo sistema en tiempo real.

Funciona así:

- El Cliente controla obras, cuadrillas, tareas, calendario, chat y notificaciones desde su panel con sidebar.
- El Socio usa un panel móvil para ver sus trabajos diarios, marcar progresos y acceder a oportunidades.
- Ambos comparten autenticación Supabase, base de datos unificada y automatizaciones con n8n.

✅ 2) Estructura real del proyecto (monorepo)
```
/
├─ apps/
│  ├─ web/            → App principal (panel cliente + panel socio)
│  └─ landing/        → Landing institucional y marketing
│
├─ prisma/            → ORM, schema y migraciones
│
├─ scripts/           → Scripts de mantenimiento
├─ docs/              → Documentación interna
├─ dev/               → Código legacy / pruebas
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

Todo GROWS v1.0 vive realmente en `/apps/web`.

✅ 3) Cómo funciona GROWS para el CLIENTE

El Cliente Técnico entra en `/cliente/dashboard`.

Ese dashboard:

- Tiene un `SidebarClienteTecnico` fijo.
- No cambia de página: cambia sections internas con `activeSection`.

Las secciones vivas son:

| Sección | Componente real | Qué hace hoy |
| --- | --- | --- |
| Chat | `ChatSection` | Envía y recibe mensajes desde n8n |
| Obras | `ObrasSection` | Lista obras desde Supabase y permite crear nuevas |
| Tareas | `TareasSection` | Muestra tareas por obra, estados y prioridades |
| Cuadrillas | `CuadrillasSection` | KPIs, listado, invitación de socios |
| Notificaciones | `NotificacionesSection` | Bandeja basada en mocks |
| Calendario | `CalendarioSection` | Vista mensual y semanal con datos mock |
| Cuenta | `CuentaSection` | Perfil y ajustes |

Las secciones funcionan dentro del mismo archivo `apps/web/app/cliente/dashboard/page.tsx`.

✅ 4) Cómo funciona GROWS para el SOCIO (contratista)

El socio entra en `/socio/panel`.

Ese panel:

- Tiene un top bar móvil, menú lateral y botones de conexión/pausa.
- Guarda el estado en `localStorage`.

Las secciones activas son:

| Sección | Componente | Qué hace hoy |
| --- | --- | --- |
| Mis Tareas | `MisTareas` | Obtiene tareas reales desde Supabase por socio |
| Obras/Oportunidades | `sections/Obras.tsx` | Lista obras disponibles (mock) |
| Perfil | `TopBar`/Perfil | Ajustes básicos |
| Notificaciones | (no tiene sección completa todavía) | Parcial |

✅ 5) Integraciones reales en v1.0

- **Supabase (Auth + DB)**  
  Maneja login, roles y onboarding. Tablas principales: `obras`, `tareas`, `socios`, `eventos`. Panel cliente y socio consultan la DB directo desde componentes.

- **n8n**  
  Usado para el chat (envía payload al webhook) y futuros flujos de notificaciones/automatizaciones.

- **Google Maps**  
  En el wizard de obras: autocomplete real + modal con mapa. Requiere `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

- **Mercado Pago**  
  Implementación parcial para pagos recurrentes. Solo funciona con tokens reales.

✅ 6) Organización del código (uso real)

- **Cliente Técnico**  
  Componentes en `apps/web/components/cliente/*` (ObrasSection, TareasSection, CalendarioSection, NotificacionesSection, CuadrillasSection, ChatSection, CuentaSection).

- **Socio Constructor**  
  Componentes en `apps/web/components/socio/*` (MisTareas, Obras, TopBar, Panel principal).

- **Wizard de Obras**  
  En `apps/web/components/obras/wizard/*` (Datos básicos, dirección + autocomplete, modal mapa, avances, configuración).

✅ 7) Qué se puede hacer hoy (v1.0 exacto)

**Cliente**
- Crear obras (con dirección y coordenadas)
- Ver obras reales desde Supabase
- Ver todas las tareas asociadas
- Filtrar tareas por estado y prioridad
- Ver calendario (mock)
- Gestionar cuadrillas
- Leer y enviar chat por n8n
- Acceder a cuenta y perfil

**Socio**
- Conectarse/desconectarse
- Ver tareas reales asignadas
- Marcar progreso
- Ver obras disponibles (mock)
- Ver perfil
- Navegar con panel móvil

✅ 8) Qué NO hace todavía (limitaciones v1.0)

- Calendario del cliente → usa mock data
- Notificaciones → mock data
- Oportunidades de socio → mock data + sin flujo real
- Billetera → aún no existe
- Dashboard multi–organización → aún no existe
- Chat depende 100% de que n8n esté online

✅ 9) Estado de la base de datos (resumen limpio)

Tablas relevantes:
- `Organization`
- `Obra`
- `Tarea`
- `Socio`
- `Evento`
- `RoadmapObjetivo` / `RoadmapGrupoTareas` / `RoadmapTarea` (todavía no usados en UI)

Campos clave:
- `Obra` → dirección, coordenadas, superficie, fechas
- `Tarea` → estado, prioridad, fechas, responsable
- `Socio` → relación con organización
- `Evento` → actividades registradas por Cliente

✅ 10) Variables de entorno necesarias

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_N8N_WEBHOOK_URL
N8N_WEBHOOK_TOKEN
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
MP_ACCESS_TOKEN
MP_PUBLIC_KEY
NEXT_PUBLIC_APP_URL
```

✅ 11) Cómo levantarlo en local (corto y simple)

1. `pnpm install` en la raíz.
2. Crear `.env.local` con todas las keys.
3. `pnpm dev` dentro de `apps/web`.
4. Si hay errores de Prisma → `pnpm prisma generate`.
5. Abrir `http://localhost:3000`.

✅ 12) Glosario express

- **Obra**: Proyecto constructivo con tareas, cuadrillas y datos técnicos.
- **Tarea**: Unidad de trabajo con prioridad y estado.
- **Socio**: Contratista/líder asociado a la organización.
- **Cliente Técnico**: Usuario que gestiona obras desde panel de escritorio.
- **Cuadrilla**: Equipo operativo de socios.
- **Oportunidad**: Obra disponible para socios (en v1.0 es mock).
- **Evento**: Registro interno de actividad.
- **Wizard**: Flujo de creación de obra.

✅ README v1.0 FINALIZADO
