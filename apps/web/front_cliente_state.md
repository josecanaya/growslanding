# ESTADO Y ROADMAP — FRONTEND CLIENTE/SUPERVISOR GROWS
**Fecha:** Diciembre 2024  
**Versión:** MVP 1.0

---

## ✅ HOME CLIENTE REDISEÑADA

**Fecha implementación:** Diciembre 2024

### Implementación

- ✅ Home Cliente rediseñada con jerarquía editorial y bandeja de decisiones en `/cliente/dashboard` (`app/cliente/dashboard/page.tsx`)
- ✅ Estructura de 4 capas implementada:
  - **CAPA 1 — Estado General (Editorial)**: Título, subtítulo, última actividad (sin iconos, sin CTA)
  - **CAPA 2 — Bandeja de Decisiones**: Validaciones pendientes, obras sin cuadrilla, priorización visual
  - **CAPA 3 — Estado General del Sistema**: Resumen de obras, tareas, cuadrillas, plata (columna izquierda, solo lectura)
  - **CAPA 4 — Columna Lateral de Acción**: Acciones "Crear obra" y "Crear tareas puntuales" (columna derecha fija)
- ✅ Todas las funcionalidades de tutorial eliminadas de componentes cliente
- ✅ Home es autoexplicativo sin necesidad de tutoriales
- ✅ Diseño profesional tipo Notion/Linear/Stripe, pensado para arquitectos

### Características del Home

1. **CAPA 1 — Estado General (Editorial)**:
   - Título grande: "Gestioná tus obras"
   - Subtítulo: "Vista general de tus proyectos, tareas y decisiones"
   - Meta info: "Última actividad: hace X días"
   - Sin iconos, sin CTA, tipografía limpia

2. **CAPA 2 — Bandeja de Decisiones**:
   - Validaciones pendientes (con monto si aplica)
   - Obras sin cuadrilla asignada
   - Priorización visual según impacto
   - CTAs contextuales ("Ir a validar", "Asignar cuadrillas")
   - Mensaje sobrio si no hay decisiones: "No hay decisiones pendientes"

3. **CAPA 3 — Estado General del Sistema**:
   - Obras activas / pausadas
   - Tareas en curso / finalizadas
   - Cuadrillas asignadas / faltantes
   - Plata gastada / comprometida
   - Solo lectura, sin acciones primarias

4. **CAPA 4 — Columna Lateral de Acción**:
   - "Crear una obra" (proceso completo dentro de Grows)
   - "Crear tareas puntuales" (trabajos sueltos)
   - Columna derecha fija (sticky), claramente separada

### Navegación

- `/cliente/dashboard` es el Home
- Desde `/cliente/dashboard` los usuarios navegan a otras secciones
- No hay redirecciones automáticas a secciones técnicas
- Las obras se ven en `/obras`, no en la Home

---

## 0. SISTEMA DE SUSCRIPCIÓN (ACTUALIZADO - Diciembre 2024)

### 0.1 Nueva Lógica de Gating

**CAMBIO PRINCIPAL:** Eliminado gating por sección. Solo gating por límites.

**ANTES (❌ Removido):**
- Chat requería plan PRO (Chat eliminado completamente del panel cliente)
- Notificaciones requerían plan STARTER
- Cuadrillas requerían plan STARTER
- Calendario requería plan PRO

**AHORA (✅ Implementado):**
- Todas las secciones están disponibles para todos los planes
- Los banners de upgrade solo aparecen cuando se EXCEDEN los límites:
  - Obras activas > límite del plan
  - Tareas activas > límite del plan
  - Cuadrillas > límite del plan

### 0.2 Límites por Plan

| Plan | Obras Activas | Tareas Activas | Cuadrillas |
|------|---------------|----------------|------------|
| **FREE** | 2 | 0 | 0 |
| **STARTER** | 5 | 3 | 3 |
| **PRO** | 10 | 10 | Ilimitadas |

### 0.3 Componentes Actualizados

