'use client';

import Image from 'next/image';

interface ImagenTareaProps {
  codigoTarea: string;
  className?: string;
  alt?: string;
}

// Mapeo de códigos de tarea a nombres de imagen
const mapeoImagenes: Record<string, string> = {
  'R': 'Replanteo',
  'F': 'Fundacion', 
  'M': 'Mamposteria',
  'H': 'Hormigon',
  'S': 'Suelo',
  'C': 'Cubierta',
  'RV': 'Revoque',
  'EL': 'Electricidad',
  'PL': 'Plomeria',
  'TE': 'Terminaciones'
};

// Función para extraer el prefijo del código de tarea
const obtenerPrefijoTarea = (codigo: string): string => {
  // Manejar casos especiales de dos letras
  if (codigo.startsWith('RV')) return 'RV';
  if (codigo.startsWith('EL')) return 'EL';
  if (codigo.startsWith('PL')) return 'PL';
  if (codigo.startsWith('TE')) return 'TE';
  
  // Para códigos de una letra
  const prefijo = codigo.match(/^[A-Z]+/)?.[0] || '';
  return prefijo;
};

export function ImagenTarea({ codigoTarea, className = '', alt }: ImagenTareaProps) {
  const prefijo = obtenerPrefijoTarea(codigoTarea);
  const nombreImagen = mapeoImagenes[prefijo] || 'Obra gris'; // Fallback a obra gris
  const rutaImagen = `/images/${nombreImagen}.png`;
  
  const altText = alt || `Imagen de ${nombreImagen.toLowerCase()} para tarea ${codigoTarea}`;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={rutaImagen}
        alt={altText}
        width={200}
        height={150}
        className="object-contain max-w-full h-auto rounded-lg shadow-sm"
        onError={(e) => {
          // Si la imagen específica falla, usar obra gris como fallback
          const target = e.target as HTMLImageElement;
          target.src = '/images/Obra gris.png';
        }}
      />
    </div>
  );
}

// Componente adicional para mostrar solo el ícono pequeño
export function IconoTarea({ codigoTarea, className = '' }: { codigoTarea: string; className?: string }) {
  const prefijo = obtenerPrefijoTarea(codigoTarea);
  const nombreImagen = mapeoImagenes[prefijo] || 'Obra gris';
  const rutaImagen = `/images/${nombreImagen}.png`;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={rutaImagen}
        alt={`${nombreImagen} icon`}
        width={32}
        height={32}
        className="object-contain rounded"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/images/Obra gris.png';
        }}
      />
    </div>
  );
}

// Hook para obtener información de la imagen
export function useImagenTarea(codigoTarea: string) {
  const prefijo = obtenerPrefijoTarea(codigoTarea);
  const nombreImagen = mapeoImagenes[prefijo] || 'Obra gris';
  const rutaImagen = `/images/${nombreImagen}.png`;
  
  return {
    prefijo,
    nombreImagen,
    rutaImagen,
    tieneImagenEspecifica: mapeoImagenes[prefijo] !== undefined
  };
}
