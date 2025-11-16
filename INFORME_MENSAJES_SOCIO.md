# 📋 INFORME TÉCNICO: MÓDULO DE MENSAJES - PANEL DEL SOCIO

**Fecha:** 2025-01-XX  
**Versión:** 1.0  
**Estado:** Análisis completo del sistema actual

---

## 1. ARCHIVOS Y COMPONENTES IDENTIFICADOS

### 1.1 Pantalla de Mensajes del Socio
**❌ NO EXISTE**
- No hay una página dedicada para que el socio vea mensajes
- No existe `apps/web/app/socio/mensajes/page.tsx` o similar
- No existe `apps/web/app/socio/chat/page.tsx`

### 1.2 Componentes Relacionados

#### ✅ Componentes Existentes (pero NO para socio):
1. **`apps/web/components/cliente/ChatSection.tsx`**
   - Componente de chat con GrowsBot (n8n webhook)
   - **NO es para mensajes entre socio y cliente técnico**
   - Solo para conversación con bot IA
   - Usado en: `/cliente/dashboard?section=chat`

2. **`apps/web/components/cliente/mensajeria/MensajeriaDirecta.tsx`**
   - Componente de mensajería directa entre cliente técnico y socio
   - **Diseñado para el CLIENTE TÉCNICO, NO para el socio**
   - Usado en: `NotificacionesSection.tsx` del cliente
   - Campos esperados:
     ```typescript
     type Mensaje = {
       id: string;
       contenido: string;
       remitente_tipo: 'cliente' | 'socio';
       remitente_id: string;
       destinatario_tipo: 'cliente' | 'socio';
       destinatario_id: string;
       obra_id: string | null;
       tarea_id: string | null;
       created_at: string;
       leido: boolean;
     }
     ```

#### ❌ Componentes Faltantes:
- No existe `apps/web/components/socio/MensajeriaSocio.tsx` (mencionado en `gaucho.contexto.json` pero no existe)
- No existe componente de chat/mensajes específico para el socio

### 1.3 Hooks
**❌ NO EXISTEN**
- No hay `useMessages` hook
- No hay `useChat` hook
- No hay `useMensajes` hook
- El componente `MensajeriaDirecta` usa `useCallback` y `useEffect` directamente

### 1.4 Endpoints API

#### ✅ Endpoints Existentes:

1. **`GET /api/mensajes`** (`apps/web/app/api/mensajes/route.ts`)
   - **Query params:** `?obra_id=xxx&tarea_id=xxx`
   - **Headers requeridos:** `x-organizacion-id`
   - **Filtros aplicados:**
     - `org_id = x-organizacion-id` (obligatorio)
     - `obra_id = ?` (opcional)
     - `tarea_id = ?` (opcional)
   - **❌ PROBLEMA:** NO filtra por `remitente_id` ni `destinatario_id`
   - **Retorna:** Todos los mensajes de la organización que cumplan los filtros
   - **Orden:** `created_at ASC`

2. **`POST /api/mensajes`** (`apps/web/app/api/mensajes/route.ts`)
   - **Body esperado:**
     ```typescript
     {
       org_id: string;
       obra_id?: string | null;
       remitente_id: string;
       remitente_tipo: 'cliente' | 'socio';
       destinatario_id: string;
       destinatario_tipo: 'cliente' | 'socio';
       contenido: string;
       // tarea_id NO está en el schema pero podría estar en la tabla
     }
     ```
   - **Headers requeridos:** `x-organizacion-id`
   - **Retorna:** `{ success: true, data: [mensaje] }`

3. **`PATCH /api/mensajes/[id]/leido`** (`apps/web/app/api/mensajes/[id]/leido/route.ts`)
   - Marca un mensaje como leído
   - **Body:** Ninguno
   - **Retorna:** `{ success: true, id }`

#### ❌ Endpoints Faltantes:
- No existe `GET /api/mensajes/socio/[id]` para obtener mensajes de un socio específico
- No existe `GET /api/mensajes/conversacion` para obtener conversación entre dos usuarios
- No existe endpoint de realtime/subscription

