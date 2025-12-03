# 📊 ANÁLISIS COMPLETO: INTEGRACIÓN DE BILLETERA EN GROWS

## BLOQUE 1 — Secciones donde integrar la Billetera (SOCIO y CLIENTE)

### 🔵 Secciones del SOCIO

#### 1. **app/socio/presupuestos/page.tsx**
- **Path completo**: `apps/web/app/socio/presupuestos/page.tsx`
- **Rol**: socio
- **Información que muestra**:
  - Lista de presupuestos por obra
  - Totales acumulados (totalDias, totalMonto) por etapa
  - Estados de presupuestos (PENDIENTE, ENVIADO, APROBADO)
  - Resumen por obra con contadores
- **Consume datos de Supabase**: ✅ Sí
  - Tabla: `tareas_presupuestos`, `tareas`, `obras`
  - Endpoint: `/api/socio/presupuestos`
- **Buen lugar para agregar**:
  - ✅ Botón "Billetera" en el header o menú lateral
  - ✅ Bloque "Saldo actual" en el resumen acumulado
  - ✅ Indicador de comisión aplicada al presupuesto

#### 2. **app/socio/panel/page.tsx**
- **Path completo**: `apps/web/app/socio/panel/page.tsx`
- **Rol**: socio
- **Información que muestra**:
  - Panel principal con secciones (tareas, obras, cuadrilla, notificaciones, cuenta)
  - Usuario con rating y level
- **Consume datos de Supabase**: ⚠️ Indirecto (via componentes hijos)
- **Buen lugar para agregar**:
  - ✅ Widget "Saldo disponible" en el dashboard
  - ✅ Acceso rápido a "Billetera" desde el menú principal

#### 3. **components/socio/sections/AhoraSection.tsx**
- **Path completo**: `apps/web/components/socio/sections/AhoraSection.tsx`
- **Rol**: socio
- **Información que muestra**:
  - Tareas en ejecución del día
  - Jornadas activas (jornadas_socio)
  - Tareas completadas hoy
  - Avance diario
- **Consume datos de Supabase**: ✅ Sí
  - Tablas: `tareas`, `tareas_subtareas`, `jornadas_socio`, `eventos`
- **Buen lugar para agregar**:
  - ⚠️ Opcional: Banner pequeño con "Ganancias del día"
  - ⚠️ Menos prioritario, es una vista de ejecución

#### 4. **components/socio/PanelViewer.tsx**
- **Path completo**: `apps/web/components/socio/PanelViewer.tsx`
- **Rol**: socio
- **Información que muestra**:
  - Navegador de secciones del panel
  - Usuario con datos básicos
- **Consume datos de Supabase**: ⚠️ Indirecto
- **Buen lugar para agregar**:
  - ✅ Nueva sección "Billetera" en el panel
  - ✅ Acceso desde el menú principal

#### 5. **app/socio/cuenta/page.tsx**
- **Path completo**: `apps/web/app/socio/cuenta/page.tsx`
- **Rol**: socio
- **Información que muestra**: Información de cuenta del usuario
- **Consume datos de Supabase**: ✅ Probablemente
- **Buen lugar para agregar**:
  - ✅ Sección completa de "Billetera" dentro de cuenta
  - ✅ Historial de movimientos

### 🔴 Secciones del CLIENTE

#### 1. **app/cliente/presupuesto/page.tsx**
- **Path completo**: `apps/web/app/cliente/presupuesto/page.tsx`
- **Rol**: cliente
- **Información que muestra**:
  - Solicitudes de presupuesto a cuadrillas
  - Tareas sin presupuesto
  - Estados de solicitudes (pedido, aprobado, rechazado)
  - Contadores de tareas y solicitudes
- **Consume datos de Supabase**: ✅ Sí
  - Tablas: `tareas_presupuestos`, `tareas`, `cuadrillas`
- **Buen lugar para agregar**:
  - ✅ Bloque "Costos proyectados" por obra
  - ✅ Widget "Presupuesto total aprobado"
  - ⚠️ Menos relevante para billetera del cliente

#### 2. **app/cliente/dashboard/page.tsx**
- **Path completo**: `apps/web/app/cliente/dashboard/page.tsx`
- **Rol**: cliente
- **Información que muestra**:
  - Dashboard principal con múltiples secciones
  - Navegación lateral (SidebarClienteTecnico)
  - Secciones: chat, obras, tareas, cuadrillas, notificaciones, calendario, cuenta
- **Consume datos de Supabase**: ⚠️ Indirecto (via secciones)
- **Buen lugar para agregar**:
  - ✅ Nueva opción "Billetera" en SidebarClienteTecnico
  - ✅ Widget de "Gastos totales" en el dashboard principal

