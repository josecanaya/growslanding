# 📋 INFORME TÉCNICO COMPLETO: SISTEMA DE NOTIFICACIONES Y MENSAJES

**Fecha:** 27 de noviembre de 2025  
**Proyecto:** GROWS - Sistema de Gestión de Obras  
**Alcance:** Análisis exhaustivo basado EXCLUSIVAMENTE en el código real del repositorio

---

## 📌 METODOLOGÍA

Este informe está basado en:
- ✅ Análisis directo del código fuente
- ✅ Líneas de código específicas documentadas
- ✅ Payloads exactos que se insertan en la base de datos
- ✅ Comportamiento REAL, no comportamiento esperado
- ❌ NO incluye correcciones ni mejoras sugeridas (solo diagnóstico)

---

## 🟦 1. NOTIFICACIONES — ANÁLISIS COMPLETO

### 🔹 1.1 DÓNDE SE CREAN NOTIFICACIONES

#### **1.1.1 Endpoints que crean notificaciones en Supabase**

##### **A. `/api/obras/[id]/solicitar-presupuesto` (POST)**

**Archivo:** `apps/web/app/api/obras/[id]/solicitar-presupuesto/route.ts`  
**Líneas exactas:** 288-297

**Código real:**
```typescript
const { error: notificacionError } = await (supabase as any).from('notificaciones').insert({
  org_id: orgId,
  socio_id: payload.socioId,  // ❌ CAMPO INCORRECTO
  obra_id: obraId,
  tarea_id: tareasNuevas[0] || null,
  titulo: 'Nueva solicitud de presupuesto',
  mensaje: mensajeNotificacion,
  tipo: 'presupuesto',
  leida: false,
});
```

**Payload exacto insertado:**
```json
{
  "org_id": "<uuid-org>",
  "socio_id": "<uuid-socio>",        // ❌ PROBLEMA: Este campo NO se usa para filtrar en GET
  "obra_id": "<uuid-obra>",
  "tarea_id": "<uuid-tarea>" | null,
  "titulo": "Nueva solicitud de presupuesto",
  "mensaje": "Tenés 1 tarea para presupuestar..." | "Tenés N tareas...",
  "tipo": "presupuesto",
  "leida": false
}
```

**Campos faltantes:**
- ❌ `remitente_id` - NO se incluye (no se sabe quién solicita)
- ❌ `destinatario_id` - NO se incluye (debería ser `payload.socioId`)

**¿La notificación llega al socio?**
- ❌ **NO** - El endpoint GET `/api/notificaciones` filtra por `destinatario_id` (línea 25), pero esta notificación usa `socio_id`
- ❌ **Resultado:** La notificación se crea en la BD pero nunca se muestra al socio

**Manejo de errores:**
- Línea 299-302: Si falla, solo loguea el error pero NO falla la operación principal
- `console.error('[SOLICITAR_PRESUPUESTO] Error creando notificación:', notificacionError);`

##### **B. `/api/presupuestos/aprobar-socio` (POST)**

**Archivo:** `apps/web/app/api/presupuestos/aprobar-socio/route.ts`  
**Líneas exactas:** 334-347

**Código real:**
```typescript
// Líneas 315-332: Lógica para obtener destinatario_id
const clienteId = user.id;  // Remitente (cliente que aprueba)
let destinatarioId = socio_id;

// Validación: Si socio_id no es UUID válido, buscar en tabla socios
if (!destinatarioId || destinatarioId.length !== 36) {
  const { data: socioDataForNotif } = await supabaseAny
    .from('socios')
    .select('id')
    .eq('id', socio_id)
    .maybeSingle();
  
  if (socioDataForNotif) {
    destinatarioId = socioDataForNotif.id;
  }
}

// Líneas 334-347: Inserción
const { error: notifError } = await supabaseAny
  .from('notificaciones')
  .insert({
    org_id: orgId,
    obra_id: obra_id,
    tarea_id: null,
    remitente_id: clienteId,        // ✅ CORRECTO
    destinatario_id: destinatarioId, // ✅ CORRECTO
    tipo: 'presupuesto_aprobado',
    titulo: 'Presupuesto aprobado',
    mensaje: `Tu presupuesto fue aprobado. ${tareasAprobadas} tarea${tareasAprobadas === 1 ? '' : 's'} asignada${tareasAprobadas === 1 ? '' : 's'}. Pronto recibirás el cronograma de tareas.`,
    leida: false,
    created_at: new Date().toISOString(),
  });
```

**Payload exacto insertado:**
```json
{
  "org_id": "<uuid-org>",
  "obra_id": "<uuid-obra>",
  "tarea_id": null,
  "remitente_id": "<uuid-cliente>",      // ✅ Cliente que aprueba
  "destinatario_id": "<uuid-socio>",     // ✅ Socio que recibe
  "tipo": "presupuesto_aprobado",
  "titulo": "Presupuesto aprobado",
  "mensaje": "Tu presupuesto fue aprobado. N tarea(s) asignada(s)...",
  "leida": false,
  "created_at": "2025-11-27T..."
}
```

**¿La notificación llega al socio?**
- ✅ **SÍ** - Usa `destinatario_id` que es el campo correcto para filtrar en GET
- ✅ **Estado:** CORRECTO - Esta es la estructura que deberían usar todos los endpoints

##### **C. `/api/presupuestos/rechazar` (POST)**
- **Archivo:** `apps/web/app/api/presupuestos/rechazar/route.ts`
- **Línea:** 148-160
- **Datos insertados:**
  ```typescript
  {
    org_id: orgId,
    remitente_id: user.id,  // ✅ Correcto
    destinatario_id: socio_id,  // ✅ Correcto
    obra_id: obra_id,
    tarea_id: null,
    tipo: 'presupuesto_rechazado',
    titulo: 'Presupuesto rechazado',
    mensaje: mensajeNotificacion,
    leida: false,
  }
  ```
- **Estado:** ✅ Correcto

