# 📊 INFORME MARKETING / LANDING — MVP 1.0 Y PRE-SEED

**Fecha:** 2025-01-21  
**Estado:** Landing funcional con mejoras pendientes para MVP  
**URL:** grows.com.ar

---

## ✅ QUÉ ESTÁ IMPLEMENTADO EN GROWS.COM.AR

### 🎯 **Estructura y Funcionalidades Core**

#### **1. Página Principal Completa**
- ✅ **Hero Section** con imagen responsive (desktop/mobile)
- ✅ **SolutionsSection** - Transformación animada de 8 problemas → 8 soluciones
- ✅ **StorytellingFlow** - Flujo narrativo de 6 etapas con imágenes
- ✅ **UserProfiles** - Cards para Cliente Técnico y Socio Constructor
- ✅ **EcosystemSection** - Diagrama del ecosistema GROWS
- ✅ **PricingSection** - 4 planes (Free, Starter, Pro, Enterprise) con CTAs funcionales
- ✅ **CTASection** - Formulario de captura de leads conectado a Supabase
- ✅ **Footer** completo con información de contacto
- ✅ **GrowsBot** - Chatbot funcional integrado con n8n

#### **2. CTAs y Conversión**
- ✅ **Hero CTA** → Calendly (agendar demo)
- ✅ **Pricing Free** → Registro directo (`app.grows.com.ar/auth/register`)
- ✅ **Pricing Starter/Pro** → Calendly (demos)
- ✅ **UserProfiles CTAs** → Registro directo
- ✅ **CTASection** → Formulario funcional que guarda leads en Supabase
- ⚠️ **Pricing Enterprise** → Solo link a `#contact` (necesita mejor implementación)

#### **3. Internacionalización**
- ✅ Soporte ES/EN completo
- ✅ Middleware de redirección automática
- ✅ Archivos de traducción organizados
- ⚠️ Selector de idioma en navegación (UI lista, funcionalidad parcial)

#### **4. Integraciones Funcionales**
- ✅ **API `/api/leads`** - Guarda leads en Supabase (tabla `leads`)
- ✅ **API `/api/fierro`** - Chatbot conectado con n8n
- ✅ **Supabase** - Cliente configurado y funcionando

#### **5. Recursos Visuales Existentes**
- ✅ Logo GROWS (múltiples variantes)
- ✅ Imágenes Hero (desktop: `hero-desktop.jpg`, mobile: `Herocelular.jpg`)
- ✅ Imágenes Storytelling (6 imágenes: `1Carga.png` - `6final.png`)
- ✅ Imágenes de perfiles (`Icono_tecnico.png`, `Icono_socio.png`, `Sociohero.png`, `Heroarquitecto.png`)
- ✅ Video coming-soon (`video-espera.mp4`)
- ✅ Iconos y assets del ecosistema

---

## ❌ QUÉ FALTA PARA MVP 1.0 Y PRE-SEED

### 🔴 **ALTA PRIORIDAD (Bloqueantes para MVP)**

#### **1. Video Demo de la Plataforma**
- ❌ **Estado:** No existe
- 🎯 **Necesario:** Video de 2-3 minutos mostrando:
  - Flujo completo de creación de obra
  - Dashboard principal
  - Sistema de tareas y seguimiento
  - Interacción entre Cliente y Socio
  - Métricas y reportes
- 📍 **Ubicación:** Sección nueva entre StorytellingFlow y UserProfiles
- ⏱️ **Tiempo estimado:** 2-3 días (grabación + edición)

#### **2. Testimonios / Casos de Éxito**
- ❌ **Estado:** No existe
- 🎯 **Necesario:** 
  - Mínimo 3 testimonios con foto, nombre, empresa, métrica
  - Ejemplo: "Ahorré 30% de tiempo en seguimiento" - Juan Pérez, Estudio XYZ
- 📍 **Ubicación:** Después de SolutionsSection
- ⏱️ **Tiempo estimado:** 1-2 días (contenido + diseño)

#### **3. Mejoras en SEO y Metadata**
- ⚠️ **Estado:** Básico implementado
- 🎯 **Necesario:**
  - Open Graph tags completos
  - Twitter Cards
  - Structured data (JSON-LD) para organización
  - Sitemap.xml
  - Robots.txt
- ⏱️ **Tiempo estimado:** 4-6 horas

#### **4. Analytics y Tracking**
- ❌ **Estado:** No implementado
- 🎯 **Necesario:**
  - Google Analytics 4
  - Tracking de eventos (clicks en CTAs, scroll depth, conversiones)
  - Funnel de conversión medible
- ⏱️ **Tiempo estimado:** 3-4 horas

#### **5. Botón de WhatsApp**
- ❌ **Estado:** No existe
- 🎯 **Necesario:** Botón flotante con link directo a WhatsApp
- 📍 **Ubicación:** Esquina inferior izquierda (opuesto al chatbot)
- ⏱️ **Tiempo estimado:** 1-2 horas

