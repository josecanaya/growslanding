import { useState } from "react";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const DEFAULT_HEADERS = {
  "User-Agent": "GROWS-App",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
};

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

export function useGeocoding() {
  const [isLoading, setIsLoading] = useState(false);

  const searchAddresses = async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 3) return [];

    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "5",
      countrycodes: "ar",
    });

    setIsLoading(true);
    try {
      const response = await fetch(`${NOMINATIM_URL}/search?${params.toString()}`, {
        headers: DEFAULT_HEADERS,
      });

      if (!response.ok) {
        console.error("[useGeocoding] Error buscando direcciones:", response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      return data.map((item: any) => item.display_name) as string[];
    } catch (error) {
      console.error("[useGeocoding] Error buscando direcciones:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
    if (!address || address.trim().length < 3) return null;

    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      addressdetails: "1",
    });

    setIsLoading(true);
    try {
      const response = await fetch(`${NOMINATIM_URL}/search?${params.toString()}`, {
        headers: DEFAULT_HEADERS,
      });

      if (!response.ok) {
        console.error("[useGeocoding] Error geocodificando dirección:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: result.display_name,
      };
    } catch (error) {
      console.error("[useGeocoding] Error geocodificando dirección:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchAddresses,
    geocodeAddress,
    isLoading,
  };
}