- ❌ `components/cliente/ChatSection.tsx` - **ELIMINADO** - Chat no se usará en esta versión del panel cliente (MVP)
- ✅ `components/cliente/CalendarioSection.tsx` - Removido gating PRO
- ✅ `components/cliente/NotificacionesSection.tsx` - Removido gating STARTER
- ✅ `components/cliente/CuadrillasSection.tsx` - Removido gating STARTER
- ✅ `components/cliente/AsignarSection.tsx` - Removido gating cuadrillas
- ✅ `lib/permissions.ts` - Removidas reglas de feature para chat, calendario, notificaciones, cuadrillas

### 0.4 Comportamiento de Banners

- Los banners de upgrade solo se muestran cuando:
  - Usuario intenta crear obra y ya tiene el máximo permitido
  - Usuario intenta crear tarea y ya tiene el máximo permitido
  - Usuario intenta crear cuadrilla y ya tiene el máximo permitido
- Usuarios PRO nunca ven banners (tienen límites altos o ilimitados)
- El modal de upgrade y la lógica de CTA se mantienen, solo cambia CUÁNDO se dispara

---

## 1. QUÉ FALTA PARA MVP 1.0

### 1.1 Validaciones y UX Críticas
- ❌ **Validación de formularios en tiempo real**: Algunos formularios no tienen validación completa
- ❌ **Mensajes de error más descriptivos**: Muchos errores backend no tienen feedback visual claro al usuario
- ❌ **Confirmaciones para acciones destructivas**: Eliminar obra/tarea sin confirmación clara en todos los casos
- ❌ **Prevención de acciones duplicadas**: No hay debounce en algunos botones críticos
- ❌ **Empty states informativos**: Algunas secciones no tienen mensajes cuando no hay datos
- ❌ **Loading states consistentes**: Algunos componentes usan diferentes patrones de carga

### 1.2 Visibilidad y Permisos
- ⚠️ **Banners de restricción de plan**: Implementados pero podrían mejorarse con CTAs más claros
- ❌ **Verificación de permisos granular**: Algunas acciones no verifican permisos antes de mostrar botones
- ❌ **Mensajes claros cuando no hay permisos**: Algunos errores 403 no muestran mensaje amigable con opción de upgrade

### 1.3 Chat y Mensajería
- ❌ **Chat con GrowsBot**: **ELIMINADO** - Chat no se usará en esta versión del panel cliente (MVP)
- ⚠️ **Mensajería directa**: Componente `MensajeriaDirecta.tsx` existe pero no está integrado en el flujo principal
- ⚠️ **Chat por obra**: Disponible en sección Notificaciones > tab Mensajes (componente `ChatPorObra`)

### 1.4 Funcionalidades Pendientes
- ❌ **Exportación de reportes PDF**: Mencionado en documentación pero no implementado
- ❌ **Vista de planta específica**: TODO en `DetalleObra.tsx` línea 889
- ❌ **Filtrado de elementos por planta**: TODO en `DetalleObra.tsx` línea 894
- ❌ **Timeline interactivo**: Componente `TimelineInteractivo.tsx` existe pero no está integrado
- ❌ **Calendario funcional**: Componente básico pero sin funcionalidad completa

### 1.5 Mobile y Responsive
- ⚠️ **Sidebar en mobile**: Se colapsa pero podría mejorarse
- ❌ **Menu hamburguesa**: No implementado para mobile
- ❌ **Touch targets**: Algunos botones pueden ser muy pequeños en mobile (< 44x44px)
- ❌ **Scroll horizontal**: Tablas no tienen scroll horizontal en mobile

### 1.6 Performance y Optimización
- ⚠️ **Paginación**: Algunas listas largas no tienen paginación (obras, tareas, movimientos)
- ❌ **Virtual scrolling**: No implementado para listas muy largas
- ❌ **Debounce en búsquedas**: No implementado
- ❌ **Cache de datos**: No hay cache de datos frecuentemente accedidos
- ❌ **Lazy loading de imágenes**: No implementado

### 1.7 Logging y Debugging
- ❌ **Sistema de logging**: 106+ `console.log/error/warn` en componentes cliente necesitan ser reemplazados por sistema de logging estructurado
- ❌ **Remoción en producción**: Console.logs deben removerse o condicionarse a modo desarrollo

### 🟩 MARTES — Trabajo realizado y tareas del día

🟩 MARTES — Validación de Bloques y Pulido Final del Panel Cliente