#### **6. Email de Confirmación para Leads**
- ⚠️ **Estado:** Leads se guardan pero no hay email automático
- 🎯 **Necesario:**
  - Email de bienvenida al capturar lead
  - Email de notificación al equipo GROWS
- ⏱️ **Tiempo estimado:** 3-4 horas

### 🟡 **MEDIA PRIORIDAD (Mejoran conversión)**

#### **7. Comparación Visual de Planes**
- ⚠️ **Estado:** Existe pero puede mejorar
- 🎯 **Mejoras:**
  - Tabla comparativa más visual
  - Tooltips explicativos
  - Calculadora de ROI básica
- ⏱️ **Tiempo estimado:** 4-6 horas

#### **8. Sección "Cómo Funciona" Mejorada**
- ⚠️ **Estado:** StorytellingFlow existe pero puede complementarse
- 🎯 **Mejoras:**
  - Screenshots reales de la plataforma
  - Pasos más detallados
  - CTA intermedio
- ⏱️ **Tiempo estimado:** 3-4 horas

#### **9. Landing para Inversores**
- ❌ **Estado:** No existe
- 🎯 **Necesario para pre-seed:**
  - Página `/es/inversores` o `/es/investors`
  - Métricas de negocio
  - Pitch deck o información de inversión
  - Formulario de contacto específico
- ⏱️ **Tiempo estimado:** 1-2 días

#### **10. Optimización de Performance**
- ⚠️ **Estado:** Básico (Next/Image implementado)
- 🎯 **Mejoras:**
  - Comprimir imágenes existentes
  - Optimizar video
  - Lazy loading explícito
- ⏱️ **Tiempo estimado:** 2-3 horas

### 🟢 **BAJA PRIORIDAD (Nice to have)**

#### **11. Calculadora de Ahorro Interactiva**
- ❌ **Estado:** No existe
- 🎯 **Funcionalidad:** Inputs (obras, socios) → Ahorro estimado
- ⏱️ **Tiempo estimado:** 6-8 horas

#### **12. Blog o Recursos**
- ❌ **Estado:** No existe
- 🎯 **Funcionalidad:** Artículos sobre construcción, guías
- ⏱️ **Tiempo estimado:** 1-2 semanas (contenido)

---

## 🎨 RECURSOS VISUALES NECESARIOS

### 🔴 **Críticos para MVP**

#### **1. Video Demo de la Plataforma**
- **Tipo:** Video screencast de 2-3 minutos
- **Contenido:**
  - Creación de obra desde cero
  - Asignación de tareas
  - Flujo Cliente → Socio
  - Dashboard y métricas
  - Exportación de reportes
- **Formato:** MP4 optimizado (WebM alternativo)
- **Resolución:** 1920x1080 mínimo
- **Audio:** Narración en español (subtítulos opcionales)
- **Estilo:** Profesional, sin música de fondo distractora

#### **2. Screenshots de la Plataforma**
- **Cantidad:** 8-10 screenshots
- **Vistas necesarias:**
  - Dashboard principal
  - Lista de obras
  - Vista de tareas
  - Panel de métricas
  - Chat/mensajería
  - Perfil de socio
  - Configuración
- **Formato:** PNG optimizado, 1920x1080
- **Estilo:** Con datos realistas pero no sensibles

#### **3. Testimonios con Fotos**
- **Cantidad:** Mínimo 3, ideal 5
- **Necesario:**
  - Foto profesional (o avatar)
  - Nombre completo
  - Empresa/cargo
  - Testimonio (2-3 líneas)
  - Métrica cuantificable (opcional pero recomendado)
- **Ejemplo:** "GROWS me ahorró 10 horas semanales en seguimiento" - María González, Arquitecta

#### **4. Imágenes para Landing de Inversores**
- **Cantidad:** 3-5 gráficos/diagramas
- **Contenido:**
  - TAM/SAM/SOM del mercado
  - Proyección de crecimiento
  - Modelo de negocio visual
  - Roadmap de producto
- **Formato:** SVG o PNG de alta calidad

### 🟡 **Importantes pero no bloqueantes**

#### **5. Iconografía Adicional**
- Iconos para features específicas
- Ilustraciones para secciones nuevas
- Badges y elementos decorativos

#### **6. Animaciones/Transiciones**
- Micro-interacciones para mejor UX
- Transiciones entre secciones
- Efectos hover mejorados

---

## 🔗 DEPENDENCIAS DE PRODUCTO

### **1. Funcionalidades de la App que Deben Estar Listas**

#### **Para Video Demo:**
- ✅ Dashboard funcional
- ✅ Creación de obras
- ✅ Sistema de tareas
- ✅ Flujo Cliente-Socio
- ⚠️ **Verificar:** Métricas y reportes funcionando correctamente

#### **Para Testimonios:**
- ⚠️ **Necesario:** Al menos 3-5 usuarios beta que puedan dar testimonios
- ⚠️ **Necesario:** Casos de uso reales documentados

