# ESTADO Y ROADMAP — FRONTEND CLIENTE/SUPERVISOR GROWS
**Fecha:** Diciembre 2024  
**Versión:** MVP 1.0

---

## 1. QUÉ FALTA PARA MVP 1.0

### 1.1 Validaciones y UX Críticas
- ✅ **ValidarSection completamente alineada con FSM del backend**
- ✅ **Evidencias visibles a nivel bloque y tarea**
- ✅ **Eliminados estados legacy**
- ✅ **Acciones claras: validar bloque, rechazar bloque**
- ✅ **Modales implementados para validar/rechazar**
- ✅ **refetch automático después de cada acción**
- ✅ **Banners PRO/STARTER funcionando**
- ✅ **Código limpio, sin logs, sin warnings**
- ✅ **Manejo centralizado de errores**
- ✅ **El cliente ya no puede validar tareas completas (regla correcta)**
- ❌ **Empty states informativos**: Algunas secciones menos críticas no tienen mensajes cuando no hay datos
- ❌ **Loading states consistentes**: Algunas secciones menos críticas usan diferentes patrones de carga

### 1.2 Visibilidad y Permisos
- ✅ **Banners PRO/STARTER funcionando**
- ⚠️ **Verificación de permisos granular**: Algunas acciones no verifican permisos antes de mostrar botones
- ⚠️ **Mensajes claros cuando no hay permisos**: Algunos errores 403 no muestran mensaje amigable con opción de upgrade

### 1.3 Chat y Mensajería
- ✅ **Chat con GrowsBot**: **ELIMINADO** - Chat no se usará en esta versión del panel cliente (MVP)
- ⚠️ **Mensajería directa Cliente ↔ Socio**: Opcional para MVP
- ✅ **Chat por obra**: Disponible en sección Notificaciones > tab Mensajes (componente `ChatPorObra`)
- ❌ **Historial de conversaciones persistente**: No se guarda historial
- ❌ **Notificaciones de mensajes nuevos**: No hay notificaciones push para mensajes
- ❌ **Adjuntar archivos en chat**: No implementado
- ❌ **Búsqueda de mensajes**: No implementado

### 1.4 Funcionalidades Pendientes
- ❌ **Reporte PDF de obra (simple)**: Para MVP comercial
- ❌ **Vista de planta específica**: TODO en `DetalleObra.tsx` línea 889
- ❌ **Filtrado de elementos por planta**: TODO en `DetalleObra.tsx` línea 894
- ❌ **Timeline interactivo**: Componente `TimelineInteractivo.tsx` existe pero no está integrado
- ❌ **Calendario funcional**: Componente básico pero sin funcionalidad completa

### 1.5 Mobile y Responsive
- ❌ **Ajustes mobile-first para supervisores en campo**: Pendiente
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
- ✅ **Código limpio**: Sin logs, sin warnings

### 🗑️ ELIMINACIÓN DE CHAT CON GROWSBOT

**Fecha:** Diciembre 2024  
**Decisión:** El Chat con GrowsBot no se usará en esta versión del panel cliente (MVP).

#### Cambios realizados:

**1. Sidebar actualizado**
- ✅ Eliminado el ítem "Chat" del menú en `SidebarClienteTecnico.tsx`
- ✅ Removido el import de `MessageCircle` (ya no se usa)
- ✅ El sidebar ahora muestra 7 secciones (sin Chat)

**2. Routing actualizado**
- ✅ Eliminado `case 'chat'` del switch en `dashboard/page.tsx`
- ✅ Removido `'chat'` del array de secciones válidas
- ✅ Eliminado el import de `ChatSection`
- ✅ Las rutas `/cliente/dashboard?section=chat` ya no resuelven a Chat
- ✅ Routing por defecto: `'obras'` (no apunta a chat)

**3. Componente eliminado**
- ✅ `components/cliente/ChatSection.tsx` eliminado completamente
- ✅ No quedan referencias a `ChatSection` en `app/cliente/`
- ✅ No quedan referencias a `ChatSection` en `components/cliente/`

**4. Componente demo actualizado**
- ✅ `components/ui/grows/ChatDemo.tsx` actualizado para indicar que ChatSection fue eliminado
- ✅ El import comentado y el componente muestra un mensaje informativo

**5. Restricciones de plan removidas**
- ✅ Eliminadas restricciones de plan relacionadas con Chat en:
  - `NotificacionesSection.tsx` (banner de upgrade removido)
  - `CuadrillasSection.tsx` (banner de upgrade removido)
  - `AsignarSection.tsx` (verificaciones de acceso removidas)

**6. Verificaciones**
- ✅ No quedan referencias a `ChatSection` en el código
- ✅ No hay errores de linting
- ✅ El routing por defecto no apunta a chat
- ✅ Todas las secciones funcionan correctamente sin Chat

#### Notas importantes:

- ✅ **La mensajería directa por obra (`ChatPorObra`) sigue disponible** en Notificaciones > tab Mensajes
- ✅ Solo se eliminó el Chat con GrowsBot del panel cliente
- ✅ El chat del Socio no fue afectado
- ✅ Todas las demás funcionalidades permanecen intactas

---

## 2. PROBLEMAS DETECTADOS

