# Informe: Configuración del script `dev` para ejecutar la Landing

## Problema identificado

Al ejecutar `pnpm dev` (o `npm run dev`) desde la raíz del proyecto, no se abría la landing page como se esperaba.

### Causa raíz

El `package.json` en la raíz del proyecto tenía el siguiente script:
```json
"dev": "next dev"
```

Este script intentaba ejecutar Next.js directamente en la raíz, pero:
- **No existe una aplicación Next.js en la raíz del proyecto**
- La landing page está ubicada en `apps/landing/`
- El proyecto es un **monorepo** con pnpm workspaces
- El script no estaba apuntando a la aplicación correcta

### Estructura del proyecto

```
GROWS_COPIA/
├── package.json          # Script "dev" apuntaba incorrectamente
├── apps/
│   ├── landing/         # ✅ Landing page (aquí debería ejecutarse)
│   │   ├── package.json
│   │   └── src/
│   └── web/            # Otra aplicación del monorepo
└── pnpm-workspace.yaml # Configuración del workspace
```

## Solución implementada

Se modificó el `package.json` raíz para que el script `dev` ejecute la landing page usando el filtro de pnpm workspaces:

### Cambios realizados

**Antes:**
```json
"dev": "next dev"
```

**Después:**
```json
"dev": "pnpm --filter apps/landing dev",
"dev:landing": "pnpm --filter apps/landing dev",
"dev:web": "pnpm --filter apps/web dev"
```

### Explicación de la solución

1. **`pnpm --filter apps/landing dev`**: Ejecuta el script `dev` del paquete `apps/landing` desde cualquier ubicación del monorepo
2. **Scripts adicionales**: Se agregaron scripts específicos para mayor claridad:
   - `dev:landing`: Ejecuta específicamente la landing
   - `dev:web`: Ejecuta la aplicación web (por si se necesita)

## Cómo usar

Ahora, al ejecutar desde la raíz del proyecto:

```bash
# Ejecuta la landing page (comportamiento por defecto)
pnpm dev

# O específicamente:
pnpm dev:landing

# Para ejecutar la app web:
pnpm dev:web
```

## Verificación

✅ El script `dev` ahora apunta correctamente a `apps/landing`  
✅ Se mantiene compatibilidad con el workspace de pnpm  
✅ Se agregaron scripts específicos para mayor flexibilidad  

## Notas adicionales

- El proyecto usa **pnpm workspaces** para manejar múltiples aplicaciones
- La landing page está en `apps/landing` y usa Next.js 14 con next-intl para internacionalización
- El puerto por defecto será el que configure Next.js (generalmente `http://localhost:3000`)

---
*Informe generado el: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