#### 3. **components/cliente/PresupuestoSection.tsx**
- **Path completo**: `apps/web/components/cliente/PresupuestoSection.tsx`
- **Rol**: cliente
- **Información que muestra**:
  - Solicitudes de presupuesto
  - Estados de presupuestos
  - Tabla de solicitudes con estados
- **Consume datos de Supabase**: ✅ Sí
  - Tablas: `tareas_presupuestos`, `tareas`
- **Buen lugar para agregar**:
  - ⚠️ Menos relevante, es una vista de gestión de presupuestos

### 🔀 Navegación Compartida

#### 1. **components/socio/SocioTabBar.tsx**
- **Path completo**: `apps/web/components/socio/SocioTabBar.tsx`
- **Rol**: socio
- **Información que muestra**:
  - Tab bar inferior con 4 pestañas: Inicio, Mis tareas, Mensajes, Menú
  - Menú lateral con opciones: Notificaciones, Ahora, Tareas, Presupuesta, Mi Cuadrilla, Cuenta
- **Consume datos de Supabase**: ✅ Sí (mensajes no leídos, notificaciones)
- **Cómo agregar nueva pestaña**: 
  - Editar array `menuItems` en líneas 136-143
  - Agregar nuevo item con icon, label y route
  - O agregar como pestaña principal en el grid (líneas 161-207)
- **Buen lugar para agregar**:
  - ✅ Opción "Billetera" en el menú lateral (menuItems)
  - ✅ Nueva pestaña "Billetera" reemplazando "Menú" o agregando 5ta pestaña

#### 2. **components/cliente/SidebarClienteTecnico.tsx**
- **Path completo**: `apps/web/components/cliente/SidebarClienteTecnico.tsx`
- **Rol**: cliente
- **Información que muestra**:
  - Sidebar expandible con menú de navegación
  - Opciones: Chat, Obras, Tareas, Cuadrillas, Notificaciones, Calendario, Cuenta
- **Consume datos de Supabase**: ✅ Sí (notificaciones no leídas)
- **Cómo agregar nueva opción**:
  - Editar array `menuItems` en líneas 65-73
  - Agregar nuevo item con id, label, icon
  - El componente maneja automáticamente el routing
- **Buen lugar para agregar**:
  - ✅ Opción "Billetera" después de "Cuadrillas" o antes de "Cuenta"
  - Usar icono: `Wallet` o `DollarSign` de lucide-react

---

## BLOQUE 2 — Flujo de TAREAS (dónde crear movimientos de billetera)

### 📍 Rutas y Componentes Principales

#### 1. **app/api/tareas/[id]/transition/route.ts**
- **Path completo**: `apps/web/app/api/tareas/[id]/transition/route.ts`
- **Acción**: Cambiar estado de tarea (transición FSM)
- **Estados que maneja**: pendiente → en_ejecucion → finalizado → validado
- **Campos de Supabase que toca**:
  - Tabla `tareas`: campo `estado`
  - Tabla `eventos`: crea registro de cambio de estado
  - Tabla `media`: guarda evidencias fotográficas
- **Punto de disparo para billetera**:
  - ✅ **VALIDADO**: Cuando estado cambia a `validado` → CRÉDITO al socio
    - Líneas 497-504: actualiza estado de tarea
    - Agregar lógica POST validación para crear movimiento de billetera
  - ⚠️ **EN_EJECUCION**: Opcional, podría crear un "adelanto" o "anticipo"
  - ⚠️ **FINALIZADO**: No generar crédito todavía, esperar validación

#### 2. **app/api/tareas/[id]/estado/route.ts**
- **Path completo**: `apps/web/app/api/tareas/[id]/estado/route.ts`
- **Acción**: Cambiar estado de tarea (endpoint alternativo)
- **Método**: POST
- **Campos de Supabase que toca**:
  - Tabla `tareas`: campo `estado`
  - Tabla `tareas_estados`: historial de cambios
- **Punto de disparo para billetera**:
  - ✅ **VALIDADA**: Cuando `estadoNuevo === 'VALIDADA'` → CRÉDITO al socio
    - Línea 66: case 'VALIDADA'
    - Agregar lógica después de actualizar estado (después de línea 138)

#### 3. **lib/services/tarea.service.ts**
- **Path completo**: `apps/web/lib/services/tarea.service.ts`
- **Acción**: Lógica de negocio para tareas
- **Funciones relevantes**:
  - `cambiarEstado()` (línea ~340): Maneja cambios de estado
  - `crearPagoAutomatico()` (línea 584): **YA EXISTE** lógica de pago