##### **D. `/api/tareas/[id]/asignar` (PATCH)**
- **Archivo:** `apps/web/app/api/tareas/[id]/asignar/route.ts`
- **Línea:** 140-151
- **Datos insertados:**
  ```typescript
  {
    org_id: tareaData.org_id,
    socio_id: socio_id,  // ⚠️ PROBLEMA: Usa socio_id en lugar de destinatario_id
    obra_id: tareaData.obra_id,
    tarea_id: tareaId,
    titulo: 'Tarea asignada',
    mensaje: `Te asignaron una nueva tarea en la obra.`,
    tipo: 'asignacion',
    leida: false,
  }
  ```
- **Problemas detectados:**
  - ❌ Usa `socio_id` en lugar de `destinatario_id`
  - ❌ No incluye `remitente_id`

##### **E. `/api/socio/presupuestos/bulk` (POST)**

**Archivo:** `apps/web/app/api/socio/presupuestos/bulk/route.ts`  
**Líneas exactas:** 220-242

**Código real:**
```typescript
// Líneas 220-224: Obtener owner_user_id de la organización
const { data: orgData } = await supabase
  .from('organizations')
  .select('owner_user_id')
  .eq('id', orgId)
  .maybeSingle();

// Líneas 226-238: Inserción (DENTRO DE TRY-CATCH)
await (supabase as any)
  .from('notificaciones')
  .insert({
    org_id: orgId,
    socio_id: null,  // Notificación para el cliente
    user_id_destinatario: orgData?.owner_user_id ?? null,  // ❌ COLUMNA NO EXISTE
    obra_id: payload.obra_id,
    tarea_id: null,
    titulo: 'Nuevo presupuesto recibido',
    mensaje: `El socio ${socio.email || 'socio'} envió ${presupuestosEnviados.length} presupuesto(s) para la obra`,
    tipo: 'presupuesto',
    leida: false,
  });
// Líneas 239-242: Error silencioso
catch (notifError) {
  console.error('[PRESUPUESTOS_BULK] Error creando notificación:', notifError);
  // No fallar la operación si falla la notificación
}
```

**Payload exacto insertado:**
```json
{
  "org_id": "<uuid-org>",
  "socio_id": null,
  "user_id_destinatario": "<uuid-owner>" | null,  // ❌ COLUMNA NO EXISTE EN LA TABLA
  "obra_id": "<uuid-obra>",
  "tarea_id": null,
  "titulo": "Nuevo presupuesto recibido",
  "mensaje": "El socio <email> envió N presupuesto(s) para la obra",
  "tipo": "presupuesto",
  "leida": false
}
```

**Campos incorrectos:**
- ❌ `user_id_destinatario` - **NO EXISTE** en la tabla `notificaciones`
- ❌ `socio_id: null` - No tiene sentido para notificación al cliente
- ❌ Falta `remitente_id` - No se sabe quién envía (debería ser `socio_id`)
- ❌ Falta `destinatario_id` - Debería ser `orgData.owner_user_id`

**¿La notificación llega al cliente?**
- ❌ **NO** - El INSERT falla porque `user_id_destinatario` no existe
- ❌ El error se captura silenciosamente (línea 239-242)
- ❌ **Resultado:** El cliente NO recibe notificación cuando el socio envía presupuesto
- ⚠️ **Impacto crítico:** Flujo de comunicación roto entre socio y cliente

##### **F. `AsignarSection.tsx` (Componente cliente)**
- **Archivo:** `apps/web/components/cliente/AsignarSection.tsx`
- **Línea:** 772-781
- **Datos insertados:**
  ```typescript
  {
    org_id: currentUser.orgId,
    socio_id: socioId,  // ⚠️ PROBLEMA: Usa socio_id en lugar de destinatario_id
    obra_id: tarea.obraId,
    tarea_id: budget.tarea_id,
    titulo: 'Tarea asignada',
    mensaje: `Te asignaron la tarea "${tarea.titulo}" en la obra.`,
    tipo: 'asignacion',
    leida: false,
  }
  ```
- **Problemas detectados:**
  - ❌ Usa `socio_id` en lugar de `destinatario_id`
  - ❌ No incluye `remitente_id`

#### **1.1.2 Servicio Prisma (NO SE USA EN LA APP)**

##### **G. `NotificacionService.crearNotificacion()`**
- **Archivo:** `apps/web/lib/services/notificacion.service.ts`
- **Línea:** 18-120
- **Funcionamiento:**
  - Crea notificación en Prisma (`prisma.notificacion.create`)
  - Intenta crear en Supabase también
  - **PROBLEMA CRÍTICO:** Este servicio NO se está usando en ningún endpoint activo
  - Solo se importa en `evento.service.ts` pero `EventoService` tampoco se usa
- **Datos que inserta en Supabase:**
  ```typescript
  {
    org_id: orgId || null,
    socio_id: socioId || null,  // ⚠️ PROBLEMA
    titulo: data.titulo,
    mensaje: data.mensaje,
    tipo: data.tipo,
    leida: false,
    obra_id: data.obraId || null,
    tarea_id: data.tareaId || null,
    created_at: new Date().toISOString(),
  }
  ```
- **Problemas detectados:**
  - ❌ No usa `remitente_id` ni `destinatario_id`
  - ⚠️ Código muerto - no se invoca desde ningún endpoint activo

---

### 🔹 1.2 TABLAS QUE INTERVIENEN

#### **1.2.1 Tabla `notificaciones` (Supabase) - TABLA PRINCIPAL**

**Estructura actual (inferida del código):**
```sql
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  remitente_id UUID,           -- ✅ Existe y se usa en algunos endpoints
  destinatario_id UUID,         -- ✅ Existe y se usa en GET /api/notificaciones
  socio_id UUID,                -- ⚠️ Existe pero se usa incorrectamente
  obra_id UUID,
  tarea_id UUID,
  titulo TEXT,
  mensaje TEXT,
  tipo TEXT,                    -- 'presupuesto', 'presupuesto_aprobado', 'presupuesto_rechazado', 'asignacion'
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  -- Columnas que NO EXISTEN pero se intentan usar:
  -- user_id_destinatario UUID  ❌ NO EXISTE (usado en /api/socio/presupuestos/bulk)
  -- cliente_id UUID           ❌ NO EXISTE
)
```