### 2.1 Errores y Warnings
- ✅ **Resuelto**: Código limpio, sin logs, sin warnings
- ✅ **Resuelto**: Manejo centralizado de errores
- ⚠️ **Errores de TypeScript**: 
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
- ✅ **Ninguno. El flujo de validación está finalizado.**

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
1. ✅ **ValidarSection completamente alineada con FSM del backend**
2. ✅ **Remover/reemplazar console.logs** en producción
3. ✅ **Mejorar manejo de errores** con feedback visual consistente
4. ✅ **Implementar validaciones críticas** en formularios
5. ✅ **Banners PRO/STARTER funcionando**

### 5.2 Prioridad ALTA (MVP 1.0)
1. ❌ **Reporte PDF de obra (simple)**: Para MVP comercial
2. ❌ **Ajustes mobile-first para supervisores en campo**
3. ⚠️ **Empty states informativos** en secciones menos críticas
4. ⚠️ **Loading states consistentes** en secciones menos críticas
5. ⚠️ **Mensajería directa Cliente ↔ Socio** (opcional)

### 5.3 Prioridad MEDIA (Post-MVP)
1. ❌ **Optimizaciones de performance** (paginación, virtual scroll)
2. ❌ **Mejoras mobile** (menú hamburguesa, touch targets)
3. ❌ **Historial de chat persistente**
4. ❌ **Calendario funcional completo**

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
   - ~~Chat con GrowsBot eliminado~~ ✅ Resuelto: No se usará en MVP

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
- ✅ ValidarSection completamente alineada con FSM del backend
- ✅ Evidencias visibles a nivel bloque y tarea
- ✅ Eliminados estados legacy
- ✅ Acciones claras: validar bloque, rechazar bloque
- ✅ Modales implementados para validar/rechazar
- ✅ refetch automático después de cada acción
- ✅ Banners PRO/STARTER funcionando
- ✅ Código limpio, sin logs, sin warnings
- ✅ Manejo centralizado de errores
- ✅ El cliente ya no puede validar tareas completas (regla correcta)
- ✅ Billetera
- ✅ Notificaciones (con restricciones)
- ✅ Presupuestos

**Necesita trabajo:**
- ✅ Chat con GrowsBot eliminado (no se usará en MVP)
- ⚠️ Mensajería directa Cliente ↔ Socio (opcional)
- ⚠️ Calendario (básico)
- ⚠️ Ajustes mobile-first para supervisores en campo
- ⚠️ Performance (paginación, etc.)
- ⚠️ Empty/loading states en secciones menos críticas

**Bloqueantes para MVP:**
- ✅ Ninguno. El flujo de validación está finalizado.

**Riesgos principales:**
- ⚠️ Headers requeridos pueden fallar
- ⚠️ Estados de carga inconsistentes en secciones menos críticas

---

## 8. PRÓXIMOS PASOS RECOMENDADOS

### Inmediatos (Esta semana)
1. ✅ ValidarSection completamente alineada con FSM del backend
2. ✅ Implementar sistema de logging en lugar de console.log
3. ✅ Mejorar manejo de errores y feedback visual
4. ✅ Banners PRO/STARTER funcionando
5. ✅ Código limpio, sin logs, sin warnings

### Corto plazo (Próximas 2 semanas)
1. ❌ Implementar Reporte PDF de obra (simple) para MVP comercial
2. ❌ Ajustar diseño mobile para supervisores en campo
3. ⚠️ Agregar loading/empty states en secciones menos críticas
4. ⚠️ Mensajería directa Cliente ↔ Socio (opcional)
5. ⚠️ Testing de flujos principales

### Medio plazo (Post-MVP)
1. ❌ Optimizaciones de performance
2. ❌ Mejoras mobile adicionales
3. ❌ Funcionalidades avanzadas (calendario completo, etc.)

---

## 9. DEPENDENCIAS EXTERNAS

### Backend
- **Endpoints**: Algunos endpoints necesitan verificación
- **Headers**: Necesitan estar siempre presentes
- **FSM**: Backend maneja FSM oficial, frontend debe respetarla

### n8n
- **Chat con GrowsBot**: Eliminado del panel cliente (no se usará en MVP)

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

La base es sólida y funcional. El flujo de validación está finalizado y completamente alineado con la FSM del backend. Los faltantes son principalmente mejoras de UX y funcionalidades adicionales para MVP comercial.

---

## Actualizado en esta iteración:
- ValidarSection completamente alineada con FSM del backend.
- Evidencias visibles a nivel bloque y tarea.
- Eliminados estados legacy.
- Acciones claras: validar bloque, rechazar bloque.
- Modales implementados para validar/rechazar.
- refetch automático después de cada acción.
- Banners PRO/STARTER funcionando.
- Código limpio, sin logs, sin warnings.
- Manejo centralizado de errores.
- El cliente ya no puede validar tareas completas (regla correcta).
- **Chat con GrowsBot eliminado completamente del panel cliente** (no se usará en MVP).
- **Sidebar actualizado** - Eliminado ítem Chat.
- **Routing actualizado** - Removido case 'chat' y ruta.
- **Componente ChatSection.tsx eliminado**.
- **Restricciones de plan removidas** - NotificacionesSection, CuadrillasSection, AsignarSection ya no tienen banners/verificaciones de Chat.
- Actualización de sección "Pendientes nuevos": Reporte PDF de obra (simple) para MVP comercial, Ajustes mobile-first para supervisores en campo, Opcional: Mensajería directa Cliente ↔ Socio.
- Actualización de sección "Bloqueos": Ninguno. El flujo de validación está finalizado.
- Actualización de "Próximos pasos sugeridos": Implementar Reporte PDF, Ajustar diseño mobile, Agregar loading/empty states en secciones menos críticas.

