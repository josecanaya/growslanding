'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (!googleMapsPromise) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
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

interface DireccionValue {
  direccion: string;
  lat?: number;
  lng?: number;
}

interface DireccionAutocompleteProps {
  value?: string;
  onChange: (value: DireccionValue) => void;
  placeholder?: string;
  className?: string;
}

interface Prediction {
  description: string;
  place_id: string;
}

const BASE_INPUT_CLASSES =
  'w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC]';

export default function DireccionAutocomplete({
  value,
  onChange,
  placeholder = 'Calle, numero, ciudad',
  className,
}: DireccionAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value ?? '');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const debounceRef = useRef<number>();
  const blurTimeoutRef = useRef<number>();

  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMapsApi()
      .then((googleMaps) => {
        if (!isMounted) return;
        autocompleteServiceRef.current = new googleMaps.maps.places.AutocompleteService();
        placesServiceRef.current = new googleMaps.maps.places.PlacesService(document.createElement('div'));
        setIsReady(true);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setError(err.message);
      });

    return () => {
      isMounted = false;
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const fetchPredictions = useCallback(
    (query: string) => {
      if (!autocompleteServiceRef.current || !query.trim()) {
        setPredictions([]);
        return;
      }

      setIsRequesting(true);
      autocompleteServiceRef.current.getPlacePredictions({ input: query }, (results: Prediction[] | null) => {
        setIsRequesting(false);
        if (!results) {
          setPredictions([]);
          return;
        }
        setPredictions(results.slice(0, 5));
      });
    },
    []
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    onChange({ direccion: nextValue });

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!nextValue || nextValue.trim().length < 3) {
      setPredictions([]);
      return;
    }

    debounceRef.current = window.setTimeout(() => fetchPredictions(nextValue), 250);
  };

  const resolvePlaceDetails = (prediction: Prediction) => {
    if (!placesServiceRef.current) {
      onChange({ direccion: prediction.description });
      return;
    }

    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['formatted_address', 'geometry'] },
      (place: any, status: string) => {
        if (status !== 'OK' || !place) {
          onChange({ direccion: prediction.description });
          return;
        }

        const location = place.geometry?.location;
        onChange({
          direccion: place.formatted_address ?? prediction.description,
          lat: location?.lat?.(),
          lng: location?.lng?.(),
        });
      }
    );
  };

  const handlePredictionClick = (prediction: Prediction) => {
    setInputValue(prediction.description);
    setPredictions([]);
    resolvePlaceDetails(prediction);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => setPredictions([]), 150);
  };

  const handleFocus = () => {
    if (predictions.length === 0 && inputValue.trim().length >= 3) {
      fetchPredictions(inputValue);
    }
  };

  return (
    <div className="relative">
      {error && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <div className="relative flex items-center gap-2">
        <MapPin className="absolute left-3 h-4 w-4 text-gray-400" />
        <input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(BASE_INPUT_CLASSES, 'pl-9', className)}
        />
        {isRequesting && <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-gray-400" />}
      </div>

      {predictions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <ul>
            {predictions.map((prediction) => (
              <li
                key={prediction.place_id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handlePredictionClick(prediction)}
                className="cursor-pointer px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                {prediction.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