**Columnas usadas realmente:**
- ✅ `org_id` - Usado en todos los endpoints GET
- ✅ `destinatario_id` - Usado en GET `/api/notificaciones` y filtros realtime
- ✅ `remitente_id` - Usado en algunos endpoints nuevos (aprobar-socio, rechazar)
- ⚠️ `socio_id` - Usado en algunos endpoints antiguos pero NO se filtra por esto
- ✅ `obra_id`, `tarea_id` - Usados para contexto
- ✅ `titulo`, `mensaje`, `tipo`, `leida` - Usados en frontend
- ✅ `created_at` - Usado para ordenamiento

**Columnas problemáticas:**
- ❌ `socio_id` - Se inserta pero NO se usa para filtrar en GET
- ❌ `user_id_destinatario` - Se intenta usar pero NO EXISTE en la tabla

#### **1.2.2 Tabla `notificacion` (Prisma) - CÓDIGO MUERTO**

**Ubicación:** Base de datos Prisma (probablemente no existe o no se usa)
- **Modelo:** `prisma.notificacion`
- **Estado:** ❌ NO SE USA - El servicio `NotificacionService` no se invoca desde ningún endpoint activo
- **Recomendación:** Eliminar o migrar a Supabase si hay datos

---

### 🔹 1.3 CÓMO LAS OBTIENE EL CLIENTE

#### **1.3.1 Componente principal**

**Archivo:** `apps/web/components/cliente/NotificacionesSection.tsx`

**Endpoint usado:**
- `GET /api/notificaciones`
- **Headers requeridos:**
  - `x-organizacion-id`: orgId del cliente
  - `x-usuario-id`: userId del cliente

**Filtrado:**
```typescript
// Línea 21-25 de /api/notificaciones/route.ts
.eq('org_id', orgId)
.eq('destinatario_id', usuarioId)  // ✅ Filtra por destinatario_id
```

**Realtime - Implementación exacta:**

**Líneas 79-135:** Suscripción realtime completa

**Código real:**
```typescript
useEffect(() => {
  if (!orgId || !usuarioId) return;

  const channel = supabase
    .channel(`notificaciones_${orgId}_${usuarioId}`)  // Nombre del canal único
    .on(
      'postgres_changes',
      {
        event: '*',                                    // Escucha INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'notificaciones',
        filter: `destinatario_id=eq.${usuarioId}`,     // ⚠️ Solo filtra por destinatario_id
      },
      (payload) => {
        console.log('[NotificacionesSection] Realtime event:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // Líneas 97-108: Agregar nueva notificación al inicio
          const nuevaNotif: NotificacionItem = {
            id: payload.new.id,
            titulo: payload.new.titulo || 'Notificación',
            mensaje: payload.new.mensaje || 'Sin detalle',
            tipo: (payload.new.tipo || 'info') as NotificacionItem['tipo'],
            fecha: payload.new.created_at || new Date().toISOString(),
            leida: Boolean(payload.new.leida),
            destinatario: 'Vos',
          };
          setNotificaciones((prev) => [nuevaNotif, ...prev]);  // Agrega al inicio
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          // Líneas 110-119: Actualizar estado leida
          setNotificaciones((prev) =>
            prev.map((notif) =>
              notif.id === payload.new.id
                ? { ...notif, leida: Boolean(payload.new.leida) }
                : notif
            )
          );
        } else if (payload.eventType === 'DELETE') {
          // Línea 121: Eliminar del array local
          setNotificaciones((prev) => prev.filter((notif) => notif.id !== payload.old.id));
        }
      }
    )
    .subscribe();

  channelRef.current = channel;

  return () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };
}, [orgId, usuarioId, supabase]);
```

**Detalles del realtime:**
- ✅ **Canal único:** `notificaciones_${orgId}_${usuarioId}` - Un canal por usuario
- ✅ **Filtro:** `destinatario_id=eq.${usuarioId}` - Solo recibe notificaciones donde es destinatario
- ⚠️ **PROBLEMA:** Notificaciones con `socio_id` pero sin `destinatario_id` NO se reciben en realtime
- ✅ **Eventos:** INSERT (agrega al inicio), UPDATE (actualiza leida), DELETE (elimina)
- ✅ **Cleanup:** Se desuscribe correctamente al desmontar componente

**Renderizado:**
- **Componente:** `ListaNotificaciones` (línea 265)
- **Badge de contador:** Línea 243-246 (muestra `notificacionesNoLeidas`)
- **UI estilo WhatsApp:** Implementado en `ListaNotificaciones.tsx`

**Marcar como leída - Implementación exacta:**

**Líneas 137-173:** Función `marcarComoLeida`

**Código real:**
```typescript
const marcarComoLeida = async (id: string) => {
  if (!verifyAccess('notificaciones', 'STARTER')) {
    return;  // Verificación de plan
  }

  try {
    const response = await fetch(`/api/notificaciones/${id}/leida`, {
      method: 'PATCH',
      headers: {
        'x-organizacion-id': orgId || '',
        'x-usuario-id': usuarioId || '',
      },
    });
    
    const json = await response.json();
    if (json.success && json.data) {
      // Líneas 154-163: Actualizar con lista del servidor
      const items: NotificacionItem[] = (json.data || []).map((item: any) => ({
        id: item.id,
        titulo: item.titulo || 'Notificación',
        mensaje: item.mensaje || item.descripcion || 'Sin detalle',
        tipo: (item.tipo || 'info') as NotificacionItem['tipo'],
        fecha: item.created_at || item.fecha || new Date().toISOString(),
        leida: Boolean(item.leida),
        destinatario: item.destinatario || 'Vos',
      }));
      setNotificaciones(items);  // Reemplaza toda la lista
    } else {
      // Línea 166: Fallback - actualizar localmente
      setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)));
    }
  } catch (error) {
    console.error('[NotificacionesSection] Error marcando notificación como leída:', error);
    // Línea 171: Fallback - actualizar localmente
    setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)));
  }
};
```

