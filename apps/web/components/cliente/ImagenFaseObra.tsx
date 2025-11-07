'use client';

import Image from 'next/image';

interface ImagenFaseObraProps {
  fase: 'estructura' | 'obra_gris' | 'terminaciones';
  className?: string;
  alt?: string;
}

// Mapeo de fases a nombres de imagen
const mapeoFases: Record<string, string> = {
  'estructura': 'Estructura',
  'obra_gris': 'Obra gris',
  'terminaciones': 'Terminaciones'
};

export function ImagenFaseObra({ fase, className = '', alt }: ImagenFaseObraProps) {
  const nombreImagen = mapeoFases[fase] || 'Obra gris'; // Fallback a obra gris
  const rutaImagen = `/images/${nombreImagen}.png`;
  
  const altText = alt || `Imagen de fase ${fase.replace('_', ' ')}`;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={rutaImagen}
        alt={altText}
        width={400}
        height={250}
        className="object-contain max-w-full h-auto rounded-lg shadow-md"
        priority={false}
        onError={(e) => {
          // Si la imagen específica falla, usar obra gris como fallback
          const target = e.target as HTMLImageElement;
          target.src = '/images/Obra gris.png';
        }}
      />
    </div>
  );
}

// Componente adicional para mostrar solo la imagen sin contenedor
export function ImagenFaseObraSimple({ fase, className = '' }: { fase: string; className?: string }) {
  const nombreImagen = mapeoFases[fase] || 'Obra gris';
  const rutaImagen = `/images/${nombreImagen}.png`;

  return (
    <Image
      src={rutaImagen}
      alt={`Fase ${fase}`}
      width={400}
      height={250}
      className={`object-contain rounded-lg ${className}`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = '/images/Obra gris.png';
      }}
    />
  );
}

// Hook para obtener información de la fase
export function useImagenFase(fase: string) {
  const nombreImagen = mapeoFases[fase] || 'Obra gris';
  const rutaImagen = `/images/${nombreImagen}.png`;
  
  return {
    nombreImagen,
    rutaImagen,
    tieneImagenEspecifica: mapeoFases[fase] !== undefined
  };
}
