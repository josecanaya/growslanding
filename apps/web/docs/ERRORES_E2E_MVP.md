# ERRORES E2E — MVP GROWS
Fecha: Diciembre 2024

## FRONT SOCIO
- [ ] 

## FRONT CLIENTE

### Error de Autenticación PKCE al iniciar sesión
**Error:** `AuthApiError: invalid request: both auth code and code verifier should be non-empty`

**Descripción:**
- El error aparece brevemente en la consola al iniciar sesión, pero después el inicio de sesión funciona normalmente
- Ocurre cuando el `code_verifier` del flujo PKCE no está disponible en localStorage del navegador
- Puede suceder por: cookies bloqueadas, modo incógnito, múltiples pestañas autenticando simultáneamente, o limpieza de localStorage

**Causa raíz:**
- Supabase Auth usa PKCE (Proof Key for Code Exchange) para seguridad OAuth
- El `code_verifier` se guarda en localStorage antes de la redirección OAuth
- Si este valor no está disponible al regresar del callback, falla el intercambio del código

**Solución implementada:**
- ✅ Mejorado el manejo de errores PKCE en `app/auth/callback/page.tsx`
- ✅ Detección mejorada del error PKCE (incluye "both auth code and code verifier")
- ✅ Cuando ocurre el error PKCE, intenta recuperar la sesión directamente con `getSession()`
- ✅ Si la sesión existe, continúa el flujo normalmente sin mostrar error al usuario
- ✅ Si no hay sesión, limpia la URL y redirige a login con error silencioso
- ✅ Manejo de error `oauth_retry` en login para no mostrar mensaje al usuario (sesión puede funcionar)

**Estado:** ✅ RESUELTO - El error se maneja silenciosamente y no afecta la experiencia del usuario

**Archivos modificados:**
- `app/auth/callback/page.tsx` - Manejo mejorado de errores PKCE
- `app/auth/login/page.tsx` - Manejo silencioso de error `oauth_retry`

### Mejora de UX/UI del Botón Tutorial
**Estado:** ✅ MEJORADO

**Mejoras implementadas:**
- ✅ **Tamaño aumentado**: Botón ahora usa `px-5 py-3` y texto `text-base` (antes `px-3 py-1.5` y `text-sm`)
- ✅ **Color más visible**: Cambiado a gradiente dorado (`from-[#CBA135] to-[#E2B043]`) con hover más destacado
- ✅ **Icono más intuitivo**: 
  - Variante inline: Icono `BookOpen` (libro abierto)
  - Variante fixed: Icono `HelpCircle` (círculo de ayuda)
  - Ambos con animación sutil al hover
- ✅ **Dos variantes disponibles**:
  - `variant="inline"` (por defecto): Para uso inline en layouts
  - `variant="fixed"`: Botón flotante fijo en esquina inferior izquierda (`fixed bottom-6 left-6`)
- ✅ **Mejoras de UX**:
  - Shadow elevado para mejor visibilidad
  - Transiciones suaves con `hover:scale-105`
  - Animación de icono al hover
  - Mejor contraste con texto blanco sobre fondo dorado

**Uso:**
```tsx
// Variante inline (por defecto)
<TutorialButton onClick={startOnboarding} />

// Variante fixed (botón flotante)
<TutorialButton onClick={startOnboarding} variant="fixed" />
```

**Archivos modificados:**
- `components/common/TutorialButton.tsx` - Componente completamente mejorado

### Mejora de UX/UI del Botón "Crear Obra"
**Estado:** ✅ MEJORADO

**Mejoras implementadas:**
- ✅ **Tamaño aumentado**: 
  - Padding aumentado: `px-6 py-4` (antes `px-6 py-3`)
  - Icono más grande: `h-6 w-6` (antes `h-5 w-5`)
  - Texto `text-base` con `font-semibold` para mayor visibilidad
- ✅ **Color cambiado a azul primario Grows**: 
  - Fondo: `bg-[#0C1D36]` (azul petróleo primario)
  - Hover: `hover:bg-[#1a3652]` (azul más claro)
  - Removido el color verde anterior (`#86EFAC`)
- ✅ **Icono + texto**: 
  - Icono `Plus` más grande y visible
  - Texto "Crear obra" siempre visible
  - Alineación perfecta entre icono y texto
- ✅ **Posición mejorada - Fixed Top Right**: 
  - Botón fijo en esquina superior derecha: `fixed top-20 right-6 z-40`
  - Siempre visible al hacer scroll
  - No interfiere con el contenido principal
  - Z-index adecuado para estar sobre otros elementos
- ✅ **Mejoras de UX adicionales**:
  - Shadow elevado en hover: `hover:shadow-xl`
  - Transiciones suaves: `hover:scale-105` y `active:scale-95`
  - Focus ring para accesibilidad: `focus:ring-2 focus:ring-[#0C1D36]`
  - Mejor contraste con texto blanco sobre fondo azul