**Cálculo de "no leídas":**

**Línea 175:**
```typescript
const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
```

**Renderizado del badge (líneas 243-246):**
```typescript
{notificacionesNoLeidas > 0 && (
  <Badge variant="info" size="sm" className="bg-growsBlue/10 text-growsBlue">
    {notificacionesNoLeidas}
  </Badge>
)}
```

**Endpoint PATCH `/api/notificaciones/[id]/leida`:**
- **Validación (línea 35):** Verifica que `notificacion.destinatario_id === usuarioId`
- **Retorno (línea 64):** Retorna lista completa actualizada de notificaciones del usuario

---

### 🔹 1.4 CÓMO LAS OBTIENE EL SOCIO

#### **1.4.1 Componente principal**

**Archivo:** `apps/web/components/socio/sections/Notificaciones.tsx`

**Endpoint usado:**
- `GET /api/notificaciones`
- **Headers:**
  - `x-organizacion-id`: orgId del socio
  - `x-usuario-id`: socioId (línea 105)
  - `x-socio-id`: socioId (línea 104) - ⚠️ Se envía pero no se usa en el endpoint

**Filtrado:**
- ✅ Filtra por `destinatario_id = socioId` (línea 25 del endpoint)
- ✅ Filtra por `org_id = orgId`

**Realtime:**
- ✅ **SÍ tiene suscripción realtime** (líneas 202-257)
- **Canal:** `notificaciones_${orgId}_${socioId}`
- **Filtro:** `destinatario_id=eq.${socioId}`
- **Eventos:** INSERT, UPDATE, DELETE

**Problemas detectados:**
- ⚠️ El endpoint `/api/notificaciones` NO usa `x-socio-id` header (solo `x-usuario-id`)
- ✅ Funciona correctamente porque `x-usuario-id` contiene el `socioId`

**Tipos de notificaciones:**
- `presupuesto_aprobado` → Normalizado a `'success'` (línea 223)
- Otros → Normalizados a `'info'` (línea 175)

**Cálculo de "no leídas" - Implementación exacta:**

**Líneas 299-312:** Función `totales` (useMemo)

**Código real:**
```typescript
const totales = useMemo(() => {
  const total = notificaciones.length;
  const sinLeer = notificaciones.filter((n) => !n.leida).length;  // Línea 301
  const leidas = total - sinLeer;
  // Incluir mensajes no leídos en el total
  const totalConMensajes = total + mensajesNoLeidos;              // Línea 304
  const sinLeerConMensajes = sinLeer + mensajesNoLeidos;          // Línea 305
  return { 
    total: totalConMensajes, 
    sinLeer: sinLeerConMensajes, 
    leidas,
    mensajesNoLeidos 
  };
}, [notificaciones, mensajesNoLeidos]);
```

**Mensajes no leídos - Implementación (líneas 110-149):**

**Código real:**
```typescript
const fetchMensajesNoLeidos = useCallback(async () => {
  if (!orgId || !socioId || typeof window === 'undefined') {
    setMensajesNoLeidos(0);
    return;
  }

  try {
    const url = new URL('/api/mensajes', window.location.origin);
    url.searchParams.set('socio_id', socioId);  // ⚠️ Query param (legacy)

    const res = await fetch(url.toString(), { 
      headers: { 'x-organizacion-id': orgId },
      cache: 'no-store' 
    });
    
    const json = await res.json();
    if (json.success) {
      const mensajes = (json.data || []) as Array<{ destinatario_id: string; leido: boolean }>;
      
      // Líneas 138-140: Filtrar mensajes no leídos donde el socio es destinatario
      const noLeidos = mensajes.filter(
        (m) => m.destinatario_id === socioId && !m.leido
      );
      setMensajesNoLeidos(noLeidos.length);
    }
  } catch (error) {
    console.error('[Notificaciones] Error al cargar mensajes no leídos:', error);
  }
}, [orgId, socioId]);
```

**Problema detectado:**
- ⚠️ El endpoint GET `/api/mensajes` NO usa el query param `socio_id` (línea 14: solo lo lee pero no lo usa)
- ⚠️ El filtrado real se hace en el cliente (línea 138-140)
- ⚠️ Trae TODOS los mensajes de la org y luego filtra cliente-side

---

### 🔹 1.5 PROBLEMAS ACTUALES DETECTADOS

#### **❌ PROBLEMA 1: Inconsistencia en campos de destinatario**

**Endpoints que usan `socio_id` en lugar de `destinatario_id`:**
1. `/api/obras/[id]/solicitar-presupuesto` (línea 290)
2. `/api/tareas/[id]/asignar` (línea 144)
3. `AsignarSection.tsx` (línea 774)
4. `NotificacionService` (línea 91)

**Impacto:**
- Las notificaciones se crean pero NO se filtran correctamente en GET
- El endpoint GET filtra por `destinatario_id`, no por `socio_id`
- **Resultado:** Notificaciones creadas pero invisibles para el destinatario

#### **❌ PROBLEMA 2: Columna inexistente `user_id_destinatario`**

**Endpoint afectado:**
- `/api/socio/presupuestos/bulk` (línea 231)

**Impacto:**
- La notificación falla al insertar (columna no existe)
- El cliente NO recibe notificación cuando el socio envía presupuesto
- Error silencioso (catch en línea 239)

#### **❌ PROBLEMA 3: Falta de `remitente_id` en notificaciones antiguas**

**Endpoints afectados:**
- `/api/obras/[id]/solicitar-presupuesto`
- `/api/tareas/[id]/asignar`
- `AsignarSection.tsx`

**Impacto:**
- No se puede identificar quién envió la notificación
- Dificulta auditoría y trazabilidad

#### **❌ PROBLEMA 4: Código muerto - NotificacionService**

**Archivo:** `apps/web/lib/services/notificacion.service.ts`

**Estado:**
- ❌ NO se usa en ningún endpoint activo
- Solo se importa en `evento.service.ts` que tampoco se usa
- Crea notificaciones en Prisma (tabla que probablemente no existe)
- Intenta crear en Supabase pero con estructura incorrecta