- **Campos de Supabase que toca**:
  - Tabla `tareas`
  - Tabla `eventos`
  - Tabla `pagos` (línea 606): crea registro de pago cuando se valida
- **Punto de disparo para billetera**:
  - ✅ **Línea 365-366**: Ya llama a `crearPagoAutomatico()` cuando se valida
  - ✅ **REUTILIZAR**: Adaptar `crearPagoAutomatico()` para crear movimiento de billetera
  - ✅ También crear débito por comisión a GROWS en el mismo punto

#### 4. **components/socio/sections/AhoraSection.tsx**
- **Path completo**: `apps/web/components/socio/sections/AhoraSection.tsx`
- **Acción**: Finalizar tarea desde la UI
- **Método**: Llama a `/api/tareas/[id]/transition` con estado `finalizado`
- **Campos de Supabase que toca**:
  - Tabla `tareas`: actualiza estado
  - Tabla `eventos`: crea evento de finalización
- **Punto de disparo para billetera**:
  - ⚠️ **NO**: Solo finaliza, no valida. El crédito debe ser en validación.

#### 5. **app/api/tareas/[id]/asignar/route.ts**
- **Path completo**: `apps/web/app/api/tareas/[id]/asignar/route.ts`
- **Acción**: Asignar tarea a socio
- **Campos de Supabase que toca**:
  - Tabla `tareas`: campo `responsable`, `cuadrilla_id`
- **Punto de disparo para billetera**:
  - ❌ **NO**: La asignación no genera dinero, solo prepara la tarea

### 🔄 Flujo de Validación (Punto Clave)

**Estado: TERMINADA → VALIDADA**

1. **Cliente valida tarea** (desde UI de validación)
   - Componente: `components/cliente/ValidarTareasSection.tsx` (probablemente)
   - Endpoint: `/api/tareas/[id]/transition` o `/api/tareas/[id]/estado`

2. **Backend procesa validación**:
   - `lib/services/tarea.service.ts` línea 365-366
   - Ya existe `crearPagoAutomatico()` que crea registro en tabla `pagos`

3. **Punto de integración para billetera**:
   ```typescript
   // En tarea.service.ts, después de línea 366
   if (data.estadoNuevo === 'VALIDADA') {
     await this.crearPagoAutomatico(data.tareaId, actorId);
     
     // 🆕 AGREGAR AQUÍ:
     // 1. Obtener presupuesto aprobado de la tarea
     // 2. Calcular monto total (monto del presupuesto)
     // 3. Calcular comisión GROWS (ej: 5% o configurable)
     // 4. Crear CRÉDITO al socio (monto total - comisión)
     // 5. Crear DÉBITO por comisión a GROWS
     // 6. Registrar movimientos en tabla wallet_movimientos
   }
   ```

### 📊 Tablas de Supabase Involucradas

- `tareas`: información de la tarea
- `tareas_presupuestos`: monto del presupuesto aprobado
- `eventos`: historial de cambios de estado
- `pagos`: registros de pago (ya existe)
- 🆕 `wallet_movimientos`: movimientos de billetera (a crear)
- 🆕 `wallet_saldos`: saldos actuales por socio/org (a crear)

---

## BLOQUE 3 — Flujo de PRESUPUESTOS (origen del dinero)

### 📋 Rutas y Componentes de Presupuestos

#### 1. **app/api/socio/presupuestos/route.ts**
- **Path completo**: `apps/web/app/api/socio/presupuestos/route.ts`
- **Función**: GET - Obtener presupuestos del socio por obra
- **Datos que maneja**:
  - `monto`: monto del presupuesto (línea 303)
  - `cantidad`: cantidad de unidades
  - `unidad`: unidad de medida
  - `dias_reales`: días estimados
  - `estado`: PENDIENTE, ENVIADO, APROBADO, RECHAZADO
- **Relación con Supabase**:
  - Tabla `tareas_presupuestos`: presupuestos del socio
  - Tabla `tareas`: información de tareas
  - Tabla `obras`: información de obras
- **Evento de presupuesto que genera movimiento**:
  - ⚠️ **NO directamente**: El presupuesto solo establece el monto, el movimiento se genera al validar la tarea

#### 2. **app/api/presupuestos/aprobar-socio/route.ts**
- **Path completo**: `apps/web/app/api/presupuestos/aprobar-socio/route.ts`
- **Función**: POST - Aprobar presupuesto y asignar tarea al socio
- **Datos que maneja**:
  - `socio_id`: ID del socio al que se aprueba
  - `obra_id`: ID de la obra
  - `etapa_id`: Opcional, etapa de la obra
- **Acciones que realiza**:
  1. Actualiza presupuesto a `APROBADO` (línea 242)
  2. Asigna tarea al socio (línea 257-259)
  3. Rechaza otros presupuestos de la misma tarea (línea 271-278)
  4. Crea evento de asignación (línea 285-300)
