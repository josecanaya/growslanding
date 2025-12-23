'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

declare global {
  interface Window {
    google: any;
  }
}

let googleMapsPromise: Promise<any> | null = null;

function loadGoogleMapsApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps solo esta disponible en el navegador'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (!googleMapsPromise) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCIzK1ydM-ADJW_yUOpNXJpr8Oh1u5eUwo';
    if (!apiKey) {
      return Promise.reject(new Error('Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'));
    }

    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}

type Coordinates = { lat: number; lng: number };

// Monumento Nacional a la Bandera, Rosario, Santa Fe, Argentina
const DEFAULT_POSITION: Coordinates = { lat: -32.9468, lng: -60.6393 };

interface ModalMapaProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: { direccion: string; lat: number; lng: number }) => void;
  initialDireccion?: string;
  initialLat?: number;
  initialLng?: number;
}

export default function ModalMapa({
  open,
  onClose,
  onConfirm,
  initialDireccion,
  initialLat,
  initialLng,
}: ModalMapaProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const listenersRef = useRef<any[]>([]);

  const [direccion, setDireccion] = useState(initialDireccion ?? '');
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedLat = typeof initialLat === 'number' ? initialLat : DEFAULT_POSITION.lat;
  const resolvedLng = typeof initialLng === 'number' ? initialLng : DEFAULT_POSITION.lng;

  const cleanupListeners = () => {
    listenersRef.current.forEach((listener) => listener?.remove?.());
    listenersRef.current = [];
  };

  const reverseGeocode = useCallback(
    (coords: Coordinates) => {
      if (!geocoderRef.current) return;
      setIsGeocoding(true);

      geocoderRef.current.geocode({ location: coords }, (results: any, status: string) => {
        if (status === 'OK' && results?.length) {
          setDireccion(results[0].formatted_address ?? '');
        }
        setIsGeocoding(false);
      });
    },
    []
  );

  const updatePosition = useCallback(
    (coords: Coordinates) => {
      setPosition(coords);
      reverseGeocode(coords);
    },
    [reverseGeocode]
  );

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setError(null);
    setIsLoadingMap(true);
    setDireccion(initialDireccion ?? '');
    const startingPosition: Coordinates = { lat: resolvedLat, lng: resolvedLng };
    setPosition(startingPosition);

    const waitForContainer = () =>
      new Promise<HTMLDivElement>((resolve) => {
        const check = () => {
          if (!isMounted) return;
          if (mapContainerRef.current) {
            resolve(mapContainerRef.current);
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });

    Promise.all([loadGoogleMapsApi(), waitForContainer()])
      .then(([googleMaps, container]) => {
        if (!isMounted) return;

        mapRef.current = new googleMaps.maps.Map(container, {
          center: startingPosition,
          zoom: 14,
          streetViewControl: false,
          mapTypeControl: false,
        });

        if (!markerRef.current) {
          markerRef.current = new googleMaps.maps.Marker({
            map: mapRef.current,
            position: startingPosition,
            draggable: true,
          });
        } else {
          markerRef.current.setMap(mapRef.current);
          markerRef.current.setPosition(startingPosition);
        }

        geocoderRef.current = new googleMaps.maps.Geocoder();
        cleanupListeners();

        const dragListener = googleMaps.maps.event.addListener(markerRef.current, 'dragend', () => {
          const nextPosition = markerRef.current.getPosition();
          if (!nextPosition) return;
          updatePosition({ lat: nextPosition.lat(), lng: nextPosition.lng() });
        });

        const clickListener = googleMaps.maps.event.addListener(mapRef.current, 'click', (event: any) => {
          if (!event.latLng) return;
          const coords = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          markerRef.current?.setPosition(event.latLng);
          updatePosition(coords);
        });

        listenersRef.current = [dragListener, clickListener];

        if (!initialDireccion) {
          reverseGeocode(startingPosition);
        }
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingMap(false);
      });

    return () => {
      isMounted = false;
      cleanupListeners();
    };
  }, [open, initialDireccion, resolvedLat, resolvedLng, reverseGeocode, updatePosition]);

  useEffect(() => {
    if (open) return;
    cleanupListeners();
    markerRef.current = null;
    mapRef.current = null;
  }, [open]);

  const handleConfirm = () => {
    if (!position) return;
    onConfirm({
      direccion: direccion || initialDireccion || '',
      lat: position.lat,
      lng: position.lng,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl bg-white max-w-[calc(100vw-2rem)] mx-4">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Selecciona la ubicacion</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">Arrastra el pin al punto exacto y confirma para guardar la direccion.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div ref={mapContainerRef} className="h-64 md:h-80 w-full rounded-lg border border-gray-200 bg-white overflow-hidden" />
          {(isLoadingMap || isGeocoding) && (
            <p className="text-sm text-gray-500">Cargando mapa...</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {direccion && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              {direccion}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2.5 text-xs md:text-sm font-medium text-gray-700 transition hover:bg-gray-50 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!position}
            className="w-full sm:w-auto rounded-lg bg-[#0052CC] px-4 py-2.5 text-xs md:text-sm font-semibold text-white transition hover:bg-[#003E99] disabled:opacity-60 min-h-[44px]"
          >
            Confirmar ubicacion
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