**Recomendación:**
- Eliminar o refactorizar completamente
- Si se necesita, migrar a usar solo Supabase con estructura correcta

#### **❌ PROBLEMA 5: Falta de `org_id` en algunas notificaciones**

**Endpoints afectados:**
- `NotificacionService` puede crear sin `org_id` si no se encuentra (línea 90: `orgId || null`)

**Impacto:**
- Notificaciones sin `org_id` no se filtran correctamente
- Pueden aparecer en organizaciones incorrectas

---

## 🟦 2. MENSAJES — ANÁLISIS COMPLETO

### 🔹 2.1 ENDPOINTS EXISTENTES

#### **A. `/api/mensajes` (GET y POST)**

**Archivo:** `apps/web/app/api/mensajes/route.ts`

**GET (Líneas 6-69):**
- **Parámetros:**
  - `x-organizacion-id`: orgId (requerido)
  - `x-usuario-id`: userId o socioId (requerido)
  - Query params: `org_id`, `usuario_id`, `socio_id`, `cliente_id` (opcionales, legacy)
- **Filtrado - Código real (líneas 25-50):**

```typescript
// Construir el query de búsqueda
// Según los datos en Supabase:
// - Cuando el cliente envía: remitente_id = usuarioId del cliente
// - Cuando el socio envía al cliente: destinatario_id = org_id (no usuarioId)
// Por lo tanto, necesitamos buscar mensajes donde:
// - remitente_id = usuarioId (mensajes enviados por el usuario)
// - destinatario_id = usuarioId O destinatario_id = orgId (mensajes recibidos por el usuario)

let query = supabaseAny
  .from('mensajes')
  .select('*')
  .eq('org_id', orgId);  // Filtro base por organización

// Construir condiciones OR para buscar mensajes donde el usuario participa
// Si usuarioId y orgId son diferentes, buscar en ambos
if (usuarioId !== orgId) {
  // Buscar: (remitente_id = usuarioId) OR (destinatario_id = usuarioId) OR (destinatario_id = orgId)
  query = query.or(
    `remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId},destinatario_id.eq.${orgId}`
  );
} else {
  // Si son iguales, solo buscar por uno
  query = query.or(`remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`);
}

query = query.order('created_at', { ascending: true });  // Más antiguos primero
```

**Problemas detectados:**
- ❌ **Filtro OR complejo:** Trae TODOS los mensajes donde el usuario participa, no solo de una conversación
- ❌ **No filtra por conversación específica:** El frontend debe filtrar cliente-side
- ⚠️ **Query params legacy:** Lee `socio_id`, `cliente_id` (líneas 14-15) pero NO los usa
- ⚠️ **Comentario línea 16:** Confirma que `obra_id` y `tarea_id` fueron eliminados
- ⚠️ **Comentario línea 52-53:** Indica que el filtrado por obra/tarea debe hacerse en el cliente

**Resultado:**
- La API retorna TODOS los mensajes de la organización donde el usuario participa
- El frontend debe filtrar por conversación específica (cliente-side)
- **Ineficiente:** Transfiere datos innecesarios, especialmente en orgs grandes

**POST (Líneas 72-116):**
- **Campos requeridos:** `org_id`, `remitente_id`, `destinatario_id`, `contenido`
- **Campos opcionales:** `tipo`, `leido`, `remitente_tipo`, `destinatario_tipo`
- **Payload:**
  ```typescript
  {
    org_id: body.org_id,
    remitente_id: body.remitente_id,
    destinatario_id: body.destinatario_id,
    contenido: body.contenido ?? body.mensaje ?? '',
    tipo: body.tipo ?? 'chat',
    leido: body.leido ?? false,
    remitente_tipo: body.remitente_tipo ?? null,
    destinatario_tipo: body.destinatario_tipo ?? null,
  }
  ```
- **Estado:** ✅ Correcto

#### **B. `/api/mensajes/[id]/leido` (PATCH)**

**Archivo:** `apps/web/app/api/mensajes/[id]/leido/route.ts`

**Funcionalidad - Código real (líneas 4-25):**

```typescript
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // ❌ PROBLEMA: NO valida que el mensaje pertenezca al usuario
    // ❌ PROBLEMA: NO verifica remitente_id ni destinatario_id
    const { error } = await supabaseAny
      .from('mensajes')
      .update({ leido: true })
      .eq('id', id);

    if (error) {
      console.error('[PATCH /api/mensajes/[id]/leido] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // ❌ PROBLEMA: NO retorna el mensaje actualizado
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[PATCH /api/mensajes/[id]/leido] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}
```

**Problemas críticos:**
- ❌ **Sin validación de propiedad:** Cualquier usuario puede marcar cualquier mensaje como leído
- ❌ **Sin verificación de destinatario:** No verifica que el usuario sea el destinatario del mensaje
- ❌ **No retorna datos:** Solo retorna `{ success: true, id }`, no el mensaje actualizado
- ⚠️ **Vulnerabilidad de seguridad:** Permite marcar mensajes de otros usuarios como leídos

#### **C. `/api/gaucho-memoria` (GET y POST)**

**Archivo:** `apps/web/app/api/gaucho-memoria/route.ts`

**Propósito:**
- ✅ Exclusivo para chatbot de la landing
- ✅ NO se mezcla con mensajes internos
- **Tabla:** `gaucho_memoria` (separada de `mensajes`)
- **Estado:** ✅ Correcto, aislado

---

### 🔹 2.2 TABLAS QUE SE USAN

#### **2.2.1 Tabla `mensajes` (Supabase) - TABLA PRINCIPAL**

**Estructura (inferida del código):**
```sql
CREATE TABLE mensajes (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  remitente_id UUID NOT NULL,
  destinatario_id UUID NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT DEFAULT 'chat',
  leido BOOLEAN DEFAULT false,
  remitente_tipo TEXT,        -- 'cliente' | 'socio'
  destinatario_tipo TEXT,     -- 'cliente' | 'socio'
  created_at TIMESTAMP,
  -- Columnas ELIMINADAS (según comentarios en código):
  -- obra_id UUID             ❌ ELIMINADO
  -- tarea_id UUID            ❌ ELIMINADO
)
```