**Objetivo del día:**  
Dejar la validación de bloques 100% utilizable por un cliente real, con mensajes unificados, banners correctos y sin errores silenciosos.

#### ✔ ValidarSection — QA y Correcciones Finales

- Evidencia visible correctamente por bloque.

- Nombre del bloque y nombre de la tarea revisados.

- Monto estimado y monto validado visibles.

- Estados FSM correctos: pendiente / para_validar / validado / rechazado.

- Mini-checklist QA aplicado: validar, rechazar, error backend.

#### ✔ Mensajes unificados (toast)

- "Bloque validado y pago procesado".

- "Bloque rechazado — el socio podrá retomarlo".

- "Error de conexión. Intente nuevamente."  

- "Tu plan no habilita esta funcionalidad."  

Sin errores silenciosos.

#### ✔ Sistema de suscripción actualizado (Diciembre 2024)

**NUEVA LÓGICA:**
- ❌ **Eliminado:** Gating por sección (Chat, Calendario, Notificaciones, Cuadrillas)
- ✅ **Implementado:** Gating solo por límites (obras activas, tareas activas, cuadrillas)

**Límites por plan:**
- **FREE:** 2 obras activas, 0 tareas activas, 0 cuadrillas
- **STARTER:** 5 obras activas, 3 tareas activas, 3 cuadrillas
- **PRO:** 10 obras activas, 10 tareas activas, cuadrillas ilimitadas

**Banners de upgrade:**
- Solo se muestran cuando el usuario EXCEDE los límites permitidos
- PRO users nunca ven banners
- Todas las secciones (Chat, Calendario, Notificaciones, Cuadrillas) están disponibles para todos los planes

#### ✔ Limpieza final del código

- Eliminados todos los console.log / warn / error.

- Sin referencias a lógica legacy de validación.

- Sin metodoPago ni estados no oficiales.

- Código estable y determinista.

#### ✔ Actualización de estado del proyecto

Agregado en `front_cliente_state.md`:

- En "Hecho esta semana": validación FSM completa, modales, toasts unificados, banners, limpieza total de logs.

- En "Pendiente": mobile-first, reportes PDF, mensajería directa (si no entra en MVP).

---

## 2. PROBLEMAS DETECTADOS

### 2.1 Errores y Warnings
- **106+ console.log/error/warn** en componentes cliente
  - Ubicaciones principales: `ValidarSection.tsx` (antes del refactor), `ObrasSection.tsx`
  - ~~`ChatSection.tsx`~~ - **ELIMINADO** - Chat no se usará en esta versión del panel cliente (MVP)
  - Necesitan ser reemplazados por sistema de logging o removidos en producción
- **Manejo de errores inconsistente**: 
  - Algunos errores se muestran al usuario con toast
  - Otros solo en consola sin feedback visual
- **Errores de TypeScript**: 
  - Algunos componentes usan `any` o tipos incompletos
  - Ejemplo: `createClientComponentClient<Database>() as any` en varios lugares

### 2.2 Dependencias de Backend
- **Endpoints faltantes o incompletos:**
  - `GET /api/obras/[id]/plantas` - Usado en `DetalleObra.tsx` línea 368 pero no verificado si existe
  - `GET /api/legajo/[obra_id]` - Mencionado en documentación pero no verificado
  - `POST /api/legajo/upload` - Mencionado en documentación pero no verificado
- **Headers requeridos**: 
  - Muchos endpoints requieren `x-organizacion-id` y `x-usuario-id`
  - No siempre están presentes, causando fallos silenciosos
  - Falta manejo de errores cuando headers faltan

### 2.3 Integración con n8n
- **Fallback implementado**: Si n8n no está disponible, usa respuestas predefinidas
- **Riesgo**: Chat puede fallar silenciosamente si n8n no responde y fallback no funciona
- **No hay retry logic**: Si falla la conexión, no se reintenta automáticamente
- **No hay timeout configurado**: Peticiones pueden quedar colgadas

### 2.4 Estados y Sincronización
- **Realtime subscriptions**: 
  - Implementadas para notificaciones pero pueden tener problemas de sincronización
  - No hay manejo de reconexión si se pierde conexión
- **Estados optimistas**: 
  - No implementados, puede causar UX confusa
  - Usuario puede hacer clic múltiples veces esperando respuesta
