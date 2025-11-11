# 🧱 GROWS v1.0 — Cliente Técnico  

📅 **Lanzamiento oficial:** 21 de noviembre de 2025

## 🔹 Rol habilitado en esta versión

**Cliente Técnico** — primer usuario real operativo.

### Acceso y planes disponibles

Puede ingresar de forma **gratuita** o activar el **plan Starter (20 USD/mes)**.

Autenticación mediante Supabase (correo o Google).

---

## 🔹 Módulos disponibles (v1.0)

| Módulo | Descripción general | Gratis | Starter (20 USD) | Futuro |
|---------|--------------------|---------|------------------|---------|
| **Obras** | Crear y gestionar obras. Incluye carga de elementos, datos básicos y legajos. | 1 obra gratuita, carga ilimitada. | Hasta 3 obras activas. | En futuras versiones: exportación de informes. |
| **Tareas** | Organización de tareas y resumen. | Crear y visualizar. | Asignar y validar. | Próximamente: subtareas y reportes. |
| **Cuadrillas** | Gestión de equipos y socios. | ❌ | ✅ | Roles y disponibilidad (v1.2). |
| **Notificaciones** | Alertas y validaciones. | ❌ | ✅ | Integración con chat y calendario (v1.2). |
| **Cuenta** | Configuración y perfil. | ✅ | ✅ | Upgrade de plan desde perfil (v1.1). |
| **Calendario** | Fechas y tareas. | ❌ | ❌ | Disponible v1.2. |
| **Chat interno** | Comunicación entre usuarios. | ❌ | ❌ | Disponible v1.1–v1.2. |

---

## 🔹 Escalas de pago

| Plan | Precio mensual | Estado | Descripción |
|------|----------------|--------|--------------|
| **Gratis** | 0 USD | ✅ Disponible (21/11/25) | 1 obra, tareas básicas. |
| **Starter** | 20 USD | ✅ Disponible (21/11/25) | Hasta 3 obras, cuadrillas y notificaciones. |
| **Pro** | 50 USD | 🚧 En desarrollo (v1.2) | Chat, calendario, automatización. |
| **Enterprise** | 100 USD | 🔒 Plan 2026 | Reportes IA, API y análisis avanzado. |

> El flujo de upgrade de plan se activará en diciembre/enero.  
> Los usuarios no podrán cambiar de plan en el lanzamiento.

---

## 🔹 Roadmap funcional (Cliente Técnico)

| Versión | Fecha estimada | Novedades principales |
|----------|----------------|----------------------|
| **v1.0** | 21/11/25 | Obras, tareas, cuadrillas y notificaciones básicas. |
| **v1.1** | dic 2025 | Chat interno + upgrade de plan desde cuenta. |
| **v1.2** | mar 2026 | Calendario sincronizado + automatización básica. |
| **v1.3** | jun 2026 | Reportes inteligentes + subtareas. |

---

## 🔹 Notas estratégicas

- Roles y permisos manejados con **Supabase Auth + RLS**.  
- Módulos futuros se liberarán como *skills* según el plan del usuario.  
- Siempre existirá una versión gratuita para nuevos clientes técnicos.  
- El flujo de pago se implementará con **Stripe o Supabase Billing**.

---

## 🔹 Estructura técnica (resumen)

Ubicación de los componentes principales:

| Módulo | Componente | Path |
|---------|-------------|------|
| Dashboard Cliente | `ClienteDashboardPage` | `/apps/web/app/cliente/dashboard/page.tsx` |
| Tareas | `TareasSection.tsx` | `/apps/web/components/cliente/TareasSection.tsx` |
| Cuadrillas | `CuadrillasSection.tsx` | `/apps/web/components/cliente/CuadrillasSection.tsx` |
| Notificaciones | `NotificacionesSection.tsx` | `/apps/web/components/cliente/NotificacionesSection.tsx` |
| Cuenta | `page.tsx` | `/apps/web/app/cliente/cuenta/page.tsx` |

---

## 🔹 Próximos hitos

1. Finalizar documentación interna (README validado por Cursor).  
2. Deploy estable en Vercel (previo a 21/11).  
3. Activar sistema de upgrade de plan (diciembre).  
4. Iniciar desarrollo de módulos Pro (enero–junio 2026).

---

## Contexto general

GROWS conecta a Clientes Técnicos con Socios/Contratistas dentro de un mismo sistema operativo para obras. En v1.0 el foco está en que el Cliente Técnico gestione obras, tareas y cuadrillas con datos reales mientras se prepara la automatización de notificaciones y los módulos Pro.

## Estructura real del proyecto (monorepo)

```
/
├─ apps/
│  ├─ web/            → App principal (panel cliente + panel socio)
│  └─ landing/        → Landing institucional y marketing
│
├─ prisma/            → ORM, schema y migraciones
├─ scripts/           → Scripts de mantenimiento
├─ docs/              → Documentación interna
├─ dev/               → Código legacy / pruebas
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

Toda la lógica de GROWS v1.0 vive en `/apps/web`.

## Integraciones activas en v1.0

- **Supabase (Auth + DB)**: login, roles y persistencia de obras, tareas y socios.
- **n8n**: orquesta flujos de validaciones y prepara el conector del chat (se libera en v1.1).
- **Google Maps**: autocompletado y mapa en el wizard de obras; requiere `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- **Mercado Pago**: integración piloto para pruebas internas de cobro recurrente mientras se decide Stripe vs Supabase Billing.

## Organización del código

- **Cliente Técnico**: componentes dentro de `apps/web/components/cliente/*` y páginas en `apps/web/app/cliente/*`.
- **Socio Constructor**: componentes dentro de `apps/web/components/socio/*` y páginas en `apps/web/app/socio/*`.
- **Wizard de Obras**: lógica reutilizable en `apps/web/components/obras/wizard*`.

## Variables de entorno necesarias

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

## Cómo levantarlo en local

1. `pnpm install` en la raíz.
2. Crear `.env.local` con todas las claves anteriores.
3. `pnpm dev` dentro de `apps/web`.
4. Si Prisma falla, ejecutar `pnpm prisma generate`.
5. Abrir `http://localhost:3000`.

## Glosario express

- **Obra**: proyecto constructivo con tareas, cuadrillas y datos técnicos.
- **Tarea**: unidad de trabajo con prioridad y estado.
- **Socio**: contratista o líder asociado a la organización.
- **Cliente Técnico**: usuario que gestiona obras desde escritorio.
- **Cuadrilla**: equipo operativo de socios.
- **Oportunidad**: obra disponible para socios (se habilita junto al plan Pro).
- **Evento**: registro interno de actividad.
- **Wizard**: flujo guiado para crear una obra nueva.

## Estado de la base de datos

Tablas relevantes: `Organization`, `Obra`, `Tarea`, `Socio`, `Evento`, `RoadmapObjetivo`, `RoadmapGrupoTareas`, `RoadmapTarea`. Se utilizan para soportar obras múltiples y el roadmap interno.





