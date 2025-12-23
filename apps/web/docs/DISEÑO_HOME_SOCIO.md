# DISEÑO: HOME DEL SOCIO (GROWS)
**Fecha:** Diciembre 2024  
**Rol:** Frontend / UX Architect  
**Objetivo:** Diseñar la HOME como punto de entrada único, tablero operativo diario, mobile-first

---

## 🎯 CAMBIO DE MODELO MENTAL

### ⚠️ Importante
- El socio **NO** entra a tomar trabajos inmediatos
- El socio entra todos los días a ver **solicitudes de presupuesto**
- El trabajo solo se ejecuta cuando un arquitecto **aprueba**
- El socio no ve planes, suscripciones ni comisiones
- Modelo de negocio: 100% comisión integrada, invisible para el socio

### Flujo Real
```
Marketplace = Solicitudes de presupuesto
AHORA = Ejecución
Home = Puente entre presupuestar y ejecutar
```

### ❌ NO es
- Uber / changas instantáneas
- Dashboard empresarial
- Métricas financieras complejas

### ✅ ES
- Trabajo programado y validado
- UX pensada para obra, celular, una mano
- Entender en 3 segundos

---

## 1️⃣ ESTRUCTURA DE LA HOME (Mobile-First)

### 1.1 Layout General

```
┌─────────────────────────────────┐
│  Header: Estado Operativo       │  ← Fijo
├─────────────────────────────────┤
│                                 │
│  🔔 Badge Notificaciones        │  ← Si hay no leídas
│                                 │
│  ╔═══════════════════════════╗  │
│  ║ SOLICITUDES DE TRABAJO    ║  │  ← Sección Principal
│  ║                           ║  │
│  ║  [Card Solicitud 1]       ║  │
│  ║  [Card Solicitud 2]       ║  │
│  ║  [Card Solicitud 3]       ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  ╔═══════════════════════════╗  │
│  ║ MIS PRESUPUESTOS          ║  │  ← Sección Secundaria
│  ║                           ║  │
│  ║  [Card Presupuesto 1]     ║  │
│  ║  [Card Presupuesto 2]     ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  ╔═══════════════════════════╗  │
│  ║ TRABAJO ACTUAL            ║  │  ← Solo si existe
│  ║                           ║  │
│  ║  [Card Bloque Actual]     ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  ╔═══════════════════════════╗  │
│  ║ ACCESOS RÁPIDOS           ║  │  ← Grid 2x2 (máx 4)
│  ║                           ║  │
│  ║  [Evidencias] [Billetera]║  │
│  ║  [Perfil]    [Ayuda]     ║  │
│  ╚═══════════════════════════╝  │
│                                 │
└─────────────────────────────────┘
│  TabBar (fijo inferior)         │
└─────────────────────────────────┘
```

### 1.2 Header Simple - Estado Operativo

**Elementos:**
- **Título:** "Hola, [Nombre]" (ej: "Hola, Juan")
- **Subtítulo dinámico:**
  - Si tiene trabajo activo: "Trabajando en [Obra]"
  - Si tiene presupuestos pendientes: "[X] presupuestos pendientes"
  - Si no hay nada: "Buscando nuevas oportunidades"
- **Badge notificaciones:** Si hay no leídas, icono + número (click → /socio/notificaciones)

