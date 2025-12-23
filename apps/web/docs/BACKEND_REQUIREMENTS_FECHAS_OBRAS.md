# 📋 REQUERIMIENTOS BACKEND — Fechas Estimadas de Obras

**Feature:** Fecha de inicio estimada + fecha de finalización estimada (calculada automáticamente)

**Fecha:** Diciembre 2024  
**Responsable Backend:** Pendiente

---

## 1. CAMBIOS EN BASE DE DATOS

### Tabla: `obras`

Agregar los siguientes campos si no existen:

```sql
-- Fecha de inicio estimada (obligatoria al crear obra)
ALTER TABLE obras 
ADD COLUMN IF NOT EXISTS fecha_inicio_estimada TIMESTAMP;

-- Fecha de finalización estimada (calculada automáticamente)
ALTER TABLE obras 
ADD COLUMN IF NOT EXISTS fecha_final_estimada TIMESTAMP;
```

**Nota:** Si los campos ya existen, verificar que sean de tipo `TIMESTAMP`.

---

## 2. MODIFICAR ENDPOINT POST /api/obras

### Cambios requeridos:

1. **Recibir `fecha_inicio_estimada`** en el body de la request
2. **Validar** que el campo esté presente (HTTP 400 si falta)
3. **Validar formato ISO 8601** (o convertir de string a TIMESTAMP)
4. **Validar** que la fecha no sea menor a la fecha actual
5. **Guardar** en la tabla `obras`

### Ejemplo de request body:

```json
{
  "name": "Casa Familiar - Juan Pérez",
  "address": "Calle 123",
  "fecha_inicio_estimada": "2025-01-15",
  "propietario": "Juan Pérez",
  "tipo_obra": "Casa familiar",
  ...
}
```

### Validaciones:

- ✅ `fecha_inicio_estimada` es obligatorio → HTTP 400 si falta
- ✅ Formato válido (ISO 8601 o YYYY-MM-DD) → HTTP 400 si formato inválido
- ✅ Fecha >= fecha actual → HTTP 400 si es menor

### Respuesta:

Guardar `fecha_inicio_estimada` en la DB.

**Inicialmente**, `fecha_final_estimada` puede ser igual a `fecha_inicio_estimada` hasta que haya tareas que permitan calcularla.

---

## 3. CÁLCULO AUTOMÁTICO DE `fecha_final_estimada`

### Fórmula:

```
fecha_final_estimada = fecha_inicio_estimada + dias_totales_presupuestados
```

Donde `dias_totales_presupuestados` = suma de todos los `dias_presupuesto` de:
- Todas las tareas de la obra (tabla `tareas`)
- Todas las modificatorias de tareas (si aplica)

### Función requerida:

```typescript
async function calcularFechaFinal(obraId: string): Promise<Date | null> {
  // 1. Obtener fecha_inicio_estimada de la obra
  // 2. Sumar todos los dias_presupuesto de las tareas
  // 3. Sumar días de modificatorias si aplican
  // 4. Calcular fecha_final_estimada = fecha_inicio + días totales
  // 5. Actualizar campo fecha_final_estimada en tabla obras
  // 6. Retornar la fecha calculada
}
```

### Ejecutar cuando:

El cálculo debe ejecutarse automáticamente cuando:

1. ✅ **Se crea una obra** (inicialmente `fecha_final_estimada = fecha_inicio_estimada`)
2. ✅ **Se agrega una tarea** a la obra
3. ✅ **Se edita una tarea** (si cambia `dias_presupuesto`)
4. ✅ **Se elimina una tarea** de la obra
5. ✅ **Se agrega una modificatoria** que afecte días
6. ✅ **Se edita/elimina una modificatoria**

### Implementación sugerida:

- **Triggers en DB** (recomendado): Trigger AFTER INSERT/UPDATE/DELETE en tabla `tareas` que llame a una función SQL para recalcular
- **Hooks en API**: Ejecutar el cálculo después de cada operación CRUD de tareas
- **Job periódico**: Como backup, ejecutar recálculo periódico (menos recomendado)

