# 🔍 Script de Validación Final - GROWS

## Descripción
Script de validación que conecta a la base de datos y hace un conteo de todas las tablas principales para verificar que el sistema está funcionando correctamente.

## Archivo
`apps/web/scripts/sanity-check.ts`

## Cómo ejecutarlo

### Opción 1: Con Node.js (recomendado)
```bash
cd apps/web
node scripts/sanity-check.ts
```

### Opción 2: Con ts-node (si tienes TypeScript instalado)
```bash
cd apps/web
npx ts-node scripts/sanity-check.ts
```

### Opción 3: Con npm script (si está configurado)
```bash
cd apps/web
npm run sanity-check
```

## Qué hace el script

1. **Conecta a la base de datos** usando Prisma Client
2. **Cuenta registros** en todas las tablas principales:
   - Organizations
   - Obras
   - Tareas
   - Socios
   - Eventos
   - Roadmap Objetivos
   - Roadmap Grupos
   - Roadmap Tareas
   - Notificaciones (si existe)
3. **Muestra un resumen** con todos los conteos
4. **Cierra la conexión** correctamente

## Salida esperada

```
🔍 Iniciando validación de la base de datos...

📊 Organizations: 0
🏗️  Obras: 0
📋 Tareas: 0
👥 Socios: 0
📅 Eventos: 0
🎯 Roadmap Objetivos: 0
📁 Roadmap Grupos: 0
✅ Roadmap Tareas: 0
🔔 Notificaciones: Tabla no existe aún

✅ Validación completada exitosamente!

📈 Resumen:
   - Total de organizaciones: 0
   - Total de obras: 0
   - Total de tareas: 0
   - Total de socios: 0
   - Total de eventos: 0
   - Total roadmap objetivos: 0
   - Total roadmap grupos: 0
   - Total roadmap tareas: 0

🔌 Conexión a la base de datos cerrada.
```

## Requisitos

- Node.js instalado
- Base de datos Supabase configurada y accesible
- Variables de entorno configuradas (DATABASE_URL)
- Prisma Client generado (`npx prisma generate`)

## Uso en CI/CD

Este script es ideal para:
- Verificar que las migraciones se aplicaron correctamente
- Validar que el sistema está funcionando después de un deploy
- Detectar problemas de conectividad con la base de datos
- Auditoría de datos en producción

## Troubleshooting

Si el script falla:
1. Verifica que `DATABASE_URL` esté configurada
2. Asegúrate de que Prisma Client esté generado
3. Verifica la conectividad a Supabase
4. Revisa los logs de error en la consola