- **Race conditions**: 
  - Posibles en actualizaciones concurrentes
  - Ejemplo: Validar múltiples bloques simultáneamente

### 2.5 Seguridad
- **Validación de permisos**: 
  - Implementada pero no exhaustiva en todos los componentes
  - Algunas acciones no verifican permisos antes de mostrar UI
- **Sanitización de inputs**: 
  - No verificada en todos los formularios
  - Especialmente en campos de texto largo (comentarios, motivos)
- **Protección CSRF**: 
  - No verificada
  - Next.js tiene protección por defecto pero debería confirmarse

### 2.6 Accesibilidad
- **Navegación por teclado**: Parcialmente implementada
- **Labels ARIA**: Faltantes en algunos componentes críticos
- **Contraste de colores**: No verificado según WCAG
- **Focus visible**: No consistente en todos los componentes

---

## 3. RIESGOS

### 3.1 Riesgos Críticos (Bloqueantes MVP)
1. **Endpoints no verificados**: 
   - `GET /api/obras/[id]/plantas` puede fallar en producción
   - Endpoints de legajo pueden no existir
   - **Impacto**: Funcionalidades rotas en producción

2. **Headers faltantes**: 
   - Si `x-organizacion-id` o `x-usuario-id` no están presentes, muchas funcionalidades fallan
   - **Impacto**: Usuarios no pueden usar la aplicación

3. **n8n no disponible**: 
   - Chat falla sin fallback adecuado
   - **Impacto**: Funcionalidad principal no disponible

### 3.2 Riesgos Altos (Afectan UX)
1. **Console.logs en producción**: 
   - Pueden exponer información sensible
   - Degradan performance
   - **Impacto**: Seguridad y performance

2. **Manejo de errores inconsistente**: 
   - Usuarios no saben qué salió mal
   - **Impacto**: Frustración del usuario

3. **Falta de validaciones**: 
   - Datos inválidos pueden llegar al backend
   - **Impacto**: Errores en backend, datos corruptos

### 3.3 Riesgos Medianos (Mejoras futuras)
1. **Mobile no optimizado**: 
   - Usuarios en mobile tienen mala experiencia
   - **Impacto**: Pérdida de usuarios mobile

2. **Performance en listas largas**: 
   - Sin paginación/virtual scroll, listas largas son lentas
   - **Impacto**: Experiencia lenta

3. **Falta de estados optimistas**: 
   - UX confusa cuando hay latencia
   - **Impacto**: Percepción de lentitud

---

## 4. BLOQUEOS

### 4.1 Bloqueos Técnicos
1. **Endpoints backend no disponibles**: 
   - `GET /api/obras/[id]/plantas`
   - Endpoints de legajo
   - **Acción requerida**: Verificar con backend o implementar alternativa

2. **Dependencia de n8n**: 
   - Chat requiere n8n funcionando
   - **Acción requerida**: Mejorar fallback o hacer n8n opcional

3. **Headers requeridos**: 
   - Falta manejo robusto cuando headers no están presentes
   - **Acción requerida**: Implementar verificación y mensaje de error claro

### 4.2 Bloqueos de Diseño/UX
1. **Falta de definiciones de UX**: 
   - Mensajes de error no definidos
   - Empty states no definidos
   - **Acción requerida**: Definir con PM/UX

2. **Restricciones de plan no claras**: 
   - Algunas restricciones pueden cambiar
   - **Acción requerida**: Confirmar con PM

### 4.3 Bloqueos de Negocio
1. **Priorización de features**: 
   - No está claro qué es crítico para MVP
   - **Acción requerida**: Priorizar con PM

---

## 5. PRIORIDADES

### 5.1 Prioridad CRÍTICA (Antes de MVP)
1. ✅ **Verificar endpoints faltantes** con backend
2. ✅ **Remover/reemplazar console.logs** en producción
3. ✅ **Mejorar manejo de errores** con feedback visual consistente
4. ✅ **Implementar validaciones críticas** en formularios
5. ⚠️ **Integrar mensajería directa** (si es crítica para MVP)