**Columnas usadas:**
- ✅ `org_id` - Filtrado principal
- ✅ `remitente_id` - Identifica quién envía
- ✅ `destinatario_id` - Identifica quién recibe
- ✅ `contenido` - Texto del mensaje
- ✅ `remitente_tipo`, `destinatario_tipo` - Distingue cliente vs socio
- ✅ `leido` - Estado de lectura
- ✅ `created_at` - Ordenamiento

**Relaciones:**
- No hay foreign keys explícitas
- Se relaciona con `organizations` vía `org_id`
- Se relaciona con `users` vía `remitente_id`/`destinatario_id`
- Se relaciona con `socios` vía `remitente_id`/`destinatario_id` (cuando es socio)

#### **2.2.2 Tabla `gaucho_memoria` (Supabase) - SOLO LANDING**

**Propósito:**
- Chatbot de la landing page
- **Estado:** ✅ Aislado, no interfiere con mensajes internos

---

### 🔹 2.3 CÓMO LOS ENVÍA EL CLIENTE

#### **2.3.1 Componente principal**

**Archivo:** `apps/web/components/cliente/mensajeria/MensajeriaDirecta.tsx`

**Flujo:**
1. **Selección de socio:** Dropdown con socios de la organización (líneas 35-37)
2. **Fetch de mensajes:** `GET /api/mensajes` con headers `x-organizacion-id` y `x-usuario-id`
3. **Filtrado cliente-side:**
   ```typescript
   // Líneas 77-91
   // Filtra mensajes de la conversación con el socio seleccionado
   const esDelClienteAlSocio = 
     mensaje.remitente_tipo === 'cliente' && 
     mensaje.destinatario_tipo === 'socio' &&
     mensaje.destinatario_id === selectedSocioId;
   
   const esDelSocioAlCliente = 
     mensaje.remitente_tipo === 'socio' && 
     mensaje.remitente_id === selectedSocioId &&
     mensaje.destinatario_tipo === 'cliente';
   ```
4. **Envío:**
   ```typescript
   // Líneas 160-163
   remitente_id: usuarioId,
   remitente_tipo: 'cliente',
   destinatario_id: selectedSocioId,
   destinatario_tipo: 'socio',
   ```

**Headers usados:**
- `x-organizacion-id`: orgId del cliente
- `x-usuario-id`: userId del cliente

**Filtrado cliente-side - Código real (líneas 77-91):**

```typescript
// Filtrar mensajes de la conversación con el socio seleccionado
// La API ya filtra por orgId y usuarioId/orgId, ahora solo necesitamos filtrar por el socio seleccionado
const filtradas = data.filter((mensaje) => {
  // Mensaje del cliente al socio seleccionado
  const esDelClienteAlSocio = 
    mensaje.remitente_tipo === 'cliente' && 
    mensaje.destinatario_tipo === 'socio' &&
    mensaje.destinatario_id === selectedSocioId;
  
  // Mensaje del socio seleccionado al cliente
  const esDelSocioAlCliente = 
    mensaje.remitente_tipo === 'socio' && 
    mensaje.remitente_id === selectedSocioId &&
    mensaje.destinatario_tipo === 'cliente';
  
  return esDelClienteAlSocio || esDelSocioAlCliente;
});

// Ordenar por fecha (más antiguos primero, como un chat normal)
const mensajesOrdenados = filtradas.sort((a, b) => 
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
);
```

**Problemas detectados:**
- ❌ **Filtrado cliente-side:** La API trae TODOS los mensajes de la org, luego filtra en el cliente
- ❌ **No hay realtime:** No hay suscripción a cambios en tabla `mensajes`
- ⚠️ **Ineficiente:** Transfiere datos innecesarios
- ✅ **Ordenamiento correcto:** Ascendente (más antiguos primero)

#### **2.3.2 Modal de comentario de presupuesto**

**Archivo:** `apps/web/components/cliente/asigna/PresupuestoComentarioModal.tsx`

**Flujo:**
- Envía mensaje al socio sobre un presupuesto específico
- **Payload (líneas 106-115):**
  ```typescript
  {
    org_id: currentUser.orgId,
    obra_id: obraId || null,  // ⚠️ Se envía pero la tabla no tiene esta columna
    tarea_id: tareaId,        // ⚠️ Se envía pero la tabla no tiene esta columna
    remitente_id: currentUser.id,
    destinatario_id: socioId,
    contenido: mensajeCompleto,
    tipo: 'presupuesto',
    leido: false,
  }
  ```
- **Problemas:**
  - ⚠️ Intenta enviar `obra_id` y `tarea_id` que fueron eliminados de la tabla
  - El endpoint POST los ignora (línea 98-99: comentario sobre no incluirlos)

---

### 🔹 2.4 CÓMO LOS ENVÍA EL SOCIO

#### **2.4.1 Componente principal**

**Archivo:** `apps/web/components/socio/MensajeriaSocio.tsx`

**Flujo:**
1. **Obtención de orgId y socioId:**
   - Busca en tabla `socios` por email (líneas 39-95)
   - Si no encuentra orgId, lo infiere desde tareas asignadas

2. **Obtención de clienteId:**
   - Busca el `owner_user_id` de la organización (líneas 100-120)
   - Lo usa como `destinatario_id` cuando envía al cliente

3. **Fetch de mensajes:**
   - `GET /api/mensajes` con headers `x-organizacion-id` y `x-usuario-id` (socioId)
   - Filtra cliente-side por conversación con el cliente (líneas 188-203)

4. **Envío:**
   ```typescript
   // Líneas 284-287
   remitente_id: socioId,
   remitente_tipo: 'socio',
   destinatario_id: clienteId,  // owner_user_id de la organización
   destinatario_tipo: 'cliente',
   ```

**Obtención de clienteId - Código real (líneas 104-136):**