- **Relación con Supabase**:
  - Tabla `tareas_presupuestos`: actualiza estado
  - Tabla `tareas`: asigna socio
  - Tabla `eventos`: crea evento
- **Evento que podría generar movimiento**:
  - ⚠️ **NO**: La aprobación no paga, solo asigna. El pago es al validar.

#### 3. **app/api/presupuestos/[id]/aprobar/route.ts**
- **Path completo**: `apps/web/app/api/presupuestos/[id]/aprobar/route.ts`
- **Función**: Aprobar presupuesto individual
- **Datos que maneja**: Similar a aprobar-socio pero para un presupuesto específico
- **Evento que genera movimiento**:
  - ⚠️ **NO**: Similar al anterior, solo aprueba, no paga

#### 4. **app/socio/presupuestos/page.tsx**
- **Path completo**: `apps/web/app/socio/presupuestos/page.tsx`
- **Función**: UI para gestionar presupuestos
- **Datos que maneja**:
  - Totales acumulados: `totalDias`, `totalMonto` (línea 159-178)
  - Presupuestos filtrados por etapa (ESTRUCTURA, OBRA_GRIS, TERMINACIONES)
  - Estados: PENDIENTE, ENVIADO, APROBADO
- **Acciones**:
  - Guardar borrador
  - Enviar presupuesto
  - Generar PDF
- **Relación con Supabase**:
  - Consume `/api/socio/presupuestos`
  - Usa hook `usePresupuestos` para gestión
- **Evento que genera movimiento**:
  - ⚠️ **NO**: Solo gestiona presupuestos, no pagos

#### 5. **components/cliente/PresupuestoSection.tsx**
- **Path completo**: `apps/web/components/cliente/PresupuestoSection.tsx`
- **Función**: UI para solicitar presupuestos
- **Datos que maneja**:
  - Solicitudes de presupuesto
  - Estados: pedido, pendiente, aprobado, rechazado
- **Relación con Supabase**:
  - Tabla `tareas_presupuestos`: crea solicitudes (línea 384-391)
- **Evento que genera movimiento**:
  - ⚠️ **NO**: Solo solicita presupuestos

### 💰 Flujo de Dinero (Desde Presupuesto hasta Pago)

1. **Socio crea presupuesto**:
   - Tabla: `tareas_presupuestos`
   - Campos: `monto`, `cantidad`, `unidad`, `dias_reales`
   - Estado: `PENDIENTE`

2. **Socio envía presupuesto**:
   - Estado cambia a `ENVIADO`
   - Se genera PDF del presupuesto

3. **Cliente aprueba presupuesto**:
   - Endpoint: `/api/presupuestos/aprobar-socio`
   - Estado cambia a `APROBADO`
   - Tarea se asigna al socio
   - **Aún NO hay movimiento de billetera**

4. **Socio ejecuta y finaliza tarea**:
   - Tarea cambia a estado `TERMINADA`
   - **Aún NO hay movimiento de billetera**

5. **Cliente valida tarea**:
   - Tarea cambia a estado `VALIDADA`
   - **✅ AQUÍ SE GENERA EL MOVIMIENTO DE BILLETERA**:
     - Se obtiene el `monto` del presupuesto aprobado
     - Se calcula comisión GROWS (ej: 5% del monto)
     - CRÉDITO al socio: `monto - comision`
     - DÉBITO por comisión a GROWS: `comision`

### 📊 Cálculo de Montos

**Fuente de datos para el monto**:
- Tabla `tareas_presupuestos`: campo `monto` (número)
- Relación: `tarea_id` → `tareas_presupuestos` → `monto`
- Filtro: `estado = 'APROBADO'` y `socio_id = [socio que ejecutó la tarea]`

**Ejemplo de cálculo**:
```typescript
// Pseudocódigo
const presupuesto = await supabase
  .from('tareas_presupuestos')
  .select('monto')
  .eq('tarea_id', tareaId)
  .eq('estado', 'APROBADO')
  .single();

const montoTotal = presupuesto.monto; // Ej: $100,000
const comisionGROWS = montoTotal * 0.05; // 5% = $5,000
const creditoSocio = montoTotal - comisionGROWS; // $95,000

// Crear movimientos:
// 1. CRÉDITO socio: +$95,000
// 2. DÉBITO comisión GROWS: -$5,000
```

---

## BLOQUE 4 — Arquitectura actual de API (para modelar /wallet)

### 📁 Estructura de Endpoints Existentes

#### Patrón Base Común

