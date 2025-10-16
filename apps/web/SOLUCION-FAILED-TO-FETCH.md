# Solución para Error "Failed to fetch" en Next.js 15.5.4

## 🚨 Problema Identificado

Error `TypeError: Failed to fetch` en Next.js 15.5.4 con Webpack. Este error puede tener varias causas comunes.

## 🔍 Diagnóstico

### 1. Usar la Herramienta de Diagnóstico
Visita `/diagnostic` para ejecutar diagnósticos automáticos:
- Estado de red
- Prueba de endpoints API
- Información del navegador
- Detección de problemas comunes

### 2. Verificaciones Manuales

#### A. Estado de Red
```javascript
// Verificar conectividad
console.log('Online:', navigator.onLine);
console.log('User Agent:', navigator.userAgent);
```

#### B. Endpoints API
```bash
# Probar endpoints manualmente
curl http://localhost:3000/api/health
curl http://localhost:3000/api/obras
```

#### C. Console del Navegador
- Abrir DevTools (F12)
- Ir a Console
- Buscar errores relacionados con fetch
- Verificar Network tab para requests fallidos

## 🛠️ Soluciones Comunes

### 1. Problema de CORS
**Síntomas**: Error en requests cross-origin
**Solución**:
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### 2. API Routes No Configuradas
**Síntomas**: 404 en endpoints API
**Solución**:
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### 3. Variables de Entorno
**Síntomas**: Error en requests que requieren configuración
**Solución**:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=your_database_url
```

### 4. Cache del Navegador
**Síntomas**: Requests que funcionan en incógnito pero no en navegador normal
**Solución**:
- Limpiar cache del navegador
- Hard refresh (Ctrl+Shift+R)
- Deshabilitar cache en DevTools

### 5. Problema de HTTPS/HTTP
**Síntomas**: Error en producción pero no en desarrollo
**Solución**:
```javascript
// Usar protocolo relativo
const response = await fetch('/api/endpoint'); // ✅ Correcto
const response = await fetch('http://localhost:3000/api/endpoint'); // ❌ Puede fallar
```

### 6. Timeout de Requests
**Síntomas**: Requests que tardan mucho o fallan
**Solución**:
```typescript
// Con timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

try {
  const response = await fetch('/api/endpoint', {
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  clearTimeout(timeoutId);
  throw error;
}
```

## 🔧 Herramientas de Debugging

### 1. Interceptor de Fetch
```javascript
// Interceptar todos los fetch para debugging
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch request:', args);
  try {
    const response = await originalFetch(...args);
    console.log('Fetch response:', response);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
```

### 2. Network Tab Analysis
1. Abrir DevTools → Network
2. Reproducir el error
3. Buscar requests fallidos (rojos)
4. Verificar:
   - Status code
   - Response headers
   - Request headers
   - Timing

### 3. Console Errors
```javascript
// Capturar errores globales
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

## 📋 Checklist de Verificación

- [ ] Verificar conectividad de red
- [ ] Probar endpoints API manualmente
- [ ] Verificar configuración de CORS
- [ ] Revisar variables de entorno
- [ ] Limpiar cache del navegador
- [ ] Verificar protocolo (HTTP/HTTPS)
- [ ] Revisar console del navegador
- [ ] Probar en modo incógnito
- [ ] Verificar configuración de Next.js
- [ ] Revisar logs del servidor

## 🚀 Solución Rápida

Si el problema persiste, ejecutar:

```bash
# Limpiar cache de Next.js
rm -rf .next
npm run dev

# O con pnpm
pnpm dev

# Limpiar node_modules si es necesario
rm -rf node_modules
npm install
```

## 📞 Soporte Adicional

Si el problema persiste después de seguir estas soluciones:

1. Ejecutar la herramienta de diagnóstico en `/diagnostic`
2. Capturar screenshots de los errores
3. Incluir información del navegador y sistema
4. Proporcionar logs de la consola del navegador
5. Incluir configuración de next.config.js

## 🔗 Enlaces Útiles

- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
