# 📱 PROMPT LISTO PARA CURSOR - Rediseño Panel Líder de Cuadrilla (Móvil Exclusivo)

## ⚠️ INSTRUCCIONES PARA CURSOR

**Copiar y pegar este prompt completo en Cursor:**

---

```
⚠️ IMPORTANTE:
- NO modificar nada del backend ni de la base de datos.
- Trabajar SOLO en la UI/UX del panel de socio (/panel).
- Diseño EXCLUSIVAMENTE para móviles (mobile-first).
- Mantener funcionalidad existente, solo cambiar presentación.
- Usar Tailwind CSS y componentes React existentes.

---

🎯 OBJETIVO
Rediseñar completamente el panel del líder de cuadrilla (/panel) para que sea una experiencia móvil exclusiva, enfocada en productividad en obra.

---

📱 LAYOUT MÓVIL EXCLUSIVO

1. **Estructura Principal:**
   - Todo en UNA SOLA COLUMNA scrolleable
   - Sin sidebar lateral (eliminar completamente)
   - Sin layouts horizontales o grillas
   - Optimizado para pantallas de 375px a 414px

2. **Barra Superior Fija:**
   - Obra actual (nombre + ubicación)
   - Estado de conexión (online/offline) con indicador visual
   - Botón rápido "Descanso / Finalizar Jornada"
   - Ícono hamburguesa (☰) para menú secundario (acceso a configuraciones)

3. **Contenido Principal (Scrolleable):**
   - Tareas en curso (prioritario)
   - Oportunidades de obras
   - Información de cuadrilla

---

🎨 SISTEMA DE COLORES UNIFICADO

Reemplazar TODOS los colores inconsistentes con esta paleta:

```css
/* Colores Principales */
--primary: #2563eb;        /* Azul principal */
--primary-dark: #1d4ed8;   /* Azul oscuro */
--secondary: #64748b;      /* Gris neutro */

/* Estados ÚNICOS */
--success: #10b981;        /* Verde - Iniciar, Disponible, Éxito */
--warning: #f59e0b;        /* Amarillo - En evaluación, Advertencia */
--error: #ef4444;          /* Rojo - Pausar, Error, Desconectado */
--info: #3b82f6;           /* Azul - Información, Próxima */

/* Neutros */
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-500: #64748b;
--gray-700: #334155;
--gray-900: #0f172a;
```

**REGLA:** Un solo color por estado. NO mezclar colores.

---

📋 TAREAS EN CURSO (Prioritario)

**Card Grande por Tarea:**
- Nombre de la tarea (texto grande)
- Etapa: "Replanteo", "Ejecución", "Terminación" (badge con color)
- Barra de progreso visual
- Botones de acción GRANDES y táctiles:
  - "▶️ Iniciar" (verde)
  - "⏸️ Pausar" (rojo)
  - "✅ Finalizar" (azul)
- Swipe lateral → acciones rápidas (checklist, evidencias)

**Estados Visuales:**
- Sin iniciar: Botón "Iniciar" verde prominente
- En progreso: Barra de progreso + botón "Pausar" rojo
- Finalizada: Botón "Finalizar" azul + checkmark

---

📸 SUBIDA DE EVIDENCIAS

**Botón Flotante (FAB):**
- FAB fijo en esquina inferior derecha
- Ícono de cámara + documento
- Al tocar: opciones rápidas
  - "📷 Sacar foto"
  - "📄 Subir documento"
  - "🎤 Nota de voz" (ideal para manos ocupadas)

---

🏗️ OPORTUNIDADES DE OBRAS

**Lista Vertical (NO grilla horizontal):**
- Feed vertical tipo redes sociales
- Cada obra como card:
  - Nombre + ubicación
  - Fecha de inicio
  - Estado con badge (Disponible/En evaluación/Próxima)
  - Botón "Ver detalles" o "Aplicar"

**Estados con Colores:**
- "Disponible" → Verde
- "En evaluación" → Amarillo  
- "Próxima" → Azul

---

📱 NAVEGACIÓN INFERIOR (Bottom Nav)

**Reemplazar sidebar con bottom nav fijo:**
- 4 iconos principales en la parte inferior:
  - 🏠 "Tareas" (página actual)
  - 👥 "Mi Cuadrilla" 
  - 🔔 "Notificaciones"
  - 👤 "Perfil"

**Menú Secundario:**
- Ícono hamburguesa (☰) en barra superior
- Acceso a: Configuración, Calendario, Presupuesto, etc.

---

👆 GESTOS Y USABILIDAD MÓVIL

**Interacciones Táctiles:**
- Tap grande → inicia tarea
- Long press → abre menú contextual (checklist, evidencias, chat)
- Swipe lateral en card → acciones rápidas
- Botones en zona baja de pantalla (accesible con una mano)

**Accesibilidad:**
- Botones mínimo 44px de altura
- Texto legible (mínimo 16px)
- Contrastes adecuados
- Zona táctil amplia

---

🔧 ARCHIVOS A MODIFICAR

**Prioridad 1:**
1. `apps/web/app/panel/page.tsx` - Layout principal móvil
2. `apps/web/components/panel/sections/TareasEnCurso.tsx` - Cards táctiles
3. `apps/web/components/panel/sections/Obras.tsx` - Lista vertical

**Prioridad 2:**
4. `apps/web/components/panel/TopBar.tsx` - Barra superior fija
5. Crear `BottomNavigation.tsx` - Navegación inferior
6. Crear `FloatingActionButton.tsx` - FAB para evidencias

**Prioridad 3:**
7. `apps/web/components/panel/sections/MiCuadrilla.tsx` - Optimizar móvil
8. `apps/web/components/panel/sections/Notificaciones.tsx` - Feed móvil
9. `apps/web/components/panel/sections/Cuenta.tsx` - Perfil móvil

---

✅ RESULTADO ESPERADO

Una experiencia móvil fluida donde el líder de cuadrilla puede:
1. **Ver tareas** → Cards grandes y claras
2. **Iniciar/pausar** → Botones táctiles grandes
3. **Registrar evidencia** → FAB fácil de usar
4. **Navegar** → Bottom nav intuitivo
5. **Todo con colores coherentes** → Sistema unificado

---

🚀 IMPLEMENTACIÓN

1. Empezar por el layout principal (page.tsx)
2. Implementar sistema de colores unificado
3. Rediseñar TareasEnCurso con cards táctiles
4. Crear BottomNavigation
5. Agregar FAB para evidencias
6. Optimizar resto de secciones

**Enfoque: Mobile-first, colores coherentes, usabilidad táctil.**
```

---

## 📋 **INSTRUCCIONES DE USO:**

1. **Copiar** todo el contenido entre los backticks (```)
2. **Pegar** en Cursor como prompt
3. **Ejecutar** y seguir las instrucciones paso a paso
4. **Verificar** que funcione en móvil

## 🎯 **RESULTADO ESPERADO:**

- ✅ Panel 100% móvil exclusivo
- ✅ Colores coherentes y unificados  
- ✅ Navegación táctil intuitiva
- ✅ FAB para evidencias
- ✅ Bottom navigation
- ✅ Cards grandes y accesibles
- ✅ Sin sidebar lateral
- ✅ Una sola columna scrolleable

**¿Listo para copiar y pegar en Cursor?** 🚀📱