```typescript
useEffect(() => {
  const obtenerClienteYObra = async () => {
    if (!orgId || !socioId) return;

    try {
      const supabaseAny = supabase as any;
      
      // Obtener una tarea del socio para derivar obra_id y cliente
      const { data: tareaData } = await supabaseAny
        .from('tareas')
        .select('obra_id, obra:obras(id, org_id)')
        .eq('org_id', orgId)
        .or(`responsable.ilike.%${currentUser?.email || ''}%`)
        .limit(1)
        .maybeSingle();

      if (tareaData?.obra_id) {
        setObraId(tareaData.obra_id);
      }

      // El cliente técnico es el owner de la organización
      // Por ahora, usamos org_id como referencia temporal
      // En producción, debería haber una relación explícita entre socio y cliente
      setClienteId(orgId); // ⚠️ TEMPORAL: usar org_id como referencia del cliente técnico
    } catch (error) {
      console.error('[MensajeriaSocio] Error al obtener cliente_id y obra_id:', error);
    }
  };

  obtenerClienteYObra();
}, [orgId, socioId, currentUser?.email, supabase]);
```

**Problemas detectados:**
- ❌ **Lógica temporal:** Usa `orgId` como `clienteId` (línea 129) - NO es correcto
- ❌ **Comentario línea 125-128:** Indica que es una solución temporal
- ❌ **No hay realtime:** No hay suscripción a cambios en tabla `mensajes`
- ⚠️ **Filtrado cliente-side:** Similar al cliente, trae todos los mensajes y filtra después
- ✅ **Marcado como leído:** Usa IntersectionObserver (líneas 240-280) - funciona correctamente

**Marcado como leído:**
- Usa `IntersectionObserver` para marcar cuando el mensaje es 50% visible
- Endpoint: `PATCH /api/mensajes/[id]/leido`
- ✅ Implementación correcta

---

### 🔹 2.5 PROBLEMAS ACTUALES DETECTADOS

#### **❌ PROBLEMA 1: Filtrado ineficiente de mensajes**

**Impacto:**
- La API trae TODOS los mensajes de la organización
- El filtrado se hace en el cliente
- **Resultado:** Transferencia innecesaria de datos, especialmente en orgs grandes

**Solución recomendada:**
- Agregar parámetros de query al endpoint: `?remitente_id=...&destinatario_id=...`
- Filtrar en el servidor

#### **❌ PROBLEMA 2: Falta de realtime para mensajes**

**Estado actual:**
- ✅ Notificaciones tienen realtime
- ❌ Mensajes NO tienen realtime
- **Impacto:** Los usuarios no ven mensajes nuevos sin refrescar

**Solución recomendada:**
- Agregar suscripción realtime a tabla `mensajes` similar a notificaciones

#### **❌ PROBLEMA 3: Campos eliminados pero aún se intentan enviar**

**Endpoints afectados:**
- `PresupuestoComentarioModal.tsx` intenta enviar `obra_id` y `tarea_id`
- El endpoint POST los ignora pero genera confusión

**Solución:**
- Eliminar `obra_id` y `tarea_id` del payload en el frontend

#### **❌ PROBLEMA 4: Endpoint PATCH /api/mensajes/[id]/leido sin validación**

**Problema:**
- No valida que el mensaje pertenezca al usuario que lo marca como leído
- Cualquier usuario puede marcar cualquier mensaje como leído

**Solución:**
- Agregar validación similar a `/api/notificaciones/[id]/leida`

#### **❌ PROBLEMA 5: Ordenamiento inconsistente**

**Estado:**
- ✅ GET `/api/mensajes` ordena ascendente (correcto para chat)
- ✅ Frontend mantiene orden ascendente
- **Estado:** ✅ Correcto

---

## 🟦 3. RESUMEN EJECUTIVO

### ✅ QUÉ FUNCIONA

1. **Notificaciones:**
   - ✅ Endpoint GET `/api/notificaciones` funciona correctamente
   - ✅ Realtime subscriptions funcionan (cliente y socio)
   - ✅ Marcado como leído funciona correctamente
   - ✅ Endpoints nuevos (`aprobar-socio`, `rechazar`) usan estructura correcta

2. **Mensajes:**
   - ✅ Endpoint GET y POST `/api/mensajes` funcionan
   - ✅ Separación correcta con `gaucho_memoria` (landing)
   - ✅ Marcado como leído con IntersectionObserver funciona
   - ✅ Ordenamiento correcto (ascendente)

### ❌ QUÉ ESTÁ ROTO

1. **Notificaciones:**
   - ❌ `/api/obras/[id]/solicitar-presupuesto` usa `socio_id` en lugar de `destinatario_id`
   - ❌ `/api/tareas/[id]/asignar` usa `socio_id` en lugar de `destinatario_id`
   - ❌ `AsignarSection.tsx` usa `socio_id` en lugar de `destinatario_id`
   - ❌ `/api/socio/presupuestos/bulk` usa `user_id_destinatario` (columna inexistente)
   - ❌ Notificaciones creadas con `socio_id` NO se muestran porque GET filtra por `destinatario_id`

2. **Mensajes:**
   - ❌ Falta realtime subscription
   - ❌ Filtrado ineficiente (trae todos los mensajes de la org)
   - ❌ Endpoint PATCH `/api/mensajes/[id]/leido` sin validación de propiedad

### ⚠️ QUÉ ESTÁ DUPLICADO

1. **Notificaciones:**
   - ⚠️ `NotificacionService` (Prisma) - Código muerto, no se usa
   - ⚠️ `EventoService` - No se usa, importa `NotificacionService`

2. **Mensajes:**
   - ✅ No hay duplicación (solo `mensajes` y `gaucho_memoria` que están separados)

### 🗑️ QUÉ TABLA DEBE ELIMINARSE

1. **Tabla `notificacion` (Prisma):**
   - Si existe, probablemente está vacía o no se usa
   - El servicio `NotificacionService` no se invoca
   - **Recomendación:** Verificar si tiene datos, migrar a Supabase si es necesario, luego eliminar

### 🔄 QUÉ FLUJO DEBE UNIFICARSE

