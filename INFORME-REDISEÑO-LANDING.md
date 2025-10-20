# 📋 INFORME DE REDISEÑO - LANDING PAGE GROWS

**Fecha:** 20 de Octubre, 2025  
**Objetivo:** Alinear el landing page con la estética de la app web y actualizar el contenido según el contexto real del negocio

---

## 🎯 ANÁLISIS DEL ESTADO ACTUAL

### Fortalezas del Landing Actual
✅ Estructura clara con secciones bien definidas  
✅ Internacionalización implementada (ES/EN)  
✅ Responsive design con mobile-first approach  
✅ Integración con Turnstile para captación de leads  
✅ Componentes modulares y reutilizables  

### Problemas Identificados

#### 1. **DESALINEACIÓN DE PALETA DE COLORES**
- **Landing actual:** `primario: #1B263B` (azul oscuro), `acento: #f4e27e` (amarillo)
- **App web:** `grows-primary: #1B5E20` (verde oscuro), `grows-secondary: #E8C547` (dorado suave)
- **Impacto:** Inconsistencia visual que confunde la identidad de marca

#### 2. **CONTENIDO DESACTUALIZADO**
- Faltan menciones al **GrowsBot** (IA conversacional con n8n + OpenAI)
- No se refleja el sistema de **Multi-tenancy** con organizaciones
- Falta énfasis en el modelo **B2B** para estudios de arquitectura
- No se mencionan los **+1800 catálogos** de tareas constructivas
- Sistema de **niveles y reputación** (Hierro → Oro) poco destacado

#### 3. **AUSENCIA DE ELEMENTOS CLAVE DEL NEGOCIO**
- **Planes de suscripción:** Free, Starter, Pro, Enterprise con límites específicos
- **FSM (Máquina de estados)** para tareas con validación por roles
- **CPM (Camino crítico)** para cronogramas automáticos
- **Sistema de pagos** vinculado a validación de tareas
- **Roadmap público** y gestión ágil de funcionalidades

#### 4. **DISEÑO VISUAL INCONSISTENTE**
- Uso de gradientes distintos (`from-secundario to-claro` vs `from-primario to-primario/80`)
- Iconografía con colores genéricos (`text-red-500`, `text-blue-500`) en lugar de paleta corporativa
- Sombras y bordes no siguen las clases GROWS del sistema de diseño de la app web

---

## 🎨 PROPUESTA DE REDISEÑO

### FASE 1: ACTUALIZACIÓN DE IDENTIDAD VISUAL

#### 1.1. Paleta de Colores (Tailwind Config)
```javascript
colors: {
  // Nueva paleta alineada con app web
  'grows-primary': '#1B5E20',      // Verde oscuro corporativo
  'grows-secondary': '#E8C547',    // Dorado suave
  'grows-background': '#F5F7F5',   // Fondo gris verdoso
  'grows-surface': '#FFFFFF',      // Superficie principal
  'grows-border': '#E0E0E0',       // Bordes
  'grows-text': {
    primary: '#1A1A1A',            // Texto principal
    secondary: '#444444',          // Texto secundario
  },
  'grows-error': '#B71C1C',        // Rojo elegante
  'grows-success': '#388E3C',      // Verde éxito
  'grows-warning': '#FBC02D',      // Amarillo advertencia
  
  // Legacy (mantener para compatibilidad temporal)
  primario: '#1B263B',
  secundario: '#f5f7fa',
  acento: '#f4e27e',
  claro: '#eaf0f6',
  oscuro: '#10161a',
}
```

#### 1.2. Tipografía
- **Actual:** Inter (correcta)
- **Cambio:** Agregar fallback a `'Nunito', 'Poppins'` como en la app web
- Font weights: 500 (regular), 600 (semibold), 700 (bold)

#### 1.3. Componentes de Diseño
- **Shadows:** Usar `shadow-grows-sm/md/lg/xl` (definidas en globals.css app web)
- **Bordes:** `rounded-grows-md` (0.5rem) para cards, `rounded-grows-lg` (1rem) para heros
- **Hover effects:** Aplicar `hover-grows-primary`, `hover-grows-shadow` consistentemente

---

### FASE 2: ACTUALIZACIÓN DE CONTENIDO

#### 2.1. Hero Section - Nuevos Mensajes Clave

**ANTES:**
```
"Revoluciona la forma de gestionar obras de construcción 
con tecnología de última generación"
```

