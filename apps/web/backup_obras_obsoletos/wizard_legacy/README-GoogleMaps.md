# Integración de Google Maps

## Estado Actual
- ✅ Componente `MapaUbicacion` creado con placeholder
- ✅ Interfaz de usuario completa
- ✅ Funcionalidad de geocodificación simulada
- ⏳ Integración real con Google Maps API pendiente

## Para Completar la Integración

### 1. Configurar Google Maps API
```bash
# Agregar a .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 2. Instalar dependencias
```bash
npm install @googlemaps/js-api-loader
# o
yarn add @googlemaps/js-api-loader
```

### 3. Actualizar MapaUbicacion.tsx
```typescript
import { Loader } from '@googlemaps/js-api-loader';

// Reemplazar la función handleGeocode con:
const handleGeocode = async () => {
  if (!address.trim()) return;
  
  try {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    const google = await loader.load();
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        setCoordinates({ 
          lat: location.lat(), 
          lng: location.lng() 
        });
      }
    });
  } catch (error) {
    console.error('Error en geocodificación:', error);
  }
};
```

### 4. Agregar mapa real
```typescript
// En el div del mapa, agregar:
<div 
  id="map" 
  className="h-96 w-full rounded-lg"
  ref={mapRef}
/>
```

### 5. Inicializar el mapa
```typescript
useEffect(() => {
  if (coordinates && mapRef.current) {
    const map = new google.maps.Map(mapRef.current, {
      center: coordinates,
      zoom: 15
    });
    
    new google.maps.Marker({
      position: coordinates,
      map: map,
      title: address
    });
  }
}, [coordinates]);
```

## Funcionalidades Implementadas
- ✅ Modal de selección de ubicación
- ✅ Campo de búsqueda de dirección
- ✅ Visualización de coordenadas
- ✅ Confirmación de ubicación
- ✅ Integración con el wizard principal

## Funcionalidades Pendientes
- ⏳ Mapa interactivo real de Google Maps
- ⏳ Geocodificación real con Google API
- ⏳ Marcador arrastrable en el mapa
- ⏳ Autocompletado de direcciones
- ⏳ Validación de direcciones