### 1.5 Tipos y Modelos de Datos

#### ✅ Tipos Definidos:
```typescript
// En MensajeriaDirecta.tsx
type Mensaje = {
  id: string;
  contenido: string;
  remitente_tipo: 'cliente' | 'socio';
  remitente_id: string;
  destinatario_tipo: 'cliente' | 'socio';
  destinatario_id: string;
  obra_id: string | null;
  tarea_id: string | null;
  created_at: string;
  leido: boolean;
}
```

#### ❌ Tipos Faltantes:
- No hay tipos en `apps/web/lib/types/` para mensajes
- No hay schema Zod para validación de mensajes
- No hay tipos en `supabase.gen.ts` para la tabla `mensajes` (no está generada)

### 1.6 Referencias a Mensajes/Chat

#### En el Panel del Socio:
**`apps/web/components/socio/sections/TareasEnCurso.tsx` (líneas 1243-1260)**
```typescript
<button 
  onClick={() => {
    if (currentUser?.role === 'CLIENTE_TECNICO' || currentUser?.role === 'ADMIN') {
      router.push('/cliente/dashboard?section=chat');
    } else {
      alert('Chat: Esta funcionalidad está disponible para clientes técnicos. Si necesitás contactar con el equipo, hablá con tu líder.');
    }
  }}
>
  <MessageCircle />
  <span>Chat</span>
</button>
```

**❌ PROBLEMA CRÍTICO:**
- El botón de chat del socio **NO funciona para socios**
- Solo redirige si el usuario es `CLIENTE_TECNICO` o `ADMIN`
- Si el usuario es socio, muestra un `alert` y no hace nada

---

## 2. FUNCIONAMIENTO ACTUAL

### 2.1 Cómo Carga los Mensajes

#### En `MensajeriaDirecta.tsx` (solo para cliente técnico):
```typescript
const fetchMensajes = useCallback(async () => {
  // 1. Llama a GET /api/mensajes?obra_id=xxx
  const res = await fetch('/api/mensajes', { headers });
  
  // 2. Obtiene TODOS los mensajes de la organización
  const data = json.data;
  
  // 3. FILTRA MANUALMENTE en el frontend:
  const filtradas = data.filter((mensaje) => {
    const emisor = mensaje.remitente_id;
    const receptor = mensaje.destinatario_id;
    return (
      (emisor === usuarioId && receptor === selectedSocioId) ||
      (emisor === selectedSocioId && receptor === usuarioId)
    );
  });
  
  setMensajes(filtradas);
}, [headers, obraId, orgId, selectedSocioId, usuarioId]);
```

**❌ PROBLEMAS:**
1. El filtrado se hace en el frontend, no en el backend
2. Trae TODOS los mensajes de la organización y luego filtra
3. No hay paginación
4. No hay límite de resultados

### 2.2 Filtros Aplicados

#### Backend (`GET /api/mensajes`):
- ✅ `org_id` (obligatorio)
- ✅ `obra_id` (opcional)
- ✅ `tarea_id` (opcional)
- ❌ `remitente_id` (NO existe)
- ❌ `destinatario_id` (NO existe)
- ❌ `remitente_tipo` (NO existe)
- ❌ `destinatario_tipo` (NO existe)

#### Frontend (`MensajeriaDirecta.tsx`):
- Filtra manualmente por `remitente_id` y `destinatario_id`
- Compara con `usuarioId` (cliente técnico) y `selectedSocioId`

### 2.3 Campos Esperados de Supabase