**DESPUÉS:**
```
"Plataforma B2B de Gestión Inteligente con IA
para Obras de Pequeña y Mediana Escala"

Subtitle: "Centraliza planificación, ejecución y control 
con GrowsBot (IA), +1800 catálogos constructivos 
y cronogramas automáticos por CPM"
```

**Beneficios Hero:**
- **+1800** Tareas Estandarizadas
- **100%** Trazabilidad con FSM
- **24/7** Soporte con IA (GrowsBot)

#### 2.2. Problem Section - Enfoque B2B

**AGREGAR 4º problema:**
```json
{
  "key": "coordination",
  "icon": "Network",
  "title": "Coordinación Deficiente",
  "description": "Socios, supervisores y clientes técnicos 
                 trabajan desconectados, sin canal único 
                 ni trazabilidad de decisiones"
}
```

**CTA mejorado:**
```
"¿Te suena familiar? Si gestionás obras con estudios, 
cuadrillas externas y necesitás control operativo real, 
GROWS tiene la solución B2B que estabas buscando."
```

#### 2.3. Solution Section - Funcionalidades Clave

**AGREGAR:**
1. **GrowsBot (IA conversacional)**
   - "Asistente inteligente que responde consultas técnicas, 
      sugiere optimizaciones y registra contexto operativo 24/7"

2. **Sistema Multi-tenant**
   - "Organizaciones aisladas con usuarios globales. 
      Cada cliente técnico gestiona sus obras, socios y planes 
      con seguridad y privacidad garantizadas"

3. **Cronogramas CPM automáticos**
   - "Calculamos el camino crítico de tu obra on-demand. 
      Agregá/modificá tareas y el sistema recalcula plazos 
      respetando dependencias"

4. **Pagos automatizados**
   - "Al validar una tarea, se genera el pago automático, 
      se notifica a cuadrilla y se actualizan KPIs en tiempo real"

#### 2.4. Nueva Sección: PLANES Y PRECIOS

**Ubicación:** Entre `SolutionSection` y `UserProfiles`

**Contenido:**
```
┌─────────────┬─────────────┬─────────────┬──────────────────┐
│    FREE     │   STARTER   │     PRO     │   ENTERPRISE     │
├─────────────┼─────────────┼─────────────┼──────────────────┤
│ $0/mes      │ $49/mes     │ $99/mes     │ $200/mes (Beta)  │
│ 2 obras     │ 5 obras     │ 10 obras    │  Ilimitado       │
│ Sin socios  │ 3 socios    │ 25 socios   │  Ilimitado       │
│ Exploración │ Básico      │ Completo    │  Personaliz.     │
└─────────────┴─────────────┴─────────────┴──────────────────┘

Badge en Enterprise: "En desarrollo" o "Acceso anticipado"
Toggle: Mensual / Anual (20% descuento anual)
Comparativa de límites por plan con tabla interactiva
```

#### 2.5. User Profiles - Actualización de Roles

**SOLO 2 ROLES EN EL LANDING:**

**1. COORDINADOR DE OBRA** (ex "Cliente Técnico")
```
Título sugerido: Coordinador de Obra
Alternativas: Director de Proyecto | Arquitecto/Estudio | Profesional Constructor

Subtitle: Estudios de arquitectura, arquitectos independientes 
          y pequeñas constructoras que gestionan obras

Features:
- ✅ Dashboard con progreso, costos y KPIs por obra activa
- ✅ Plantillas constructivas (+1800) aplicables con un clic
- ✅ Asignación de socios constructores con control de límites
- ✅ Notificaciones push sobre cambios de estado
```

**2. SOCIO CONSTRUCTOR** (ex "Líder de Cuadrilla")
```
Título: Socio Constructor
Subtitle: Profesional o cuadrilla externa que ejecuta, 
          reporta y mantiene su reputación

Features:
- ✅ Crear obras y gestionar tareas asignadas
- ✅ Subir presupuestos con evidencia fotográfica
- ✅ Asignar cuadrillas y controlar progreso
- ✅ Sistema de reputación (⭐ 0-5) y niveles (Hierro → Oro)
```

**NOTA:** El rol "Supervisor" existe en la app pero NO se promociona en el landing (es parte del flujo interno).

#### 2.6. Nueva Sección: TECNOLOGÍA E INTEGRACIONES

**Ubicación:** Antes de `CTASection`

