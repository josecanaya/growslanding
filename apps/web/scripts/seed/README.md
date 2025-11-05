# Scripts de Seed para Supabase

Este directorio contiene scripts para cargar datos de ejemplo en Supabase.

## Scripts Disponibles

### `insertElementosSupabase.ts`

Script para cargar elementos en la tabla `elementos` de Supabase.

**Uso:**
```bash
npx tsx scripts/seed/insertElementosSupabase.ts
```

**Requisitos:**
- Variables de entorno en `.env.local`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

**Características:**
- ✅ Validación completa de datos antes de insertar
- ✅ Normalización automática de `etapa` a lowercase (`'estructura'`, `'obra_gris'`, `'terminaciones'`)
- ✅ Validación de UUIDs, campos requeridos, tipos de datos
- ✅ Manejo de errores detallado
- ✅ Verificación posterior a la inserción
- ✅ Logs informativos de progreso

**Ejemplo de datos:**
```typescript
const elementos = [
  {
    obra_id: '550e8400-e29b-41d4-a716-446655440000',
    nombre: 'Muro de ladrillo hueco 18cm',
    categoria: 'Muros',
    subcategoria: 'Muro portante',
    etapa: 'estructura',
    unidad: 'm²',
    cantidad: 120,
    costo_unitario: 15000,
    duracion_estimada: 5,
    orden: 1,
    planta_id: 'PB',
    descripcion: 'Muro estructural de planta baja'
  },
  // ... más elementos
];
```

**Campos validados:**
- `obra_id` (UUID, requerido)
- `nombre` (string, min 2 caracteres, requerido)
- `categoria` (string, requerido)
- `etapa` (enum: 'estructura', 'obra_gris', 'terminaciones', requerido)
- `unidad` (enum: 'm²', 'm³', 'ml', 'unidad', 'kg', 'l', requerido)
- `cantidad` (number, positivo, requerido)
- `costo_unitario` (number, positivo o null, opcional)
- `duracion_estimada` (number, entero positivo o null, opcional)
- `orden` (number, entero positivo o null, opcional)
- `subcategoria` (string, opcional)
- `planta_id` (string, opcional)
- `descripcion` (string, opcional)
- `plantilla_elemento_id` (UUID, opcional)

**Normalización automática:**
- `etapa` se normaliza a lowercase y snake_case
  - `'ESTRUCTURA'` → `'estructura'`
  - `'OBRA_GRIS'` → `'obra_gris'`
  - `'TERMINACIONES'` → `'terminaciones'`
  - `'obra gris'` → `'obra_gris'`
  - etc.

**Salida:**
- Lista de elementos insertados con sus IDs
- Resumen de inserciones exitosas y errores
- Verificación posterior con consulta a Supabase