### 5.2 Prioridad ALTA (MVP 1.0)
1. ⚠️ **Empty states informativos** en todas las secciones
2. ⚠️ **Loading states consistentes** en todos los componentes
3. ⚠️ **Confirmaciones para acciones destructivas**
4. ⚠️ **Banners de upgrade mejorados** con CTAs claros
5. ⚠️ **Verificación de permisos granular** antes de mostrar acciones

### 5.3 Prioridad MEDIA (Post-MVP)
1. ❌ **Optimizaciones de performance** (paginación, virtual scroll)
2. ❌ **Mejoras mobile** (menú hamburguesa, touch targets)
3. ❌ **Historial de chat persistente**
4. ❌ **Exportación de reportes PDF**
5. ❌ **Calendario funcional completo**

### 5.4 Prioridad BAJA (Mejoras futuras)
1. ❌ **Búsqueda de mensajes**
2. ❌ **Adjuntar archivos en chat**
3. ❌ **Notificaciones push**
4. ❌ **Timeline interactivo**
5. ❌ **Mejoras de accesibilidad**

---

## 6. QUÉ NECESITÁS DEL PM PARA AVANZAR

### 6.1 Priorización de Features
**Preguntas críticas:**
1. ¿Cuáles son las features **críticas** para MVP 1.0?
   - ¿Calendario es crítico o puede esperar?
   - ¿Mensajería directa es crítica o solo chat con GrowsBot?
   - ¿Exportación de reportes PDF es crítica?
   - ¿Mobile es crítico para MVP?

2. ¿Cuál es el **flujo principal** que debe funcionar perfecto?
   - ¿Qué flujos pueden tener limitaciones temporales?

3. **Definir orden de prioridad:**
   - Qué debe estar 100% funcional para MVP
   - Qué puede tener limitaciones
   - Qué puede esperar post-MVP

### 6.2 Definiciones de UX
**Necesitamos definir:**
1. **Mensajes de error**: Textos exactos para cada tipo de error común
   - Error de red
   - Error de permisos
   - Error de validación
   - Error genérico

2. **Empty states**: Qué mostrar cuando no hay datos en cada sección
   - Lista de obras vacía
   - Lista de tareas vacía
   - Sin notificaciones
   - Sin movimientos en billetera

3. **Loading states**: Patrones consistentes de carga
   - Skeleton loaders vs spinners
   - Tiempo máximo antes de mostrar error

4. **Confirmaciones**: Qué acciones requieren confirmación
   - Eliminar obra
   - Eliminar tarea
   - Rechazar presupuesto
   - Rechazar bloque

### 6.3 Restricciones de Plan
**Necesitamos confirmar:**
1. **Restricciones actuales**:
   - Chat: ¿PRO o puede ser STARTER?
   - Notificaciones: ¿STARTER o puede ser FREE?
   - Calendario: ¿PRO o puede ser STARTER?
   - Cuadrillas: ¿STARTER confirmado?

2. **Definir mensajes de upgrade**: Textos exactos para cada restricción
   - Mensaje cuando se alcanza límite de obras
   - Mensaje cuando se intenta usar feature bloqueada
   - CTAs para upgrade

3. **Banners de upgrade**: 
   - ¿Dónde deben aparecer?
   - ¿Cuándo deben aparecer?
   - ¿Qué tan prominentes deben ser?

### 6.4 Validaciones y Reglas de Negocio
**Necesitamos definir:**
1. **Validaciones de formularios**: Reglas exactas para cada campo
   - Nombres: longitud mínima/máxima, caracteres permitidos
   - Montos: rango válido, decimales
   - Fechas: rango válido, formato

2. **Límites de caracteres**: Límites para textos largos
   - Comentarios en presupuestos
   - Motivos de rechazo
   - Descripciones

3. **Formatos de archivo**: Qué formatos se aceptan en cada upload
   - Evidencias: ¿solo imágenes o también PDFs?
   - Legajo: formatos permitidos
   - Límites de tamaño

### 6.5 Integraciones
**Necesitamos definir:**
1. **n8n**: 
   - ¿Cuál es el comportamiento esperado si n8n no está disponible?
   - ¿Qué tan crítico es el chat para MVP?
   - ¿Debe haber timeout? ¿Cuánto?

2. **MercadoPago**: 
   - ¿Hay integración de pagos desde el frontend cliente?
   - ¿O solo visualización de movimientos?