#### Tabla `mensajes` (inferida del código):
```sql
CREATE TABLE mensajes (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  obra_id UUID,
  tarea_id UUID,
  remitente_id UUID NOT NULL,
  remitente_tipo TEXT NOT NULL, -- 'cliente' | 'socio'
  destinatario_id UUID NOT NULL,
  destinatario_tipo TEXT NOT NULL, -- 'cliente' | 'socio'
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**❌ NO CONFIRMADO:** No hay migración SQL visible en el código

### 2.4 Actualización del Estado Interno

#### En `MensajeriaDirecta.tsx`:
- Usa `useState<Mensaje[]>` para almacenar mensajes
- `useEffect` llama a `fetchMensajes()` cuando cambian dependencias
- **NO hay realtime**, solo polling manual al cambiar `selectedSocioId` o `obraId`

### 2.5 Realtime o Polling

**❌ NO HAY REALTIME**
- No usa Supabase Realtime subscriptions
- No hay polling automático con `setInterval`
- Solo carga mensajes cuando:
  - Se monta el componente
  - Cambia `selectedSocioId`
  - Cambia `obraId`
  - Se envía un nuevo mensaje (llama a `fetchMensajes()` después de POST)

### 2.6 Lógica para Enviar Mensajes

#### ✅ Implementada (solo para cliente técnico):
```typescript
const handleEnviar = async () => {
  const res = await fetch('/api/mensajes', {
    method: 'POST',
    body: JSON.stringify({
      org_id: orgId,
      obra_id: obraId,
      remitente_id: usuarioId, // ID del cliente técnico
      remitente_tipo: 'cliente',
      destinatario_id: selectedSocioId, // ID del socio
      destinatario_tipo: 'socio',
      contenido: nuevoMensaje.trim(),
    }),
  });
  
  if (json.success) {
    setNuevoMensaje('');
    await fetchMensajes(); // Recarga mensajes
  }
};
```

**❌ PROBLEMA:** El socio NO puede enviar mensajes porque no tiene interfaz

### 2.7 Lógica para Recibir Mensajes

**❌ NO IMPLEMENTADA PARA EL SOCIO**
- El socio no tiene componente que cargue mensajes
- El socio no tiene forma de ver mensajes recibidos
- El socio no puede marcar mensajes como leídos

### 2.8 Partes Implementadas vs Vacías

#### ✅ Implementado:
- [x] Endpoint `GET /api/mensajes` (básico, sin filtros de usuario)
- [x] Endpoint `POST /api/mensajes` (crear mensaje)
- [x] Endpoint `PATCH /api/mensajes/[id]/leido` (marcar como leído)
- [x] Componente `MensajeriaDirecta` para cliente técnico
- [x] Botón de chat en `TareasEnCurso.tsx` (pero no funciona para socio)

#### ❌ NO Implementado:
- [ ] Página de mensajes para el socio
- [ ] Componente de chat/mensajes para el socio
- [ ] Filtros en backend por `remitente_id`/`destinatario_id`
- [ ] Realtime subscriptions
- [ ] Polling automático
- [ ] Notificaciones de nuevos mensajes
- [ ] Indicador de mensajes no leídos
- [ ] Lista de conversaciones para el socio
- [ ] Envío de mensajes desde el socio

---

## 3. RUTAS Y NAVEGACIÓN

### 3.1 Rutas del Socio

#### Botón "Chat" en `TareasEnCurso.tsx`:
```typescript
onClick={() => {
  if (currentUser?.role === 'CLIENTE_TECNICO' || currentUser?.role === 'ADMIN') {
    router.push('/cliente/dashboard?section=chat'); // ❌ Redirige al panel del cliente
  } else {
    alert('Chat: Esta funcionalidad está disponible para clientes técnicos...');
    // ❌ No hace nada más
  }
}}
```

**❌ PROBLEMA:** El socio no tiene ruta propia para mensajes

### 3.2 Props Enviadas

#### `MensajeriaDirecta` (solo usado por cliente técnico):
```typescript
<MensajeriaDirecta 
  obraId={obraId}  // Opcional
  socioId={socioId}  // Opcional