#### **Para Landing de Inversores:**
- ⚠️ **Necesario:** Métricas de negocio actualizadas:
  - Número de usuarios activos
  - Número de obras creadas
  - Tasa de conversión Free → Paid
  - MRR (si aplica)
  - Churn rate
  - CAC y LTV (si se tienen)

### **2. Integraciones Técnicas Pendientes**

#### **Email Marketing:**
- ⚠️ **Estado:** No integrado
- 🎯 **Necesario:** Servicio de email (SendGrid, Resend, o similar)
- 🎯 **Funcionalidad:** 
  - Emails de bienvenida automáticos
  - Notificaciones al equipo
  - Campañas de seguimiento

#### **Calendly:**
- ✅ **Estado:** Integrado en CTAs
- ⚠️ **Verificar:** Link correcto y disponibilidad de slots

#### **Supabase:**
- ✅ **Estado:** Configurado
- ⚠️ **Verificar:** Tabla `leads` existe y tiene estructura correcta
- ⚠️ **Verificar:** Permisos y seguridad de la tabla

---

## 📋 QUÉ NECESITÁS DEL PM PARA AVANZAR

### 🔴 **Urgente (Esta Semana)**

#### **1. Definir Contenido de Video Demo**
- **Decisión:** ¿Qué funcionalidades mostrar? ¿Qué flujo seguir?
- **Aprobación:** Script y storyboard del video
- **Timeline:** Fecha límite para tener video listo

#### **2. Identificar Usuarios para Testimonios**
- **Acción:** Lista de 5-10 usuarios beta que puedan dar testimonios
- **Contacto:** Coordinar entrevistas/grabaciones
- **Contenido:** Guía de qué preguntar para obtener buenos testimonios

#### **3. Métricas para Landing de Inversores**
- **Acción:** Compilar métricas actuales de negocio
- **Formato:** Datos en spreadsheet o documento compartido
- **Incluir:** Usuarios, obras, conversiones, proyecciones

#### **4. Aprobar Prioridades**
- **Decisión:** ¿Qué es crítico para MVP vs. qué puede esperar?
- **Timeline:** Fechas límite para cada entregable

### 🟡 **Importante (Próximas 2 Semanas)**

#### **5. Definir Mensaje Clave para Pre-Seed**
- **Acción:** Pitch deck o documento con mensaje principal
- **Incluir:** Propuesta de valor, diferenciadores, mercado objetivo

#### **6. Revisar y Aprobar Contenido**
- **Acción:** Revisión de textos en landing (hero, features, pricing)
- **Incluir:** Asegurar que mensaje sea consistente con estrategia

#### **7. Definir Estrategia de Email Marketing**
- **Acción:** Decidir qué emails enviar y cuándo
- **Incluir:** Flujo de bienvenida, seguimiento, re-engagement

### 🟢 **Nice to Have**

#### **8. Roadmap de Contenido**
- **Acción:** Plan de blog/recursos a largo plazo
- **Incluir:** Temas, frecuencia, responsable

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### **Semana 1 (Crítico para MVP)**
1. ✅ Implementar botón WhatsApp (2 horas)
2. ✅ Agregar analytics (4 horas)
3. ✅ Mejorar SEO básico (4 horas)
4. ✅ Email de confirmación para leads (4 horas)
5. ⏳ **PM:** Identificar usuarios para testimonios
6. ⏳ **PM:** Definir contenido de video demo

### **Semana 2 (MVP)**
1. ⏳ Grabar y editar video demo (2-3 días)
2. ⏳ Crear sección de testimonios (1-2 días)
3. ⏳ Implementar landing de inversores (1-2 días)
4. ⏳ **PM:** Proporcionar métricas de negocio

### **Semana 3 (Pre-Seed)**
1. ⏳ Optimizaciones finales
2. ⏳ Testing completo
3. ⏳ Preparación de materiales para inversores

---

## 📊 RESUMEN EJECUTIVO

### ✅ **Fortalezas Actuales**
- Landing funcional y bien estructurada
- CTAs principales conectados correctamente
- Sistema de captura de leads funcionando
- Chatbot operativo
- Internacionalización completa

### ⚠️ **Gaps Críticos para MVP**
1. **Falta video demo** (bloqueante para conversión)
2. **Falta social proof** (testimonios)
3. **Falta analytics** (no podemos medir)
4. **Falta landing de inversores** (crítico para pre-seed)

### 🎯 **Próximos Pasos Inmediatos**
1. **Marketing:** Implementar botón WhatsApp y analytics (1 día)
2. **PM:** Identificar usuarios para testimonios (urgente)
3. **PM:** Definir contenido de video demo (urgente)
4. **Marketing:** Crear sección testimonios (1-2 días)
5. **Marketing:** Grabar video demo (2-3 días)

### 📈 **Impacto Esperado**
- **Conversión:** +50-100% con video demo y testimonios
- **Leads:** +30-50% con mejoras en CTAs y WhatsApp
- **Pre-seed:** Landing de inversores crítica para fundraising

---

**Última actualización:** 2025-01-21  
**Próxima revisión:** Después de implementar items críticos