3. **Notificaciones push**: 
   - ¿Se implementan notificaciones push o solo in-app?
   - ¿Es crítico para MVP?

### 6.6 Mobile
**Necesitamos definir:**
1. **¿Mobile es crítico para MVP 1.0?**
   - Si es crítico: Definir qué funcionalidades son prioritarias en mobile
   - Si no es crítico: Definir cuándo se implementará

2. **Experiencia mobile mínima:**
   - ¿Qué debe funcionar perfecto en mobile?
   - ¿Qué puede tener limitaciones?

### 6.7 Testing y QA
**Necesitamos:**
1. **Definir casos de prueba críticos** para cada flujo principal
2. **Definir usuarios de prueba** con diferentes planes (FREE, STARTER, PRO)
3. **Definir datos de prueba** para desarrollo y testing

### 6.8 Documentación
**Necesitamos confirmar:**
1. ¿Necesitas documentación de usuario?
2. ¿Necesitas guías de onboarding?
3. ¿Necesitas videos tutoriales?

---

## 7. RESUMEN EJECUTIVO

### Estado General: **~75% Completo**

**Funcionando bien:**
- ✅ Dashboard y navegación
- ✅ Gestión de obras
- ✅ Validación de bloques (refactorizada MVP 1.0)
- ✅ Billetera
- ✅ Notificaciones (con restricciones)
- ✅ Presupuestos

**Necesita trabajo:**
- ⚠️ Chat (depende de n8n, mejora fallback)
- ⚠️ Mensajería directa (no integrada)
- ⚠️ Calendario (básico)
- ⚠️ Mobile responsive
- ⚠️ Validaciones y UX
- ⚠️ Performance (paginación, etc.)
- ⚠️ Logging (remover console.logs)

**Bloqueantes para MVP:**
- ❌ Verificar endpoints faltantes con backend
- ❌ Mejorar manejo de errores con feedback visual
- ❌ Implementar validaciones críticas
- ❌ Remover/reemplazar console.logs
- ❌ Integrar mensajería directa (si es crítica)

**Riesgos principales:**
- ⚠️ Dependencia de n8n para chat
- ⚠️ Headers requeridos pueden fallar
- ⚠️ Console.logs en producción
- ⚠️ Estados de carga inconsistentes
- ⚠️ Endpoints no verificados

---

## 8. PRÓXIMOS PASOS RECOMENDADOS

### Inmediatos (Esta semana)
1. ✅ Revisar y verificar endpoints faltantes con backend
2. ✅ Implementar sistema de logging en lugar de console.log
3. ✅ Mejorar manejo de errores y feedback visual
4. ✅ Priorizar features con PM
5. ✅ Implementar validaciones críticas

### Corto plazo (Próximas 2 semanas)
1. ⚠️ Implementar empty states informativos
2. ⚠️ Unificar loading states
3. ⚠️ Agregar confirmaciones para acciones destructivas
4. ⚠️ Mejorar banners de upgrade
5. ⚠️ Testing de flujos principales

### Medio plazo (Post-MVP)
1. ❌ Optimizaciones de performance
2. ❌ Mejoras mobile
3. ❌ Funcionalidades avanzadas (calendario completo, etc.)

---

## 9. DEPENDENCIAS EXTERNAS

### Backend
- **Endpoints**: Algunos endpoints necesitan verificación
- **Headers**: Necesitan estar siempre presentes
- **FSM**: Backend maneja FSM oficial, frontend debe respetarla

### n8n
- **Chat**: Requiere n8n funcionando
- **Fallback**: Implementado pero puede mejorarse
- **Timeout**: No configurado

### Supabase
- **Realtime**: Funciona pero necesita manejo de reconexión
- **Storage**: Funciona para evidencias y documentos
- **Auth**: Funciona correctamente

---

## 10. NOTAS FINALES

El frontend cliente está en buen estado general pero necesita:
- **Pulir detalles** para MVP 1.0 (validaciones, errores, UX)
- **Verificar integraciones** con backend
- **Definir prioridades** con PM
- **Optimizar** para producción (logging, performance)

La base es sólida y funcional. Los faltantes son principalmente mejoras de UX y verificaciones técnicas.