/>
```

**Props esperadas:**
- `obraId?: string | null` - Para filtrar mensajes por obra
- `socioId?: string | null` - Para preseleccionar un socio

### 3.3 UI Conectada o Mock

#### ✅ UI Conectada (solo para cliente técnico):
- `MensajeriaDirecta` está conectado a Supabase
- Usa endpoints reales `/api/mensajes`
- Muestra mensajes reales de la base de datos

#### ❌ UI NO Conectada (para el socio):
- El botón de chat no hace nada útil para el socio
- No hay UI para que el socio vea mensajes
- No hay UI para que el socio envíe mensajes

---

## 4. PROBLEMAS IDENTIFICADOS

### 4.1 Por Qué el Socio No Ve Mensajes del Cliente Técnico

**RAZONES:**

1. **❌ No hay componente de UI para el socio**
   - No existe `MensajeriaSocio.tsx` o similar
   - El botón de chat no funciona para socios

2. **❌ El endpoint no filtra correctamente**
   - `GET /api/mensajes` no acepta `remitente_id` ni `destinatario_id` como query params
   - Trae TODOS los mensajes de la organización
   - El filtrado se hace en el frontend (solo en `MensajeriaDirecta`)

3. **❌ El socio no tiene forma de identificar su ID**
   - El socio necesita saber su `socio_id` para filtrar mensajes
   - No hay endpoint que devuelva mensajes para un socio específico

4. **❌ No hay lógica de autenticación para el socio**
   - El endpoint no valida si el usuario es socio
   - No hay forma de obtener el `socio_id` desde el `currentUser`

### 4.2 Endpoints Faltantes

1. **`GET /api/mensajes/socio/[socioId]`**
   - Obtener todos los mensajes donde el socio es remitente o destinatario
   - Filtrar por `remitente_id = socioId OR destinatario_id = socioId`

2. **`GET /api/mensajes/conversacion`**
   - Obtener conversación entre dos usuarios
   - Query params: `?remitente_id=xxx&destinatario_id=xxx`

3. **`GET /api/mensajes/no-leidos`**
   - Obtener contador de mensajes no leídos para un socio

4. **`GET /api/mensajes/conversaciones`**
   - Listar todas las conversaciones de un socio (último mensaje de cada conversación)

### 4.3 Filtros Incorrectos

#### Backend:
- ❌ No filtra por `remitente_id` ni `destinatario_id`
- ❌ No valida que el usuario tenga permiso para ver esos mensajes
- ❌ No filtra por `remitente_tipo` ni `destinatario_tipo`

#### Frontend (MensajeriaDirecta):
- ✅ Filtra correctamente, pero en el cliente
- ❌ El socio no tiene este componente

### 4.4 Variables en Undefined

#### En el contexto del socio:
- `currentUser.socioId` - **NO EXISTE** (solo `currentUser.id` y `currentUser.email`)
- `selectedSocioId` - **NO EXISTE** (solo en `MensajeriaDirecta` del cliente)
- `usuarioId` - Podría ser `currentUser.id`, pero no está claro si es el `socio_id` o el `auth.users.id`

### 4.5 Cosas que Rompen el Flujo

1. **Botón de chat no funcional para socio**
   - Muestra alert y no hace nada
   - No redirige a ninguna página

2. **Falta de identificación del socio**
   - No hay forma de obtener el `socio_id` desde `currentUser`
   - Necesitaría hacer un query a `socios` por `email`

3. **Endpoint no filtra por usuario**
   - Trae todos los mensajes de la organización
   - Ineficiente y potencial problema de seguridad

4. **No hay realtime**
   - El socio no recibe notificaciones de nuevos mensajes
   - Tiene que recargar manualmente

### 4.6 Código que Nunca se Ejecuta

1. **`MensajeriaDirecta` en el contexto del socio**
   - Este componente nunca se renderiza para el socio
   - Solo se usa en `NotificacionesSection` del cliente técnico

2. **Lógica de filtrado en `MensajeriaDirecta`**
   - Solo funciona si el usuario es cliente técnico
   - El socio no tiene acceso a este componente

3. **Botón de chat en `TareasEnCurso.tsx`**
   - Para socios, solo muestra un alert
   - No ejecuta ninguna lógica útil

---

## 5. DIAGRAMA DEL FLUJO ACTUAL

### 5.1 Flujo del Cliente Técnico (FUNCIONA)

```
┌─────────────────┐
│ Cliente Técnico │
│  (Dashboard)    │
└────────┬────────┘
         │
         │ Click en "Mensajería"
         ▼