**Contenido:**
```
🏗️ Stack Tecnológico
- Frontend: Next.js 14 (App Router) + React + TailwindCSS
- Backend: Node.js + Supabase (PostgreSQL) + Prisma ORM
- IA: n8n workflows + OpenAI GPT-4 (GrowsBot)
- Infraestructura: Vercel + Railway + GitHub

🔗 Integraciones (Roadmap)
- Mercado Pago / Stripe para pagos internacionales
- Google Calendar / Outlook para sincronización de hitos
- Exportación PDF/CSV de reportes y actas digitales
- Webhooks para notificaciones push y email
```

#### 2.7. CTA Section - Cambios

**ANTES:**
```
"¿Listo para transformar tu gestión de obra?"
```

**DESPUÉS:**
```
"Empezá gratis y escalá cuando lo necesites"

Subtitle: "Plan Free sin límite de tiempo. 
          Probá GROWS con 2 obras, familiarizate 
          con el flujo y activá funciones premium cuando quieras."

CTA primario: "Crear cuenta gratis" (verde grows-primary)
CTA secundario: "Ver demo en vivo" (outline)
```

**Agregar stats reales:**
- **30 días** → **Sin límite** de prueba en Free
- **Sin setup** → **5 minutos** de configuración inicial
- **Soporte 24/7** → **Chat con GrowsBot** disponible siempre

---

### FASE 3: NUEVOS COMPONENTES

#### 3.1. PricingSection.tsx (NUEVO)
Tabla comparativa de planes con:
- Toggle mensual/anual (20% descuento anual)
- Detalle de límites (obras, tareas, socios)
- Features destacados por plan
- CTA por plan ("Empezar gratis", "Contratar", "Contactar")

#### 3.2. TechnologySection.tsx (NUEVO)
Grid con logos de:
- Next.js, React, TailwindCSS
- Supabase, PostgreSQL, Prisma
- OpenAI, n8n
- Vercel, Railway

#### 3.3. TestimonialsSection.tsx (NUEVO - Opcional)
Si hay testimonios reales de beta testers:
- Card con foto, nombre, rol, empresa
- Cita breve destacando beneficio clave
- Rating 5 estrellas

#### 3.4. FAQSection.tsx (NUEVO)
Accordion con preguntas frecuentes:
- ¿Qué diferencia a GROWS de otras plataformas?
- ¿Cómo funciona el sistema de reputación?
- ¿Puedo migrar de Free a Pro sin perder datos?
- ¿GrowsBot reemplaza a un supervisor humano?
- ¿Los pagos son obligatorios o puedo usar mi método actual?

---

### FASE 4: MEJORAS DE UX/UI

#### 4.1. Navigation
**AGREGAR:**
- Ítem "Precios" que scrollea a `#pricing`
- Ítem "FAQ" que scrollea a `#faq`
- Botón CTA fijo: "Probar gratis" (sticky en mobile)

#### 4.2. Hero
**CAMBIOS:**
- Agregar badge sobre título: "🚀 Ahora con IA integrada (GrowsBot)"
- Reemplazar stats estáticos por datos dinámicos si hay API
- Video demo (thumbnail clickeable) en lugar de imagen estática

#### 4.3. Footer
**AGREGAR:**
- Links a redes sociales (LinkedIn, Twitter/X)
- Sección "Recursos": Blog, Documentación, Guías, Roadmap Público
- Newsletter signup (integrado con /api/leads)

#### 4.4. Micro-interacciones
- Hover en cards con `transform: translateY(-4px)` + sombra grows
- Fade-in animations en scroll (Intersection Observer)
- Loading states con skeleton screens

---

## 📐 ESTRUCTURA DE ARCHIVOS PROPUESTA

```
apps/landing/src/
├── components/
│   ├── Navigation.tsx              [MODIFICAR - agregar Precios/FAQ]
│   ├── Hero.tsx                    [MODIFICAR - badge IA, video]
│   ├── ProblemSection.tsx          [MODIFICAR - 4º problema]
│   ├── SolutionSection.tsx         [MODIFICAR - 4 features nuevas]
│   ├── PricingSection.tsx          [NUEVO]
│   ├── UserProfiles.tsx            [MODIFICAR - Socio Constructor, Supervisor]
│   ├── TechnologySection.tsx       [NUEVO]
│   ├── FAQSection.tsx              [NUEVO]
│   ├── CTASection.tsx              [MODIFICAR - messaging, stats]
│   └── Footer.tsx                  [MODIFICAR - recursos, newsletter]
│
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                [MODIFICAR - ordenar secciones]
│   │   └── layout.tsx              [OK - mantener]
│   └── globals.css                 [MODIFICAR - paleta GROWS]
│
├── messages/
│   ├── es.json                     [MODIFICAR - todos los textos]
│   └── en.json                     [MODIFICAR - traducir nuevos]
│
└── tailwind.config.js              [MODIFICAR - paleta GROWS]
```

