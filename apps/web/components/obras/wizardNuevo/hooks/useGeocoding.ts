'use client';

import { useState, useCallback } from 'react';

interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

export function useGeocoding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geocodificación usando Nominatim (OpenStreetMap) - gratuito
  const geocodeAddress = useCallback(async (address: string): Promise<GeocodeResult | null> => {
    if (!address.trim()) return null;

    setIsLoading(true);
    setError(null);

    try {
      // Agregar timeout para evitar que la petición se quede colgada
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`,
        {
          headers: {
            'User-Agent': 'GROWS-Construction-App',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Nominatim API error: ${response.status} ${response.statusText}`);
        setError('Error al buscar la dirección. Intenta nuevamente.');
        return null;
      }

      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0];
        return {
          address: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
      }

      return null;
    } catch (err) {
      // Manejar diferentes tipos de errores
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('La búsqueda tardó demasiado. Intenta con una dirección más específica.');
        } else if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          setError('Error de conexión. Verifica tu conexión a internet.');
        } else {
          setError('Error al buscar la dirección');
        }
      } else {
        setError('Error al buscar la dirección');
      }
      console.error('Error en geocodificación:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reverse geocoding (de coordenadas a dirección)
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Agregar timeout para evitar que la petición se quede colgada
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'GROWS-Construction-App',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Nominatim API error: ${response.status} ${response.statusText}`);
        setError('Error al obtener la dirección. Intenta nuevamente.');
        return null;
      }

      const data = await response.json();

      if (data && data.display_name) {
        return data.display_name;
      }

      return null;
    } catch (err) {
      // Manejar diferentes tipos de errores
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('La operación tardó demasiado. Intenta nuevamente.');
        } else if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          setError('Error de conexión. Verifica tu conexión a internet.');
        } else {
          setError('Error al obtener la dirección');
        }
      } else {
        setError('Error al obtener la dirección');
      }
      console.error('Error en reverse geocoding:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Autocompletado de direcciones
  const searchAddresses = useCallback(async (query: string): Promise<string[]> => {
    if (!query.trim() || query.length < 3) return [];

    try {
      // Agregar timeout para evitar que la petición se quede colgada
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ar`,
        {
          headers: {
            'User-Agent': 'GROWS-Construction-App',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Nominatim API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: any) => item.display_name);
    } catch (err) {
      // Ignorar errores de abort (timeout) y otros errores de red
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.warn('Búsqueda de direcciones cancelada por timeout');
        } else if (err.message.includes('fetch')) {
          console.warn('Error de red al buscar direcciones. Verifica tu conexión a internet.');
        } else {
          console.error('Error en búsqueda de direcciones:', err);
        }
      }
      return []; // Retornar array vacío en caso de error
    }
  }, []);

  return {
    geocodeAddress,
    reverseGeocode,
    searchAddresses,
    isLoading,
    error,
  };
}

