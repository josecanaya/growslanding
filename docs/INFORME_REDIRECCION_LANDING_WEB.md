# Informe: Redirección desde Landing a App Web

## Objetivo

Configurar la landing page para que todos los botones y enlaces redirijan correctamente a la aplicación web principal de GROWS.

## Cambios implementados

### 1. Creación de utilidad centralizada de configuración

**Archivo creado:** `apps/landing/src/lib/config.ts`

Este archivo centraliza la gestión de URLs de la app web:

- **`getAppWebUrl()`**: Obtiene la URL base de la app web
  - Prioriza la variable de entorno `NEXT_PUBLIC_APP_URL`
  - En desarrollo (localhost), detecta automáticamente y usa `http://localhost:3000`
  - En producción, usa el valor por defecto `https://grows.app`

- **`getAppWebUrlFor(path)`**: Construye URLs completas para rutas específicas

- **`APP_WEB_URLS`**: Objeto con URLs comunes predefinidas:
  - `home()`: URL principal
  - `login()`: Página de login (`/auth/login`)
  - `register()`: Página de registro (`/auth/register`)
  - `signup()`: Alias para registro
  - `clienteTecnico()`: Dashboard cliente técnico

### 2. Actualización de componentes

#### Hero Component (`apps/landing/src/components/hero/Hero.tsx`)
- ✅ Botón "Explore GROWS" ahora redirige a `APP_WEB_URLS.home()`
- ✅ Cambiado de `Link` de Next.js a `<a>` para redirección externa
- ✅ Removido import innecesario de `Link`

#### Navigation Component (`apps/landing/src/components/navigation/Navigation.tsx`)
- ✅ Botón "Ingresar" redirige a `APP_WEB_URLS.login()`
- ✅ Botón "Registrarse" redirige a `APP_WEB_URLS.register()`
- ✅ Actualizado tanto en versión desktop como mobile
- ✅ Removida constante `APP_URL` local

#### UserProfiles Component (`apps/landing/src/components/sections/landing/UserProfiles.tsx`)
- ✅ Botones "Sign Up" ahora redirigen a `APP_WEB_URLS.signup()`
- ✅ Removida constante `APP_URL` local

#### PricingSection Component (`apps/landing/src/components/sections/landing/PricingSection.tsx`)
- ✅ Todos los botones de planes (Free, Starter, Pro, Enterprise) redirigen a `APP_WEB_URLS.login()`
- ✅ Removida constante `APP_URL` local

### 3. Configuración de entorno

**Archivo actualizado:** `apps/landing/.env.local`

- ✅ Agregados comentarios explicativos
- ✅ Instrucciones para desarrollo y producción
- ✅ Variable `NEXT_PUBLIC_APP_URL` documentada

## Comportamiento

### En Desarrollo
1. Si `NEXT_PUBLIC_APP_URL` está definida en `.env.local`, se usa ese valor
2. Si no está definida o es localhost, automáticamente detecta y usa `http://localhost:3000`
3. La app web debe estar corriendo en el puerto 3000 (o ajustar la variable de entorno)

### En Producción
- Usa la variable `NEXT_PUBLIC_APP_URL` (actualmente `https://grows.app`)
- Si no está definida, usa el valor por defecto `https://grows.app`

## URLs configuradas

Todos los botones y enlaces ahora redirigen a:

| Componente | Botón/Enlace | Destino |
|------------|--------------|---------|
| Hero | "Explore GROWS" | `/` (home) |
| Navigation | "Ingresar" | `/auth/login` |
| Navigation | "Registrarse" | `/auth/register` |
| UserProfiles | "Sign Up" (ambos tipos) | `/auth/register` |
| PricingSection | "Empezar gratis" | `/auth/login` |
| PricingSection | "Contratar Starter" | `/auth/login` |
| PricingSection | "Contratar Pro" | `/auth/login` |
| PricingSection | "Acceso anticipado" | `/auth/login` |

## Cómo usar en desarrollo

### Opción 1: Automática (recomendada)
1. Comenta o elimina `NEXT_PUBLIC_APP_URL` del `.env.local`
2. La app detectará automáticamente que estás en localhost
3. Redirigirá a `http://localhost:3000`

### Opción 2: Manual
1. En `apps/landing/.env.local`, establece:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
2. Ajusta el puerto si tu app web corre en otro puerto

## Verificación

Para verificar que todo funciona:

1. **Desarrollo:**
   ```bash
   # Terminal 1: Iniciar landing
   pnpm dev:landing
   
   # Terminal 2: Iniciar app web
   pnpm dev:web
   ```

2. **Probar redirecciones:**
   - Click en "Explore GROWS" → debe ir a `http://localhost:3000`
   - Click en "Ingresar" → debe ir a `http://localhost:3000/auth/login`
   - Click en "Registrarse" → debe ir a `http://localhost:3000/auth/register`
   - Click en cualquier botón de plan → debe ir a login

## Ventajas de esta implementación

✅ **Centralizada**: Un solo lugar para gestionar URLs  
✅ **Flexible**: Funciona en desarrollo y producción  
✅ **Mantenible**: Fácil de actualizar rutas  
✅ **Type-safe**: TypeScript ayuda a detectar errores  
✅ **Automática**: Detecta localhost sin configuración extra  

## Notas importantes

- Los enlaces ahora usan `<a>` en lugar de `<Link>` de Next.js porque redirigen a una aplicación diferente
- Si necesitas agregar nuevas rutas, agrégalas a `APP_WEB_URLS` en `config.ts`
- El puerto por defecto en desarrollo es 3000, ajusta si tu configuración es diferente

---
*Informe generado: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