**Cambios de diseño:**
- El botón ahora es más prominente y siempre accesible
- Posición fixed permite acceso rápido desde cualquier parte de la página
- Color azul primario alinea el botón con la identidad visual de Grows

**Archivos modificados:**
- `components/cliente/ObrasSection.tsx` - Botón "Crear obra" mejorado y movido a posición fixed top-right

### Feature: Fechas Estimadas de Obras
**Estado:** ✅ IMPLEMENTADO (Frontend completo)

**Cambios implementados:**
- ✅ **Tipos TypeScript actualizados**: Agregados `fecha_inicio_estimada` y `fecha_final_estimada` a interface `Obra` y `ObraFormState`
- ✅ **Modal "Crear obra" actualizado**: 
  - Campo obligatorio "Fecha de inicio estimada" agregado
  - Validación: fecha no puede ser menor a fecha actual
  - Placeholder y ayuda contextual
- ✅ **Fetch de obras actualizado**: Incluye `fecha_inicio_estimada` y `fecha_final_estimada` en el SELECT
- ✅ **Mapeo de datos actualizado**: Los nuevos campos se mapean correctamente desde Supabase
- ✅ **Tarjetas de obras actualizadas**: 
  - Muestran "Inicio estimado: dd/mm/aaaa"
  - Muestran "Finalización estimada: dd/mm/aaaa" o "—" si no hay tareas
  - Formato claro y legible
- ✅ **Insert en Supabase actualizado**: Envía `fecha_inicio_estimada` al crear obra
- ✅ **Validación en frontend**: Verifica que `fecha_inicio_estimada` esté presente antes de crear

**Comportamiento:**
- El campo `fecha_inicio_estimada` es obligatorio al crear obra
- Si falta → error con mensaje claro
- Si la fecha es menor a hoy → error de validación
- La `fecha_final_estimada` se mostrará como "—" si es `NULL` (será calculada por el backend cuando haya tareas)

**Archivos modificados:**
- `types/obras.ts` - Tipos actualizados con nuevos campos
- `components/cliente/ObrasSection.tsx` - Modal, validación, fetch, mapeo y display
- `components/obras/ui/ObraCard.tsx` - Display de fechas estimadas

**Documentación Backend:**
- `docs/BACKEND_REQUIREMENTS_FECHAS_OBRAS.md` - Especificación completa de cambios requeridos en backend

**Pendiente Backend:**
- ⚠️ Agregar campos `fecha_inicio_estimada` y `fecha_final_estimada` a tabla `obras`
- ⚠️ Validar y guardar `fecha_inicio_estimada` en POST /api/obras
- ⚠️ Implementar cálculo automático de `fecha_final_estimada` basado en días presupuestados de tareas
- ⚠️ Ejecutar recálculo cuando se crean/editan/eliminan tareas

### Formato de Título en Tarjetas de Obras
**Estado:** ✅ MEJORADO

**Problema anterior:**
- El título aparecía como: "casa familiar – nombre del dueño"
- Formato confuso y difícil de leer

**Mejoras implementadas:**
- ✅ **Formato cambiado**: 
  - Nuevo formato: "Nombre del Dueño (Casa Familiar)"
  - El nombre del cliente aparece primero (más importante)
  - El tipo de obra aparece entre paréntesis
- ✅ **Capitalización correcta**: 
  - Función `formatearTituloObra()` capitaliza correctamente cada palabra
  - Maneja múltiples casos: nombre separado, nombre con guión, o datos separados
- ✅ **Soporte para múltiples formatos**: 
  - Si el nombre viene en formato "tipo – cliente", lo parsea automáticamente
  - Si tiene `cliente` y `tipoObra` separados, los usa directamente
  - Fallback inteligente si faltan datos
- ✅ **Responsive para mobile**: 
  - Uso de `break-words` para permitir salto de línea en palabras largas
  - `leading-tight` para mejor espaciado en dos líneas
  - `flex-1 min-w-0` para que el contenedor se adapte correctamente
  - `truncate` en ubicación para evitar overflow
  - El título se verá en dos líneas si es necesario en mobile

**Funcionalidad:**
- La función detecta automáticamente el formato de entrada
- Convierte "casa familiar – juan perez" → "Juan Perez (Casa Familiar)"
- Si tiene datos separados: usa `obra.cliente` y `obra.tipoObra`
- Capitaliza cada palabra correctamente (Title Case)

**Archivos modificados:**
- `components/cliente/ObrasSection.tsx` - Función `formatearTituloObra()` y aplicación en `ObraCard`
- `components/obras/ui/ObraCard.tsx` - Misma función y mejoras de formato aplicadas

## BACKEND
- [ ] 

## LÓGICA DE NEGOCIO
- [ ] 

## NOTAS GENERALES
- Los errores PKCE son comunes en entornos con restricciones de cookies/localStorage
- La solución actual permite que el flujo continúe si la sesión ya existe
- Si el problema persiste, considerar deshabilitar PKCE o usar otro método de autenticación