1. **Creación de notificaciones:**
   - **Problema:** 3 formas diferentes de crear notificaciones:
     - Forma antigua: `socio_id` (no funciona)
     - Forma nueva: `remitente_id` + `destinatario_id` (correcta)
     - Forma rota: `user_id_destinatario` (columna inexistente)
   - **Solución:** Unificar TODOS los endpoints para usar `remitente_id` + `destinatario_id`

2. **Filtrado de mensajes:**
   - **Problema:** Filtrado cliente-side
   - **Solución:** Mover filtrado al servidor con query params

### 🔧 QUÉ CAMBIOS CLAVE RECOMIENDA

#### **PRIORIDAD ALTA (Crítico - Rompe funcionalidad):**

1. **Corregir creación de notificaciones:**
   - Cambiar `socio_id` → `destinatario_id` en:
     - `/api/obras/[id]/solicitar-presupuesto`
     - `/api/tareas/[id]/asignar`
     - `AsignarSection.tsx`
   - Agregar `remitente_id` en todos los endpoints
   - Corregir `/api/socio/presupuestos/bulk` para usar `destinatario_id` en lugar de `user_id_destinatario`

2. **Eliminar código muerto:**
   - Eliminar o refactorizar `NotificacionService` si no se usa
   - Eliminar `EventoService` si no se usa

#### **PRIORIDAD MEDIA (Mejora UX):**

3. **Agregar realtime a mensajes:**
   - Implementar suscripción realtime en `MensajeriaDirecta.tsx` y `MensajeriaSocio.tsx`
   - Similar a como funciona en notificaciones

4. **Mejorar filtrado de mensajes:**
   - Agregar query params al endpoint GET `/api/mensajes`
   - Filtrar en servidor en lugar de cliente

5. **Validar propiedad en PATCH mensajes:**
   - Agregar validación en `/api/mensajes/[id]/leido`
   - Similar a `/api/notificaciones/[id]/leida`

#### **PRIORIDAD BAJA (Limpieza):**

6. **Eliminar campos obsoletos:**
   - Remover `obra_id` y `tarea_id` del payload en `PresupuestoComentarioModal.tsx`

7. **Documentar estructura:**
   - Crear migración SQL que documente la estructura real de `notificaciones`
   - Agregar comentarios en código sobre qué columnas usar

### 🎯 QUÉ DEBO CORREGIR PRIMERO

**ORDEN DE PRIORIDAD:**

1. **🔴 CRÍTICO - Corregir notificaciones que no se muestran:**
   - Cambiar `socio_id` → `destinatario_id` en endpoints de creación
   - Agregar `remitente_id` donde falte
   - Corregir `/api/socio/presupuestos/bulk` (eliminar `user_id_destinatario`)

2. **🟡 IMPORTANTE - Agregar realtime a mensajes:**
   - Mejora significativa de UX
   - Los usuarios verán mensajes nuevos sin refrescar

3. **🟢 MEJORA - Optimizar filtrado de mensajes:**
   - Reduce carga de red
   - Mejora performance en organizaciones grandes

4. **🔵 LIMPIEZA - Eliminar código muerto:**
   - Reduce confusión
   - Facilita mantenimiento

---

## 📊 ESTADÍSTICAS DEL SISTEMA

### Notificaciones
- **Endpoints que crean:** 6 activos + 1 servicio (muerto)
- **Endpoints que leen:** 1 (GET `/api/notificaciones`)
- **Endpoints que marcan leído:** 1 (PATCH `/api/notificaciones/[id]/leida`)
- **Componentes frontend:** 2 (cliente + socio)
- **Realtime subscriptions:** 2 (ambas funcionan)

### Mensajes
- **Endpoints que crean:** 1 (POST `/api/mensajes`)
- **Endpoints que leen:** 1 (GET `/api/mensajes`)
- **Endpoints que marcan leído:** 1 (PATCH `/api/mensajes/[id]/leido`)
- **Componentes frontend:** 2 (cliente + socio)
- **Realtime subscriptions:** 0 (NO HAY)

---

## 🔍 CONCLUSIÓN FINAL

### Estado actual del sistema

**Notificaciones:**
- ✅ **Base sólida:** Endpoint GET funciona, realtime funciona, marcado como leído funciona
- ❌ **Problemas críticos:** 4 endpoints crean notificaciones que NO se muestran (usan `socio_id` en lugar de `destinatario_id`)
- ❌ **Columna inexistente:** 1 endpoint intenta usar `user_id_destinatario` que no existe
- ⚠️ **Código muerto:** `NotificacionService` (Prisma) no se usa

**Mensajes:**
- ✅ **Funcionalidad básica:** GET y POST funcionan correctamente
- ❌ **Sin realtime:** Los usuarios no ven mensajes nuevos sin refrescar
- ❌ **Filtrado ineficiente:** Trae todos los mensajes de la org y filtra cliente-side
- ❌ **Vulnerabilidad:** PATCH `/api/mensajes/[id]/leido` no valida propiedad

### Impacto en usuarios

**Notificaciones perdidas:**
- Cliente solicita presupuesto → Socio NO recibe notificación
- Cliente asigna tarea → Socio NO recibe notificación  
- Socio envía presupuesto → Cliente NO recibe notificación (error silencioso)

**Mensajes:**
- Usuarios deben refrescar manualmente para ver mensajes nuevos
- Performance degradada en organizaciones grandes (trae todos los mensajes)

### Acción inmediata requerida

**PRIORIDAD 1 (Crítico):**
1. Corregir endpoints que usan `socio_id` → cambiar a `destinatario_id`
2. Agregar `remitente_id` en todos los endpoints de creación
3. Corregir `/api/socio/presupuestos/bulk` (eliminar `user_id_destinatario`, usar `destinatario_id`)

**PRIORIDAD 2 (Importante):**
4. Agregar realtime a mensajes
5. Validar propiedad en PATCH `/api/mensajes/[id]/leido`
6. Optimizar filtrado de mensajes (servidor-side)

**PRIORIDAD 3 (Limpieza):**
7. Eliminar código muerto (`NotificacionService`, `EventoService`)
8. Remover campos obsoletos del frontend (`obra_id`, `tarea_id` en mensajes)