┌─────────────────────────┐
│ NotificacionesSection   │
│  (renderiza)            │
└────────┬────────────────┘
         │
         │ Renderiza
         ▼
┌─────────────────────────┐
│ MensajeriaDirecta       │
│  - useState(mensajes)   │
│  - useEffect            │
└────────┬────────────────┘
         │
         │ fetchMensajes()
         ▼
┌─────────────────────────┐
│ GET /api/mensajes       │
│  ?obra_id=xxx           │
│  Headers:               │
│    x-organizacion-id    │
└────────┬────────────────┘
         │
         │ Query Supabase
         ▼
┌─────────────────────────┐
│ SELECT * FROM mensajes  │
│  WHERE org_id = ?       │
│    AND obra_id = ?      │
└────────┬────────────────┘
         │
         │ Retorna TODOS los mensajes
         ▼
┌─────────────────────────┐
│ MensajeriaDirecta       │
│  (filtra manualmente)   │
│  - remitente_id = ?     │
│  - destinatario_id = ?  │
└────────┬────────────────┘
         │
         │ setMensajes(filtradas)
         ▼
┌─────────────────────────┐
│ UI muestra mensajes     │
└─────────────────────────┘
```

### 5.2 Flujo del Socio (NO FUNCIONA)

```
┌─────────────────┐
│ Socio           │
│  (TareasEnCurso)│
└────────┬────────┘
         │
         │ Click en "Chat"
         ▼
┌─────────────────────────┐
│ if (role === 'SOCIO')   │
│   alert('...')          │
│   // NO HACE NADA MÁS  │
└─────────────────────────┘
         │
         │ ❌ FIN DEL FLUJO
         ▼
    [NO HAY MÁS PASOS]
```

---

## 6. CAMBIOS MÍNIMOS NECESARIOS

### 6.1 Para que el Socio Vea Mensajes Reales

#### A) Crear Página de Mensajes para el Socio
**Archivo:** `apps/web/app/socio/mensajes/page.tsx`
```typescript
'use client';

import { MensajeriaSocio } from '@/components/socio/MensajeriaSocio';

export default function MensajesPage() {
  return <MensajeriaSocio />;
}
```

#### B) Crear Componente `MensajeriaSocio`
**Archivo:** `apps/web/components/socio/MensajeriaSocio.tsx`
- Similar a `MensajeriaDirecta` pero adaptado para el socio
- Obtener `socio_id` desde `currentUser.email` → query a `socios`
- Filtrar mensajes donde `remitente_id = socio_id OR destinatario_id = socio_id`

#### C) Actualizar Botón de Chat en `TareasEnCurso.tsx`
```typescript
<button 
  onClick={() => {
    router.push('/socio/mensajes'); // ✅ Nueva ruta
  }}
>
  <MessageCircle />
  <span>Chat</span>