**1. Instanciación de Supabase Server Client**:
```typescript
import { createServiceSupabaseClient } from '@/lib/supabase-server';

const supabase = createServiceSupabaseClient();
```

**2. Autenticación (user/org/socio)**:
```typescript
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const cookieStore = await cookies();
const supabaseAuth = createRouteHandlerClient<Database>({ 
  cookies: () => cookieStore as any 
});

const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
```

**3. Formato de JSON Responses**:
```typescript
// Éxito
return NextResponse.json({
  success: true,
  data: result
});

// Error
return NextResponse.json(
  { success: false, error: 'Mensaje de error' },
  { status: 400 }
);
```

### 🎯 Endpoints Modelo

#### Modelo para POST (Crear movimiento)

**Archivo**: `app/api/socios/route.ts`
- **Path completo**: `apps/web/app/api/socios/route.ts`
- **Método**: POST
- **Patrón**:
  - Validación con Zod (líneas 13-16)
  - Autenticación (líneas 34-44)
  - Resolución de contexto org (líneas 46-50)
  - Verificación de permisos (líneas 52-56)
  - Operación en Supabase (líneas 59-68)
  - Respuesta JSON (línea 74)

**Código de referencia**:
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);
    
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore as any 
    });
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ message: 'No autenticado' }), {
        status: 401,
      });
    }
    
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('tabla')
      .insert(payload)
      .select('id')
      .single();
    
    if (error) throw error;
    
    return new Response(JSON.stringify({ id: data.id }), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return new Response(JSON.stringify({ message }), { status: 400 });
  }
}
```

#### Modelo para GET (Obtener saldo/movimientos)

**Archivo**: `app/api/socio/presupuestos/route.ts`
- **Path completo**: `apps/web/app/api/socio/presupuestos/route.ts`
- **Método**: GET
- **Patrón**:
  - Leer query params (línea 19)
  - Autenticación (líneas 41-48)
  - Resolución de socio (líneas 54-65)
  - Query a Supabase con joins (líneas 298-322)
  - Procesamiento de datos (líneas 366-431)
  - Respuesta estructurada (líneas 433-446)

**Código de referencia**:
```typescript
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obra_id');
    
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore as any 
    });
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }
    
    const supabase = createServiceSupabaseClient();
    
    // Obtener datos con relaciones
    const { data, error } = await supabase
      .from('tabla')
      .select(`
        *,
        relacion:tabla_relacionada(*)
      `)
      .eq('filtro', valor);
    
    if (error) throw error;
    
    // Procesar datos
    const resultado = data.map(item => ({
      // transformación
    }));
    
    return NextResponse.json({
      data: resultado
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### 🏗️ Endpoints a Crear para Wallet

#### 1. **GET /api/wallet/saldo**
- **Propósito**: Obtener saldo actual del socio o cliente
- **Parámetros**: Ninguno (se obtiene del usuario autenticado)
- **Respuesta**:
```typescript
{
  saldo: number,
  saldo_disponible: number,
  saldo_pendiente: number,
  moneda: 'ARS'
}
```
- **Modelo base**: `app/api/socio/presupuestos/route.ts` (GET)
- **Tabla Supabase**: `wallet_saldos` (a crear)

#### 2. **GET /api/wallet/movimientos**
- **Propósito**: Obtener historial de movimientos
- **Parámetros**: `?limit=50&offset=0&tipo=credito|debito|todos`
- **Respuesta**:
```typescript
{
  movimientos: Array<{
    id: string,
    tipo: 'credito' | 'debito',
    monto: number,
    concepto: string,
    tarea_id?: string,
    fecha: string,
    estado: 'completado' | 'pendiente'
  }>,
  total: number,
  paginacion: {
    limit: number,
    offset: number,
    hasMore: boolean
  }
}
```
- **Modelo base**: `app/api/socio/presupuestos/route.ts` (GET con paginación)
- **Tabla Supabase**: `wallet_movimientos` (a crear)

#### 3. **POST /api/wallet/debitos**
- **Propósito**: Crear débito (comisión GROWS)
- **Body**:
```typescript
{
  monto: number,
  concepto: string,
  tarea_id?: string,
  motivo: string
}
```
- **Modelo base**: `app/api/socios/route.ts` (POST)
- **Tabla Supabase**: `wallet_movimientos`

#### 4. **POST /api/wallet/creditos**
- **Propósito**: Crear crédito al socio
- **Body**:
```typescript
{
  socio_id: string,
  monto: number,
  concepto: string,
  tarea_id: string,
  presupuesto_id?: string
}
```
- **Modelo base**: `app/api/socios/route.ts` (POST)
- **Tabla Supabase**: `wallet_movimientos`

### 📋 Lista Completa de Endpoints API Existentes

**Ubicación**: `apps/web/app/api/`

1. `/api/auth/**` - Autenticación (4 endpoints)
2. `/api/catalogo/route.ts` - Catálogo de elementos
3. `/api/chat/route.ts` - Chat
4. `/api/cuadrillas/[id]/socios/route.ts` - Socios de cuadrilla
5. `/api/eventos/route.ts` - Eventos
6. `/api/invitaciones/crear/route.ts` - Invitaciones
7. `/api/invites/**` - Invitaciones (2 endpoints)
8. `/api/legajo/**` - Legajo (4 endpoints)
9. `/api/mensajes/**` - Mensajería (2 endpoints)
10. `/api/notificaciones/**` - Notificaciones (3 endpoints)
11. `/api/obras/**` - Obras (11 endpoints)
12. `/api/orgs/**` - Organizaciones (3 endpoints)
13. `/api/payments/**` - Pagos MercadoPago (3 endpoints) ⚠️ Ver BLOQUE 5
14. `/api/presupuestos/**` - Presupuestos (5 endpoints)
15. `/api/qr/resolve/route.ts` - Resolver QR
16. `/api/roadmap/**` - Roadmap (2 endpoints)
17. `/api/socio/**` - Socio (3 endpoints)
18. `/api/socios/**` - Socios (6 endpoints)
19. `/api/subscription/plan/route.ts` - Plan de suscripción
20. `/api/suscripciones/limites/route.ts` - Límites de suscripción
21. `/api/tareas/**` - Tareas (10 endpoints)
22. `/api/upload/**` - Upload (1 endpoint)
23. `/api/usage/[key]/route.ts` - Uso
24. `/api/webhooks/supabase-auth/route.ts` - Webhook Supabase

---

## BLOQUE 5 — Código existente relacionado a pagos, comisiones o billetera

### 🔍 Referencias Encontradas

#### 1. **lib/services/tarea.service.ts**
- **Path completo**: `apps/web/lib/services/tarea.service.ts`
- **Línea**: 364-366, 584-618
- **Resumen**: 
  - Ya existe función `crearPagoAutomatico()` que crea registro en tabla `pagos`
  - Se ejecuta cuando tarea se valida (estado VALIDADA)
  - Crea registro en tabla `pagos` con estado `PENDIENTE`
- **Acción recomendada**: 
  - ✅ **REUTILIZAR**: Adaptar esta función para crear movimientos de billetera
  - ✅ Mantener compatibilidad con tabla `pagos` existente
  - ✅ Agregar lógica de billetera en el mismo punto

#### 2. **lib/payments/mercadopago.ts**
- **Path completo**: `apps/web/lib/payments/mercadopago.ts`
- **Línea**: Todo el archivo
- **Resumen**: 
  - Integración con MercadoPago para suscripciones
  - Funciones: `createSubscriptionCheckout()`, `cancelSubscriptionInMercadoPago()`
  - Maneja pagos recurrentes de planes de suscripción
- **Acción recomendada**: 
  - ⚠️ **NO REUTILIZAR**: Es para suscripciones, no para pagos a socios
  - ✅ Mantener separado, es un módulo diferente

#### 3. **app/api/payments/** (3 endpoints)
- **Paths**:
  - `apps/web/app/api/payments/subscribe/route.ts`
  - `apps/web/app/api/payments/cancel/route.ts`
  - `apps/web/app/api/payments/webhook/route.ts`
- **Resumen**: 
  - Manejan suscripciones de planes GROWS
  - No están relacionados con pagos a socios
- **Acción recomendada**: 
  - ⚠️ **NO REUTILIZAR**: Módulo diferente
  - ✅ Mantener separado

#### 4. **lib/types/grows.types.ts**
- **Path completo**: `apps/web/lib/types/grows.types.ts`
- **Línea**: 19, 148-156, 254
- **Resumen**: 
  - Define tipos TypeScript: `EstadoPago`, `Pago`, `DashboardSocio`
  - `DashboardSocio` incluye: `pagos_recibidos`, `monto_ganado`, `monto_pendiente`
- **Acción recomendada**: 
  - ✅ **REUTILIZAR**: Extender estos tipos para billetera
  - ✅ Agregar tipos: `MovimientoWallet`, `SaldoWallet`

#### 5. **lib/schemas/tarea.schema.ts**
- **Path completo**: `apps/web/lib/schemas/tarea.schema.ts`
- **Línea**: 117-216
- **Resumen**: 
  - Define schemas Zod para pagos: `EstadoPagoSchema`, `CrearPagoSchema`
  - Estados: PENDIENTE, PAGADO, CANCELADO
- **Acción recomendada**: 
  - ✅ **REUTILIZAR**: Crear schemas similares para movimientos de billetera
  - ✅ Tipos: `TipoMovimientoSchema` (credito/debito)

#### 6. **lib/services/evento.service.ts**
- **Path completo**: `apps/web/lib/services/evento.service.ts`
- **Línea**: 398-416
- **Resumen**: 
  - Funciones: `crearEventoPagoGenerado()`, `crearEventoPagoRealizado()`
  - Crea eventos cuando se genera o realiza un pago
- **Acción recomendada**: 
  - ✅ **REUTILIZAR**: Crear eventos similares para movimientos de billetera
  - ✅ Eventos: `MOVIMIENTO_WALLET_CREDITO`, `MOVIMIENTO_WALLET_DEBITO`

#### 7. **n8n_local/Contextos/contexto_pagos.json**
- **Path completo**: `apps/web/n8n_local/Contextos/contexto_pagos.json`
- **Resumen**: 
  - Contexto para n8n sobre el módulo de pagos
  - Documenta generación de pagos vinculados a validación de tareas
- **Acción recomendada**: 
  - ⚠️ **REFERENCIA**: Útil para entender el flujo, pero no código ejecutable

#### 8. **context/gaucho.contexto.json**
- **Path completo**: `apps/web/context/gaucho.contexto.json`
- **Línea**: 231, 364
- **Resumen**: 
  - Menciona "billetera digital para gatillar pagos al validar tareas"
  - Planificado pero no implementado
- **Acción recomendada**: 
  - ✅ **IMPLEMENTAR**: Este es exactamente lo que se necesita

### 🗑️ Código a Descartar

- ❌ **Ninguno**: Todo el código encontrado es relevante o puede reutilizarse

### 🔧 Código a Refactorizar

1. **lib/services/tarea.service.ts - crearPagoAutomatico()**:
   - Actualmente crea registro en tabla `pagos`
   - Refactorizar para:
     - Mantener registro en `pagos` (compatibilidad)
     - Crear movimiento en `wallet_movimientos` (nuevo)
     - Actualizar saldo en `wallet_saldos` (nuevo)

### 📦 Servicios Viejos / Modelos Abandonados

- ⚠️ **lib/services/**: Revisar si hay servicios de pagos antiguos no utilizados
- ⚠️ **prisma/schema.prisma**: Verificar si hay modelos Prisma de pagos que ya no se usan (el proyecto usa Supabase directamente)

---

## BLOQUE 6 — Navegación: dónde crear /socio/billetera y /cliente/billetera

### 📱 SOCIO (app móvil)

#### Componente de Navegación

**Archivo**: `components/socio/SocioTabBar.tsx`
- **Path completo**: `apps/web/components/socio/SocioTabBar.tsx`
- **Layout**: `app/socio/layout.tsx` (incluye SocioTabBar en línea 54)

#### Cómo Agregar Nueva Sección

**Opción 1: Agregar al menú lateral** (Recomendado):
```typescript
// En SocioTabBar.tsx, línea 136-143
const menuItems = [
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell, route: '/socio/notificaciones' as Route },
  { id: 'ahora', label: 'Ahora', icon: Clock, route: '/socio/ahora' as Route },
  { id: 'tareas', label: 'Tareas', icon: ClipboardList, route: '/socio/tareas' as Route },
  { id: 'presupuestos', label: 'Presupuesta', icon: NotebookPen, route: '/socio/presupuestos' as Route },
  { id: 'billetera', label: 'Billetera', icon: Wallet, route: '/socio/billetera' as Route }, // 🆕
  { id: 'cuadrilla', label: 'Mi Cuadrilla', icon: Users, route: '/socio/cuadrilla' as Route },
  { id: 'cuenta', label: 'Cuenta', icon: User, route: '/socio/cuenta' as Route },
];
```

**Opción 2: Agregar como pestaña principal** (No recomendado, ya hay 4):
- Requeriría cambiar el grid de 4 a 5 columnas
- Mejor mantener en el menú lateral

#### Dónde Crear la Ruta

**Path**: `apps/web/app/socio/billetera/page.tsx`
- **Layout**: Usa `app/socio/layout.tsx` automáticamente
- **Providers/Hooks**: 
  - `useCurrentUser()` para obtener usuario
  - Supabase client para datos
  - Hook personalizado: `useWallet()` (a crear)

#### Propuesta de Ubicación en UI

- ✅ **En menú lateral**: Entre "Presupuesta" y "Mi Cuadrilla"
- ✅ **Icono**: `Wallet` de lucide-react
- ✅ **Badge opcional**: Mostrar saldo disponible en el menú

### 💻 CLIENTE (panel web)

#### Componente de Navegación

**Archivo**: `components/cliente/SidebarClienteTecnico.tsx`
- **Path completo**: `apps/web/components/cliente/SidebarClienteTecnico.tsx`
- **Layout**: Se usa en `app/cliente/dashboard/page.tsx` (línea 84)

#### Cómo Agregar Nueva Opción

```typescript
// En SidebarClienteTecnico.tsx, línea 65-73
const menuItems = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'obras', label: 'Obras', icon: Building2 },
  { id: 'tareas', label: 'Tareas', icon: ClipboardList },
  { id: 'cuadrillas', label: 'Cuadrillas', icon: Users },
  { id: 'billetera', label: 'Billetera', icon: Wallet }, // 🆕
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'calendario', label: 'Calendario', icon: Calendar },
  { id: 'cuenta', label: 'Cuenta', icon: User },
];
```

El componente maneja automáticamente:
- Routing al hacer clic
- Estado activo basado en `activeSection`
- Contadores de notificaciones

#### Dónde Crear la Ruta

**Opción 1: Como sección del dashboard** (Recomendado):
- Agregar case en `app/cliente/dashboard/page.tsx` línea 54-72
- Crear componente: `components/cliente/BilleteraSection.tsx`
- Renderizar cuando `activeSection === 'billetera'`

**Opción 2: Como página independiente**:
- Path: `apps/web/app/cliente/billetera/page.tsx`
- Requiere modificar el routing del sidebar

**Recomendación**: Opción 1 (sección del dashboard), similar a las otras secciones.

#### Providers/Hooks de Datos

- `useCurrentUser()`: usuario actual
- `createClientComponentClient()`: cliente Supabase
- Hook personalizado: `useWalletMovimientos()` (a crear)

#### Propuesta de Ubicación en UI

- ✅ **En sidebar**: Entre "Cuadrillas" y "Notificaciones"
- ✅ **Icono**: `Wallet` de lucide-react
- ✅ **Badge opcional**: Mostrar "Gastos totales" o indicador

### 🏗️ Estructura de Archivos Propuesta

```
apps/web/
├── app/
│   ├── socio/
│   │   └── billetera/
│   │       └── page.tsx                    # 🆕 Página billetera socio
│   └── cliente/
│       └── dashboard/
│           └── page.tsx                    # Modificar: agregar case 'billetera'
├── components/
│   ├── socio/
│   │   └── billetera/                      # 🆕 Componentes billetera socio
│   │       ├── SaldoCard.tsx
│   │       ├── MovimientosList.tsx
│   │       └── ResumenMes.tsx
│   └── cliente/
│       └── BilleteraSection.tsx            # 🆕 Sección billetera cliente
├── app/api/
│   └── wallet/                             # 🆕 Endpoints billetera
│       ├── saldo/
│       │   └── route.ts
│       ├── movimientos/
│       │   └── route.ts
│       ├── creditos/
│       │   └── route.ts
│       └── debitos/
│           └── route.ts
└── lib/
    ├── hooks/
    │   ├── useWallet.ts                    # 🆕 Hook billetera socio
    │   └── useWalletCliente.ts             # 🆕 Hook billetera cliente
    └── services/
        └── wallet.service.ts               # 🆕 Servicio billetera
```

---

## 📝 RESUMEN EJECUTIVO

### Puntos Clave para Implementación

1. **Integración de Billetera**:
   - Socio: Agregar en menú lateral de SocioTabBar
   - Cliente: Agregar en SidebarClienteTecnico

2. **Punto de Disparo de Movimientos**:
   - **Archivo clave**: `lib/services/tarea.service.ts` línea 365-366
   - **Evento**: Cuando tarea cambia a estado `VALIDADA`
   - **Acción**: Crear crédito al socio y débito por comisión

3. **Fuente del Monto**:
   - Tabla: `tareas_presupuestos`
   - Campo: `monto`
   - Filtro: `estado = 'APROBADO'` y `tarea_id = [tarea validada]`

4. **Código Existente a Reutilizar**:
   - ✅ `crearPagoAutomatico()` en tarea.service.ts
   - ✅ Tipos en grows.types.ts
   - ✅ Schemas en tarea.schema.ts
   - ✅ Eventos en evento.service.ts

5. **Endpoints a Crear**:
   - GET `/api/wallet/saldo`
   - GET `/api/wallet/movimientos`
   - POST `/api/wallet/creditos`
   - POST `/api/wallet/debitos`

6. **Tablas Supabase a Crear**:
   - `wallet_movimientos`: historial de movimientos
   - `wallet_saldos`: saldos actuales por socio/org

---

**Fecha de análisis**: 2024
**Versión del código analizado**: v1.0

