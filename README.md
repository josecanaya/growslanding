# TO DO

es lo que queda pra el lanzamiento de la version v1.0

# 🧱 PLAN TÉCNICO DE LANZAMIENTO — GROWS v1.0  

📅 Del 9 al 21 de noviembre de 2025  

👷 Rol: desarrollo, diseño, documentación y publicación (individual)  

🎯 Objetivo final: App funcional en producción + Landing publicada + README y redes activas

---

## 🩵 BLOQUE 1 · ESTABILIDAD Y DATOS (9–11 NOV)

### 🎯 Objetivo general:

Asegurar la base técnica (Supabase + estructura de datos) y validar el flujo CRUD completo (Obras / Elementos / Tareas).

### 🧱 Tareas técnicas:

#### **Día 1 — Domingo 9**

- [x] Publicar teaser personal (WhatsApp o LinkedIn): “GROWS v1.0 — lanzamiento 21/11”.
- [x ] Crear archivo interno `/docs/plan_trabajo.md` (pegar este plan).
- [x ] Anotar en README las 3 funciones clave que deben mostrarse visualmente en la campaña (crear obra, organizar tareas, validar).

#### **Día 2 — Lunes 10**

- [ x] Revisar conexión Supabase:
  - [x ] Verificar `apps/web/lib/supabase.ts` y las variables:  
    `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - [x ] Testear login correo/Google y persistencia de sesión.
  - [x ] Revisar políticas RLS activas (`tareas`, `obras`, `elementos`).
- [x ] Validar escritura y lectura:
  - [x ] Crear obra → insertar datos base (`nombre`, `ubicacion`, `fecha_inicio`).
  - [x ] Crear elementos (JSON) → revisar que los campos se guarden completos.
  - [x ] Crear tarea → verificar relación `obra_id`, `responsable_id`.
- [x ] Documentar problemas detectados en `/docs/notas_supabase.md`.

#### **Día 3 — Martes 11**

- [ ] Reescribir modal de **planes (Gratis / Starter)**:
  - [ ] Revisar archivo `/components/ui/ModalPlanes.tsx` o equivalente.
  - [ ] Implementar control:
    - Plan Gratis → máximo 1 obra, sin cuadrillas ni validación.
    - Plan Starter → hasta 3 obras, con cuadrillas y validación habilitada.
  - [ ] Condicionar los botones “Asignar” y “Validar” según plan.
  - [ ] Guardar lógica en helper: `/lib/permissions.ts`.
- [ ] Crear función de verificación:

```ts
canUser(feature: string, plan: string): boolean
```

que se use globalmente para ocultar botones y rutas no permitidas.

- [ ] Testear con 2 cuentas en Supabase (Gratis y Starter).

---

## 💠 BLOQUE 2 · UNIFICACIÓN VISUAL Y PANEL SOCIO (12–14 NOV)

🎯 Objetivo general:

Consolidar la experiencia visual, limpiar estilos y dejar operativo el panel Socio.

### 🎨 Tareas técnicas:

#### **Día 4 — Miércoles 12**

- [ ] Unificar paleta en `/tailwind.config.ts`:

```js
colors: {
  growsBlue: '#0072F5',
  growsGray: '#F5F7FA',
  growsText: '#1E1E1E'
}
```

- [ ] Ajustar botones ShadCN:
  - [ ] `variant="default"` → color growsBlue
  - [ ] `variant="outline"` → borde gris + hover azul claro
- [ ] Revisar componentes:
  - [ ] `/components/ui/Button.tsx`
  - [ ] `/components/ui/Card.tsx`
  - [ ] `/components/layout/Sidebar.tsx`
- [ ] Corregir tipografías (Tailwind font-sans global).
- [ ] Capturar pantallas limpias para la landing.

#### **Día 5 — Jueves 13**

- [ ] Revisión total de panel Socio:
  - [ ] Rutas: `/app/socio/dashboard`, `/app/socio/tareas`, `/app/socio/evidencias`
  - [ ] Confirmar estructura del formulario de evidencia (foto, descripcion, fecha).
  - [ ] Revisar subida de archivos a Supabase Storage (bucket evidencias).
  - [ ] Validar que cada evidencia tenga relación con `tarea_id` y `socio_id`.
  - [ ] Revisar UI básica: colores, márgenes y tipografía coherente.
  - [ ] Agregar placeholder “Chat disponible próximamente” en sidebar.

#### **Día 6 — Viernes 14**

- [ ] Pulir landing page (`https://grows32.vercel.app/es`):
  - [ ] Agregar meta-tags (title, description, OpenGraph).
  - [ ] Insertar fecha visible: Lanzamiento 21/11.
  - [ ] Corregir textos y asegurar responsive.
  - [ ] Subir versión definitiva a Vercel.
