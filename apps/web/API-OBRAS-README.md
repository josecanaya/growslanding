# 🏗️ API de Obras - CRUD Completo

Este archivo implementa un CRUD REST completo para el modelo `Obra` usando Prisma y Next.js 15.

## 📁 Archivo
`apps/web/app/api/obras/route.ts`

## 🚀 Endpoints Disponibles

### 1. **GET** `/api/obras`
Obtiene todas las obras ordenadas por fecha de creación descendente.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "name": "Nombre de la obra",
      "address": "Dirección",
      "estado": "pendiente",
      "createdAt": "2025-10-15T19:41:56.505Z",
      "organization": {
        "id": "uuid",
        "name": "Nombre organización"
      },
      "tareas": []
    }
  ],
  "count": 1
}
```

### 2. **POST** `/api/obras`
Crea una nueva obra.

**Body requerido:**
```json
{
  "orgId": "uuid-de-organizacion",
  "name": "Nombre de la obra",
  "address": "Dirección (opcional)",
  "estado": "pendiente (opcional, default: pendiente)"
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Obra creada exitosamente",
  "data": {
    "id": "uuid",
    "orgId": "uuid",
    "name": "Nombre de la obra",
    "address": "Dirección",
    "estado": "pendiente",
    "createdAt": "2025-10-15T19:41:56.505Z",
    "organization": {
      "id": "uuid",
      "name": "Nombre organización"
    }
  }
}
```

### 3. **PATCH** `/api/obras`
Actualiza una obra existente.

**Body requerido:**
```json
{
  "id": "uuid-de-obra",
  "name": "Nuevo nombre (opcional)",
  "address": "Nueva dirección (opcional)",
  "estado": "nuevo-estado (opcional)"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Obra actualizada exitosamente",
  "data": {
    "id": "uuid",
    "orgId": "uuid",
    "name": "Nombre actualizado",
    "address": "Dirección actualizada",
    "estado": "completado",
    "createdAt": "2025-10-15T19:41:56.505Z",
    "organization": {
      "id": "uuid",
      "name": "Nombre organización"
    },
    "tareas": []
  }
}
```

### 4. **DELETE** `/api/obras`
Elimina una obra por ID.

**Body requerido:**
```json
{
  "id": "uuid-de-obra"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Obra eliminada exitosamente"
}
```

## 🧪 Pruebas

### Prueba rápida con curl:

```bash
# 1. Obtener todas las obras
curl http://localhost:3000/api/obras

# 2. Crear una obra (necesitas un orgId válido)
curl -X POST http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "uuid-de-organizacion-existente",
    "name": "Condominio Pueblo Esther",
    "address": "Ruta 21 km 10",
    "estado": "en progreso"
  }'

# 3. Actualizar una obra
curl -X PATCH http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-de-obra-existente",
    "name": "Condominio Pueblo Esther - Actualizado",
    "estado": "completado"
  }'

# 4. Eliminar una obra
curl -X DELETE http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-de-obra-existente"
  }'
```

### Scripts de prueba incluidos:

1. **Node.js**: `node test-api-obras.js`
2. **Bash**: `./test-api-obras.sh` (requiere `jq` para formateo JSON)

## ⚠️ Validaciones

- **orgId**: Debe ser un UUID válido y la organización debe existir
- **name**: Obligatorio, mínimo 1 carácter, máximo 255
- **address**: Opcional, puede ser null
- **estado**: Opcional, default "pendiente"
- **id**: Para PATCH/DELETE, debe ser un UUID válido y la obra debe existir

## 🚫 Restricciones

- No se puede eliminar una obra que tenga tareas asociadas (error 409)
- Todas las operaciones requieren que la organización exista
- Los UUIDs deben ser válidos

## 📊 Códigos de Estado HTTP

- **200**: Operación exitosa (GET, PATCH, DELETE)
- **201**: Recurso creado exitosamente (POST)
- **400**: Datos de entrada inválidos
- **404**: Recurso no encontrado
- **409**: Conflicto (obra con tareas asociadas)
- **500**: Error interno del servidor

## 🔧 Configuración

El API usa:
- **Prisma Client**: Importado desde `@/lib/prisma`
- **Zod**: Para validación de esquemas
- **NextResponse**: Para respuestas HTTP
- **Runtime**: `nodejs`

## 📝 Logs

Todos los errores se registran en la consola con `console.error` para facilitar el debugging.