**Estado visual:**
- Fondo: Blanco
- Texto: Gris oscuro (#1F2937)
- Badge: Azul GROWS (#276EF1) con contador rojo si > 0
- Altura: 70px fijo

### 1.3 Sección Principal: SOLICITUDES DE TRABAJO

**Título:** "Solicitudes de trabajo"  
**Subtítulo:** "Oportunidades disponibles para presupuestar"

**Estados:**
- ✅ **Con solicitudes:** Lista de cards (scroll vertical)
- ⚠️ **Sin solicitudes:** Mensaje: "No hay solicitudes nuevas. Revisá más tarde."
- ⏳ **Cargando:** Skeleton cards (3 cards)

**Prioridad:** Esta sección debe estar siempre visible (scroll inmediato)

### 1.4 Sección Secundaria: MIS PRESUPUESTOS

**Título:** "Mis presupuestos"  
**Subtítulo:** "Presupuestos enviados y en curso"

**Contenido:**
- Máximo 3 presupuestos recientes
- Estados visibles: PENDIENTE, ENVIADO, APROBADO
- Link "Ver todos" → /socio/presupuestos

**Si no hay presupuestos:**
- Ocultar sección completa

### 1.5 Sección Condicional: TRABAJO ACTUAL

**Solo se muestra si:**
- Hay tarea activa (en_progreso)
- O hay bloque activo (en_progreso)

**Contenido:**
- Card resumen del bloque/tarea actual
- CTA principal: "Continuar trabajando" → /socio/ahora
- Preview: Obra, tipo de trabajo, progreso

**Si no hay trabajo activo:**
- Ocultar sección completa

### 1.6 Accesos Rápidos (Grid 2x2, máximo 4)

**Opciones sugeridas:**
1. **Evidencias** → /socio/evidencias
2. **Billetera** → /socio/billetera (solo estado, no métricas)
3. **Perfil** → /socio/cuenta
4. **Ayuda** → Modal o sección de ayuda

**Diseño:**
- Grid 2 columnas, 2 filas
- Cards grandes, táctiles (mín. 44x44px touch target)
- Icono + texto descriptivo
- Colores diferenciados por función

---

## 2️⃣ MARKETPLACE (SOLICITUDES DE PRESUPUESTO)

### 2.1 Card de Solicitud - Estructura

```
┌─────────────────────────────────────┐
│ 🔨 CONSTRUCCIÓN MAMPOSTERÍA         │  ← Tipo de trabajo
│                                     │
│ 📍 Villa Crespo, CABA               │  ← Zona
│                                     │
│ 📅 Inicio estimado: 15 Ene 2025     │  ← Fecha estimada
│ ⏱️ Duración: 20 días                │  ← Duración estimada
│                                     │
│ 🟢 Recibiendo presupuestos          │  ← Estado badge
│                                     │
│ ┌─────────────────────────────┐    │
│ │  Enviar presupuesto         │    │  ← CTA Principal
│ └─────────────────────────────┘    │
│                                     │
│  [Ver detalles →]                  │  ← CTA Secundario
└─────────────────────────────────────┘
```

### 2.2 Información Mostrada en Card

**Campos obligatorios:**
- ✅ **Tipo de trabajo:** "Construcción mampostería", "Instalación eléctrica", etc.
- ✅ **Zona:** Barrio, localidad (ej: "Villa Crespo, CABA")
- ✅ **Inicio estimado:** Fecha formateada (ej: "15 Ene 2025")
- ✅ **Duración estimada:** Días (ej: "20 días")
- ✅ **Estado:** Badge verde "Recibiendo presupuestos"

**Campos opcionales (si disponibles):**
- 📐 **Superficie:** Si está disponible
- 🏗️ **Etapa:** ESTRUCTURA, OBRA_GRIS, TERMINACIONES

### 2.3 CTAs (Call to Actions)

**CTA Principal - "Enviar presupuesto"**
- Botón full-width, color primario GROWS (#276EF1)
- Texto: "Enviar presupuesto"
- Acción: Navegar a /socio/presupuestos?obra_id=[id]
- Prioridad visual: Más grande, más visible

**CTA Secundario - "Ver detalles"**
- Link de texto, color secundario
- Texto: "Ver detalles"
- Acción: Modal o expandir card con más info

### 2.4 Estados del Card

**Estado: Recibiendo presupuestos**
- Badge: Verde (#10B981)
- Texto: "Recibiendo presupuestos"
- CTAs: Habilitados

**Estado: Presupuesto enviado (por este socio)**
- Badge: Amarillo (#F59E0B)
- Texto: "Presupuesto enviado"
- CTAs: "Ver estado" (deshabilitar "Enviar presupuesto")

**Estado: Cerrado / Ya no disponible**
- Badge: Gris (#6B7280)
- Texto: "Ya no disponible"
- CTAs: Ocultar o deshabilitar

### 2.5 Ordenamiento

**Prioridad de visualización:**
1. Solicitudes nuevas (más recientes primero)
2. Solicitudes sin presupuesto del socio
3. Solicitudes con presupuesto enviado (al final)

### 2.6 Filtros (Opcional - futuro)

**Filtros sugeridos para MVP 2.0:**
- Por zona (barrio, localidad)
- Por tipo de trabajo
- Por fecha de inicio estimada

**Para MVP 1.0:**
- No incluir filtros (mantener simple)

---

## 3️⃣ FLUJO MENTAL DEL SOCIO

### 3.1 Flujo Ideal - Día Normal

```
┌─────────────────────────────────────┐
│  1. Abro la app                     │
│     ↓                               │
│  2. Veo la HOME                     │
│     • Solicitudes destacadas        │
│     • Mis presupuestos en curso     │
│     • Trabajo actual (si hay)       │
│     ↓                               │
│  3. Veo una solicitud interesante   │
│     ↓                               │
│  4. TAP: "Enviar presupuesto"       │  ← 1 tap
│     ↓                               │
│  5. Entro a /socio/presupuestos     │
│     • Completo presupuesto          │
│     • Guardo borrador / Envío       │
│     ↓                               │
│  6. Vuelvo a HOME                   │
│     • Veo "Presupuesto enviado"     │
│     ↓                               │
│  [Días después...]                  │
│     ↓                               │
│  7. Veo notificación                │
│     • "Presupuesto aprobado"        │
│     ↓                               │
│  8. TAP: "Continuar trabajando"     │  ← 1 tap
│     ↓                               │
│  9. Entro a /socio/ahora            │
│     • Inicio bloque                 │
│     • Ejecuto trabajo               │
│     • Subo evidencias               │
└─────────────────────────────────────┘
```

### 3.2 Acciones de 1 Tap

**Desde HOME:**
- ✅ Ver detalles de solicitud (expandir card)
- ✅ Ir a presupuestos de una obra específica
- ✅ Continuar trabajo actual (si existe)
- ✅ Ver notificaciones
- ✅ Acceder a evidencias, billetera, perfil

### 3.3 Acciones de 2 Taps

**Desde HOME:**
- ⚠️ Enviar presupuesto completo:
  1. Tap "Enviar presupuesto"
  2. Tap "Enviar" en formulario presupuesto

### 3.4 Qué NO debe estar en la Home

**❌ Excluir:**
- Métricas financieras complejas (ganancias, comisiones)
- Gráficos o charts
- KPIs empresariales
- Listado completo de todas las tareas
- Historial detallado
- Configuraciones avanzadas
- Información de planes o suscripciones

**✅ Incluir:**
- Acciones inmediatas (enviar presupuesto, continuar trabajo)
- Estado actual (qué estoy haciendo, qué hay pendiente)
- Accesos rápidos a funciones clave

---

## 4️⃣ ACCESO A UTILIDADES DEL SOCIO

### 4.1 Accesos Rápidos (Grid 2x2)

**Máximo 4 accesos:**

1. **📸 Evidencias**
   - Texto: "Evidencias"
   - Icono: Camera / Image
   - Acción: → /socio/evidencias
   - Color: Azul (#3B82F6)

2. **💰 Billetera**
   - Texto: "Billetera"
   - Icono: Wallet / DollarSign
   - Acción: → /socio/billetera
   - Color: Verde (#10B981)
   - **Nota:** Solo estado, no métricas complejas

3. **👤 Perfil**
   - Texto: "Mi perfil"
   - Icono: User / UserCircle
   - Acción: → /socio/cuenta
   - Color: Gris (#6B7280)

4. **❓ Ayuda**
   - Texto: "Ayuda"
   - Icono: HelpCircle / MessageCircle
   - Acción: Modal de ayuda o → /socio/ayuda
   - Color: Naranja (#F59E0B)

### 4.2 Accesos desde TabBar (existente)

**Ya implementado:**
- Inicio (Home) → /socio/ahora
- Mis tareas → /socio/tareas
- Mensajes → /socio/mensajes
- Menú → Drawer lateral

**No duplicar estos accesos en Home**

### 4.3 Accesos desde Drawer Lateral (existente)

**Ya implementado:**
- Notificaciones
- Ahora
- Tareas
- Presupuestos
- Billetera
- Mi Cuadrilla
- Cuenta

**La Home complementa, no duplica**

---

## 5️⃣ TONO Y COPY (Muy Importante)

### 5.1 Reglas de Lenguaje

**✅ USAR (Lenguaje directo y operativo):**
- "Enviar presupuesto"
- "Recibiendo presupuestos"
- "Presupuesto aprobado"
- "Presupuesto enviado"
- "Presupuesto rechazado"
- "Inicio estimado"
- "Duración estimada"
- "Bloque pendiente"
- "Bloque en curso"
- "Evidencia enviada"
- "Continuar trabajando"
- "Nuevas oportunidades"
- "Mis presupuestos"
- "Trabajo actual"

**❌ PROHIBIDO (Sin tecnicismos ni términos de negocio):**
- "Tomar trabajo"
- "Disponible ahora"
- "Comisión"
- "Plan"
- "Suscripción"
- "Tarifa"
- "Precio"
- "Ingreso"
- "Ganancia"
- "Cobro"
- "Disponibilidad inmediata"
- "Trabajo urgente"
- "Tarea disponible"

### 5.2 Ejemplos de Copy por Sección

**Header:**
- "Hola, Juan"
- "Trabajando en Obra Villa Crespo"
- "3 presupuestos pendientes"
- "Buscando nuevas oportunidades"

**Solicitudes de trabajo:**
- Título: "Solicitudes de trabajo"
- Subtítulo: "Oportunidades disponibles para presupuestar"
- Estado vacío: "No hay solicitudes nuevas. Revisá más tarde."
- CTA: "Enviar presupuesto"

**Mis presupuestos:**
- Título: "Mis presupuestos"
- Subtítulo: "Presupuestos enviados y en curso"
- Estado PENDIENTE: "Pendiente de envío"
- Estado ENVIADO: "Enviado, esperando respuesta"
- Estado APROBADO: "Aprobado, listo para ejecutar"
- Link: "Ver todos los presupuestos"

**Trabajo actual:**
- Título: "Trabajo actual"
- Subtítulo: "Tu trabajo en curso"
- CTA: "Continuar trabajando"
- Estado vacío: (Ocultar sección)

**Accesos rápidos:**
- "Evidencias"
- "Billetera"
- "Mi perfil"
- "Ayuda"

### 5.3 Mensajes de Error y Estados Vacíos

**Cargando:**
- "Cargando solicitudes..."
- "Cargando presupuestos..."

**Error:**
- "No se pudieron cargar las solicitudes. Intentá nuevamente."
- "Error al cargar presupuestos. Revisá tu conexión."

**Vacío:**
- Solicitudes: "No hay solicitudes nuevas. Revisá más tarde."
- Presupuestos: "Aún no enviaste presupuestos."
- Trabajo actual: (Ocultar sección)

---

## 6️⃣ OBSERVACIONES UX MOBILE-FIRST

### 6.1 Principios de Diseño

**1. Scroll vertical único**
- Todo en un solo scroll
- Sin tabs horizontales
- Sin carousels complejos

**2. Touch targets grandes**
- Mínimo 44x44px para botones
- Cards táctiles completas (no solo botón dentro)
- Espaciado generoso entre elementos (16px mínimo)

**3. Jerarquía visual clara**
- Solicitudes: Más grande, más destacado
- Presupuestos: Mediano
- Trabajo actual: Condicional, destacado si existe
- Accesos rápidos: Compacto, grid

**4. Feedback inmediato**
- Estados de carga (skeleton)
- Confirmaciones visuales (toasts)
- Animaciones sutiles (no distractoras)

### 6.2 Performance

**Carga inicial:**
- Máximo 5 solicitudes iniciales
- Lazy load para más solicitudes (scroll infinito opcional)
- Máximo 3 presupuestos recientes
- Carga diferida de imágenes (lazy loading)

**Optimizaciones:**
- Cache de solicitudes (5 minutos)
- Prefetch de datos al entrar a la app
- Service Worker para modo offline (futuro)

### 6.3 Responsive (Tablet)

**Aunque es mobile-first, considerar tablet:**
- Grid 2 columnas para solicitudes (tablet)
- Accesos rápidos: 4 columnas (tablet)
- Mantener scroll vertical único

### 6.4 Accesibilidad

**Requisitos mínimos:**
- Contraste de texto: WCAG AA (4.5:1)
- Labels descriptivos para screen readers
- Navegación por teclado (si aplica)
- Focus states visibles

---

## 7️⃣ IMPLEMENTACIÓN SUGERIDA

### 7.1 Componentes Nuevos Necesarios

1. **`HomeSolicitudesSection`**
   - Lista de cards de solicitudes
   - Skeleton loading
   - Estado vacío

2. **`SolicitudCard`**
   - Card individual de solicitud
   - CTAs
   - Estados

3. **`HomePresupuestosSection`**
   - Lista de presupuestos recientes
   - Link "Ver todos"

4. **`PresupuestoCard`**
   - Card individual de presupuesto
   - Estado badge
   - Acción rápida

5. **`HomeTrabajoActualSection`**
   - Card de trabajo actual
   - Solo si existe trabajo activo

6. **`AccesosRapidosGrid`**
   - Grid 2x2 de accesos
   - Cards táctiles

### 7.2 Endpoints Necesarios

**Solicitudes de trabajo:**
- `GET /api/socio/solicitudes` (nuevo)
  - Retorna: Lista de obras que están recibiendo presupuestos
  - Filtros: obras que NO tienen presupuesto del socio, o tienen presupuesto ENVIADO
  - Orden: fecha_creacion DESC

**Presupuestos recientes:**
- Ya existe: `GET /api/socio/presupuestos`
  - Usar limit=3 para home

**Trabajo actual:**
- Ya existe: Lógica de /socio/ahora
  - Reutilizar para obtener tarea/bloque actual

### 7.3 Estructura de Datos

**Solicitud (Obra):**
```typescript
interface SolicitudObra {
  obra_id: string;
  obra_name: string;
  direccion_completa: string;
  zona: string; // barrio, localidad
  fecha_inicio_estimada: string;
  duracion_estimada_dias: number;
  tipo_trabajo: string;
  etapa?: 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES';
  estado_solicitud: 'RECIBIENDO_PRESUPUESTOS' | 'CERRADO';
  tiene_presupuesto_socio: boolean;
  presupuesto_estado?: 'PENDIENTE' | 'ENVIADO' | 'APROBADO';
}
```

---

## 8️⃣ PRIORIDADES DE IMPLEMENTACIÓN

### MVP 1.0 (Básico)

**Fase 1: Estructura básica**
1. ✅ Layout general (Header + secciones + TabBar)
2. ✅ Sección "Solicitudes de trabajo" con cards básicos
3. ✅ Endpoint `/api/socio/solicitudes`
4. ✅ CTAs básicos (Enviar presupuesto → /socio/presupuestos)

**Fase 2: Presupuestos y trabajo actual**
5. ✅ Sección "Mis presupuestos" (3 recientes)
6. ✅ Sección "Trabajo actual" (condicional)
7. ✅ Accesos rápidos (4 opciones)

**Fase 3: Pulido**
8. ✅ Estados de carga y vacío
9. ✅ Copy correcto (sin términos prohibidos)
10. ✅ Navegación fluida

### MVP 2.0 (Mejoras)

- Filtros de solicitudes
- Notificaciones push de nuevas solicitudes
- Scroll infinito
- Modo offline básico

---

## 9️⃣ NOTAS FINALES

### Objetivo Final
Que el socio entienda claramente:
> **"Entro a GROWS para enviar presupuestos y ejecutar lo que me aprueban."**

### Principios Rectores
1. **Simplicidad:** Entender en 3 segundos
2. **Acción:** Priorizar enviar presupuestos
3. **Separación:** Marketplace ≠ Ejecución
4. **Lenguaje:** Directo, operativo, sin tecnicismos
5. **Mobile-first:** Una mano, celular, obra

### Validaciones de Diseño
- ✅ ¿Se entiende en 3 segundos?
- ✅ ¿Prioriza enviar presupuestos?
- ✅ ¿Separa claramente presupuestar vs ejecutar?
- ✅ ¿Usa lenguaje directo y operativo?
- ✅ ¿Es usable con una mano en celular?
- ✅ ¿No muestra métricas financieras complejas?
- ✅ ¿No habla de comisiones, planes o suscripciones?

---

**FIN DEL DOCUMENTO DE DISEÑO**