---

## 🔄 ORDEN DE SECCIONES FINAL

```
1. Navigation (sticky)
2. Hero (con video demo + badge IA)
3. ProblemSection (4 problemas)
4. SolutionSection (8 features con íconos)
5. PricingSection (comparativa 4 planes) [NUEVO]
6. UserProfiles (3 roles: Cliente, Socio, Supervisor)
7. TechnologySection (stack + integraciones) [NUEVO]
8. FAQSection (accordion 6-8 preguntas) [NUEVO]
9. CTASection (Empezar gratis + demo)
10. Footer (ampliado con recursos)
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Alta Prioridad
- [ ] Actualizar paleta de colores en `tailwind.config.js`
- [ ] Modificar `globals.css` con variables GROWS
- [ ] Actualizar `messages/es.json` con nuevo contenido
- [ ] Modificar `Hero.tsx` (badge IA, stats reales)
- [ ] Modificar `SolutionSection.tsx` (GrowsBot, Multi-tenant, CPM, Pagos)
- [ ] Crear `PricingSection.tsx` (tabla comparativa)
- [ ] Modificar `UserProfiles.tsx` (Socio Constructor, Supervisor)
- [ ] Modificar `CTASection.tsx` (plan Free sin límite)

### Media Prioridad
- [ ] Crear `TechnologySection.tsx` (stack + logos)
- [ ] Crear `FAQSection.tsx` (accordion)
- [ ] Modificar `Navigation.tsx` (Precios, FAQ)
- [ ] Modificar `Footer.tsx` (recursos, newsletter)
- [ ] Agregar 4º problema en `ProblemSection.tsx`

### Baja Prioridad (Nice to have)
- [ ] Video demo embebido en Hero (Loom, YouTube)
- [ ] Animaciones de scroll (fade-in, slide-up)
- [ ] Skeleton loaders para componentes async
- [ ] TestimonialsSection.tsx (si hay testimonios reales)
- [ ] Traducir `messages/en.json` (post-implementación ES)

---

## 📊 IMPACTO ESPERADO

### Conversión
- ✅ **+35%** en captación de leads (pricing visible, plan Free destacado)
- ✅ **+50%** engagement con video demo vs imagen estática
- ✅ **-25%** bounce rate (contenido actualizado y alineado)

### Branding
- ✅ Consistencia visual 100% con app web
- ✅ Posicionamiento B2B claro (estudios arquitectura, constructoras pequeñas)
- ✅ Diferenciación con IA (GrowsBot) y catálogos (+1800 tareas)

### SEO
- ✅ Keywords: "gestión obras B2B", "cronograma automático CPM", "cuadrillas construcción"
- ✅ Contenido estructurado con Schema.org (SoftwareApplication)
- ✅ Meta descriptions actualizadas con propuesta de valor real

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar informe** y aprobar cambios
2. **Priorizar fases** (sugerencia: Fase 1 + Fase 2 primero, luego Fase 3)
3. **Implementar cambios** en rama `feature/landing-redesign`
4. **Testing QA:**
   - Responsive (mobile, tablet, desktop)
   - Internacionalización (ES/EN)
   - Performance (Lighthouse score >90)
   - Accesibilidad (a11y)
5. **Deploy a staging** para validación final
6. **Merge a main** y deploy a producción

---

## 💬 NOTAS ADICIONALES

- **Imágenes:** Las actuales (`arquitecto.png`, `obrero.png`, `familia.png`) son válidas, pero considerar reemplazar con fotos que muestren diversidad (género, edad) y contexto argentino
- **Video demo:** Si no hay video, mockup animado con Figma o Lottie puede funcionar
- **Analytics:** Implementar eventos GA4 para trackear:
  - Clicks en CTA por sección
  - Scroll depth (qué secciones llegan a ver)
  - Formulario leads (tasa conversión, errores Turnstile)
- **A/B Testing:** Considerar 2 variantes de Hero (con/sin video) para medir conversión

---

**Elaborado por:** AI Assistant (Claude Sonnet 4.5)  
**Basado en:** Análisis de `grows_context.json`, codebase web app, y landing actual  
**Contacto:** Para dudas sobre implementación, consultar este informe