---

## 4. ENDPOINTS AFECTADOS

### POST /api/obras
- ✅ Agregar validación de `fecha_inicio_estimada`
- ✅ Guardar campo en DB

### PATCH /api/obras/:id
- ⚠️ Permitir actualizar `fecha_inicio_estimada` (opcional)
- ✅ Si se actualiza `fecha_inicio_estimada`, recalcular `fecha_final_estimada`

### POST /api/tareas
- ✅ Después de crear tarea, recalcular `fecha_final_estimada` de la obra

### PATCH /api/tareas/:id
- ✅ Si se actualiza `dias_presupuesto`, recalcular `fecha_final_estimada` de la obra

### DELETE /api/tareas/:id
- ✅ Después de eliminar tarea, recalcular `fecha_final_estimada` de la obra

---

## 5. QUERIES SQL DE EJEMPLO

### Obtener días totales presupuestados:

```sql
SELECT COALESCE(SUM(dias_presupuesto), 0) as dias_totales
FROM tareas
WHERE obra_id = $1
  AND deleted_at IS NULL;
```

### Calcular fecha final:

```sql
UPDATE obras
SET fecha_final_estimada = fecha_inicio_estimada + INTERVAL '1 day' * (
  SELECT COALESCE(SUM(dias_presupuesto), 0)
  FROM tareas
  WHERE obra_id = $1
    AND deleted_at IS NULL
)
WHERE id = $1;
```

### Trigger sugerido (PostgreSQL):

```sql
CREATE OR REPLACE FUNCTION recalcular_fecha_final_obra()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE obras
  SET fecha_final_estimada = fecha_inicio_estimada + INTERVAL '1 day' * (
    SELECT COALESCE(SUM(dias_presupuesto), 0)
    FROM tareas
    WHERE obra_id = COALESCE(NEW.obra_id, OLD.obra_id)
      AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.obra_id, OLD.obra_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalcular_fecha_final
AFTER INSERT OR UPDATE OR DELETE ON tareas
FOR EACH ROW
EXECUTE FUNCTION recalcular_fecha_final_obra();
```

---

## 6. CASOS ESPECIALES

### Si no hay tareas:
- `fecha_final_estimada` puede ser `NULL` o igual a `fecha_inicio_estimada`
- El frontend mostrará "—" cuando `fecha_final_estimada` es `NULL`

### Si `fecha_inicio_estimada` es NULL:
- No se puede calcular `fecha_final_estimada`
- Retornar error o mantener `NULL`

### Validaciones adicionales:
- Si `fecha_final_estimada` calculada es menor a `fecha_inicio_estimada` → mantener `fecha_inicio_estimada`
- Si `dias_presupuesto` es negativo → tratarlo como 0

---

## 7. TESTING

### Tests manuales necesarios:

1. ✅ Crear obra con `fecha_inicio_estimada` → verificar que se guarda
2. ✅ Crear obra sin `fecha_inicio_estimada` → debe fallar con HTTP 400
3. ✅ Crear tarea con `dias_presupuesto` → verificar que se recalcula `fecha_final_estimada`
4. ✅ Editar tarea cambiando `dias_presupuesto` → verificar recálculo
5. ✅ Eliminar tarea → verificar recálculo
6. ✅ Crear obra sin tareas → `fecha_final_estimada` debe ser igual a `fecha_inicio_estimada` o NULL

---

## 8. NOTAS IMPORTANTES

- ⚠️ El frontend ya envía `fecha_inicio_estimada` al crear obra
- ⚠️ El frontend espera recibir `fecha_inicio_estimada` y `fecha_final_estimada` al hacer GET de obras
- ⚠️ El cálculo debe ser eficiente (considerar índices en `obra_id` en tabla `tareas`)
- ⚠️ Si hay muchas tareas, el recálculo puede ser costoso → considerar hacerlo asíncrono

---

## 9. PRIORIDAD

**ALTA** — Esta feature es crítica para el MVP, ya que permite a los clientes planificar fechas de finalización de obras.

---

**Última actualización:** Diciembre 2024