</button>
```

### 6.2 Para que el Socio Pueda Responder

#### A) Agregar Lógica de Envío en `MensajeriaSocio`
```typescript
const handleEnviar = async () => {
  const res = await fetch('/api/mensajes', {
    method: 'POST',
    body: JSON.stringify({
      org_id: orgId,
      obra_id: obraId,
      remitente_id: socioId, // ✅ ID del socio
      remitente_tipo: 'socio', // ✅ Tipo correcto
      destinatario_id: clienteId, // ID del cliente técnico
      destinatario_tipo: 'cliente',
      contenido: nuevoMensaje.trim(),
    }),
  });
};
```

#### B) Obtener `socio_id` desde `currentUser`
```typescript
useEffect(() => {
  const obtenerSocioId = async () => {
    if (!currentUser?.email) return;
    
    const { data } = await supabase
      .from('socios')
      .select('id')
      .eq('email', currentUser.email)
      .maybeSingle();
    
    if (data) setSocioId(data.id);
  };
  
  obtenerSocioId();
}, [currentUser]);
```

### 6.3 Para que Aparezcan Mensajes del Cliente Técnico

#### A) Mejorar Endpoint `GET /api/mensajes`
**Archivo:** `apps/web/app/api/mensajes/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const orgId = request.headers.get('x-organizacion-id');
  const socioId = request.nextUrl.searchParams.get('socio_id');
  const clienteId = request.nextUrl.searchParams.get('cliente_id');
  const obraId = request.nextUrl.searchParams.get('obra_id');
  
  let query = supabase.from('mensajes').select('*').eq('org_id', orgId);
  
  // ✅ Filtrar por socio o cliente
  if (socioId) {
    query = query.or(`remitente_id.eq.${socioId},destinatario_id.eq.${socioId}`);
  }
  if (clienteId) {
    query = query.or(`remitente_id.eq.${clienteId},destinatario_id.eq.${clienteId}`);
  }
  if (obraId) {
    query = query.eq('obra_id', obraId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: true });
  // ...
}
```

#### B) Usar el Endpoint Mejorado en `MensajeriaSocio`
```typescript
const fetchMensajes = async () => {
  const url = new URL('/api/mensajes', window.location.origin);
  url.searchParams.set('socio_id', socioId); // ✅ Filtrar en backend
  
  const res = await fetch(url.toString(), { headers });
  // ...
};
```

### 6.4 Para que el Chat Esté Conectado Correctamente

#### A) Agregar Realtime (Opcional pero Recomendado)
```typescript
useEffect(() => {
  if (!socioId) return;
  
  const channel = supabase
    .channel('mensajes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'mensajes',
      filter: `destinatario_id=eq.${socioId}`,
    }, (payload) => {
      setMensajes(prev => [...prev, payload.new as Mensaje]);
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [socioId]);
```

#### B) Agregar Indicador de No Leídos
```typescript
const [noLeidos, setNoLeidos] = useState(0);

useEffect(() => {
  const contarNoLeidos = async () => {
    const { count } = await supabase
      .from('mensajes')
      .select('*', { count: 'exact', head: true })
      .eq('destinatario_id', socioId)
      .eq('leido', false);
    
    setNoLeidos(count || 0);
  };
  
  contarNoLeidos();
}, [socioId, mensajes]);
```

#### C) Marcar como Leído al Abrir
```typescript
useEffect(() => {
  const marcarLeidos = async () => {
    const noLeidos = mensajes.filter(m => !m.leido && m.destinatario_id === socioId);
    
    for (const mensaje of noLeidos) {
      await fetch(`/api/mensajes/${mensaje.id}/leido`, { method: 'PATCH' });
    }
  };
  
  marcarLeidos();
}, [mensajes, socioId]);
```

---

## 7. RESUMEN EJECUTIVO

### Estado Actual:
- ❌ **El socio NO puede ver mensajes**
- ❌ **El socio NO puede enviar mensajes**
- ❌ **No hay UI para mensajes en el panel del socio**
- ✅ **El cliente técnico SÍ puede ver y enviar mensajes**
- ✅ **Los endpoints básicos existen pero no están optimizados**

### Cambios Críticos Necesarios:
1. Crear página `/socio/mensajes`
2. Crear componente `MensajeriaSocio`
3. Mejorar endpoint `GET /api/mensajes` para filtrar por usuario
4. Actualizar botón de chat en `TareasEnCurso.tsx`
5. Obtener `socio_id` desde `currentUser.email`

### Cambios Opcionales (Mejoras):
1. Agregar realtime subscriptions
2. Agregar indicador de no leídos
3. Agregar lista de conversaciones
4. Agregar paginación
5. Agregar búsqueda de mensajes

---

**FIN DEL INFORME**


