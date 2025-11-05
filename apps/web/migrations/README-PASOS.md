# 📋 Guía de Ejecución por Pasos - Migración cuadrilla_socios

## ⚠️ IMPORTANTE: Ejecutar los pasos en orden, uno por uno

Ejecuta cada paso en el SQL Editor de Supabase y verifica que se complete correctamente antes de pasar al siguiente.

---

## 📝 PASO 1: Crear tabla básica
**Archivo:** `create-cuadrilla-socios-PASO-1-crear-tabla.sql`

✅ Verifica que la tabla se creó correctamente

---

## 📝 PASO 2: Agregar Foreign Keys
**Archivo:** `create-cuadrilla-socios-PASO-2-foreign-keys.sql`

✅ Verifica que las foreign keys se crearon correctamente

---

## 📝 PASO 3: Agregar Check Constraint
**Archivo:** `create-cuadrilla-socios-PASO-3-check-constraint.sql`

✅ Verifica que el constraint de rol se creó correctamente

---

## 📝 PASO 4: Crear Índices
**Archivo:** `create-cuadrilla-socios-PASO-4-indices.sql`

✅ Verifica que todos los índices se crearon

---

## 📝 PASO 5: Crear Función y Trigger
**Archivo:** `create-cuadrilla-socios-PASO-5-funcion-trigger.sql`

✅ Verifica que el trigger se creó correctamente

---

## 📝 PASO 6: Agregar Comentarios (Opcional)
**Archivo:** `create-cuadrilla-socios-PASO-6-comentarios.sql`

✅ Este paso es opcional, solo para documentación

---

## 📝 PASO 7: Migrar Datos Existentes (Opcional)
**Archivo:** `create-cuadrilla-socios-PASO-7-migrar-datos.sql`

⚠️ **Este paso es OPCIONAL** - Solo ejecutar si quieres migrar relaciones existentes desde `cuadrillas.encargado` a `cuadrilla_socios`

---

## 📝 PASO 8: Verificación Final
**Archivo:** `create-cuadrilla-socios-PASO-8-verificacion.sql`

✅ Ejecutar al final para verificar que todo está correcto

---

## 🔍 Si hay errores

### Error en PASO 1:
- Verifica que las tablas `cuadrillas` y `socios` existen
- Verifica permisos de usuario

### Error en PASO 2:
- Verifica que las tablas referenciadas existen
- Verifica que los IDs sean UUID válidos

### Error en PASO 3:
- Este paso debería funcionar si PASO 1 se completó correctamente

### Error en PASO 4:
- Verifica que la tabla existe (PASO 1)
- Verifica que la columna `rol` existe en la tabla

### Error en PASO 7:
- Este paso es opcional, puedes saltarlo si no quieres migrar datos
- Si hay errores, revisa los logs (RAISE NOTICE) para ver qué está pasando

---

## ✅ Verificación Rápida

Después de ejecutar todos los pasos, ejecuta esto para verificar:

```sql
-- Verificar que la tabla existe y tiene las columnas correctas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cuadrilla_socios'
ORDER BY ordinal_position;

-- Debe mostrar: id, cuadrilla_id, socio_id, rol, activo, created_at, updated_at
```

---

## 🎯 Resultado Esperado

Al finalizar todos los pasos, deberías tener:

- ✅ Tabla `cuadrilla_socios` creada
- ✅ Foreign keys a `cuadrillas` y `socios`
- ✅ Check constraint para `rol`
- ✅ Índices para búsquedas rápidas
- ✅ Trigger para `updated_at` automático
- ✅ (Opcional) Relaciones migradas desde datos existentes