- [ ] Crear redes oficiales:
  - [ ] Instagram → `@growsapp`
  - [ ] LinkedIn → página “GROWS Constructiva”
- [ ] Publicar teaser oficial con link a la landing.
- [ ] Guardar screenshots de la app para redes.

---

## 🧭 BLOQUE 3 · TEST, DOCUMENTACIÓN Y DEPLOY (15–18 NOV)

🎯 Objetivo general:

Dejar todo funcional, documentado y desplegado.

### 🧠 Tareas técnicas:

#### **Día 7 — Sábado 15**

- [ ] Test completo local:
  - [ ] Login, crear obra, crear tarea, asignar, validar.
  - [ ] Verificar límites de plan.
  - [ ] Comprobar roles Cliente Técnico / Socio.
  - [ ] Corregir bugs detectados.
- [ ] Ejecutar prompt de Cursor → actualizar `docs/GROWS_V1.0_README.md`.
- [ ] Crear `CHANGELOG.md` con resumen de funcionalidades.
- [ ] Guardar backup local del repo.

#### **Día 8 — Domingo 16**

- [ ] Deploy `apps/web` en Vercel:
  - [ ] Verificar variables de entorno en panel Vercel.
  - [ ] Testear login, Supabase y carga de tareas en producción.
  - [ ] Comprobar favicon, meta description, OpenGraph.
  - [ ] Capturar screenshots para redes.

#### **Día 9 — Lunes 17**

- [ ] Beta test interno:
  - [ ] Crear usuarios de prueba (`gratis@test.com`, `starter@test.com`).
  - [ ] Testear todo el flujo desde landing → login → dashboard.
  - [ ] Registrar feedback visual o funcional.
  - [ ] Corregir UX menores y textos.
  - [ ] Preparar mensaje de feedback interno (archivo `/docs/feedback_v1.0.md`).

---

## 🚀 BLOQUE 4 · PUBLICACIÓN Y DIFUSIÓN (19–21 NOV)

🎯 Objetivo general:

Cerrar la documentación, revisar visualmente y lanzar la campaña final.

### 📤 Tareas técnicas y de comunicación:

#### **Día 10 — Martes 18**

- [ ] Actualizar README y roadmap.
- [ ] Crear y subir tag de versión:

```bash
git tag -a v1.0 -m "Release GROWS v1.0"
git push origin v1.0
```

- [ ] Preparar PDF resumen o imagen promocional (logo + frase + fecha).
- [ ] Revisar links de la landing y redes.

#### **Día 11 — Miércoles 19**

- [ ] Test móvil completo (Android/iOS):
  - [ ] Verificar responsividad y touch.
  - [ ] Botones laterales y modales.
  - [ ] Ajustar últimos estilos.
- [ ] Revisión final de SEO (Google Lighthouse).
- [ ] Crear story y post pre-lanzamiento:

“🧱 Faltan 2 días. GROWS llega este jueves.”

#### **Día 12 — Jueves 20**

- [ ] Preparar publicación oficial:

Copy:

“🚀 GROWS v1.0 ya está en línea.  
Gestión constructiva simple, colaborativa e inteligente.  
Ingresá gratis desde hoy.”

- [ ] Hashtags: #GROWS #Construcción #Gestión #Startup #Obras
- [ ] Publicar en redes (LinkedIn + Instagram).
- [ ] Verificar tráfico en Supabase (users, obras).

#### **Día 13 — Viernes 21 – LANZAMIENTO OFICIAL 🎉**

- [ ] Publicar post principal + historias.
- [ ] Enviar a contactos directos (WhatsApp, grupos).
- [ ] Verificar métricas iniciales (visitas y registros).
- [ ] Cerrar la jornada con backup y checklist completado.

---

## ✅ CHECKLIST FINAL ANTES DEL LANZAMIENTO

- [ ] App cliente técnico funcional (Gratis + Starter).
- [ ] Panel socio operativo (evidencias).
- [ ] Modal de planes controlando límites.
- [ ] Supabase conectado y sin errores.
- [ ] Colores, botones y UI coherentes.
- [ ] Landing responsive y publicada.
- [ ] Redes activas y teaser en línea.
- [ ] README, CHANGELOG y roadmap actualizados.
- [ ] Deploy estable en Vercel.
- [ ] Tag v1.0 creado.
- [ ] Comunicación publicada el 21/11.
