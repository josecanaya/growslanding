// Ejemplo de uso del componente ImagenTarea

import { ImagenTarea, IconoTarea, useImagenTarea } from './ImagenTarea';

// Ejemplo 1: Imagen completa
function EjemploImagenCompleta() {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Imágenes de Tareas</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center">
          <ImagenTarea codigoTarea="R01" className="mb-2" />
          <p className="text-sm text-gray-600">Replanteo</p>
        </div>
        <div className="text-center">
          <ImagenTarea codigoTarea="H03" className="mb-2" />
          <p className="text-sm text-gray-600">Hormigón</p>
        </div>
        <div className="text-center">
          <ImagenTarea codigoTarea="PL05" className="mb-2" />
          <p className="text-sm text-gray-600">Plomería</p>
        </div>
      </div>
    </div>
  );
}

// Ejemplo 2: Íconos pequeños
function EjemploIconos() {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Íconos de Tareas</h3>
      <div className="flex space-x-4">
        <IconoTarea codigoTarea="M02" className="w-8 h-8" />
        <IconoTarea codigoTarea="EL04" className="w-8 h-8" />
        <IconoTarea codigoTarea="TE06" className="w-8 h-8" />
      </div>
    </div>
  );
}

// Ejemplo 3: Usando el hook
function EjemploConHook() {
  const { nombreImagen, rutaImagen, tieneImagenEspecifica } = useImagenTarea('RV07');
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Información de la Tarea</h3>
      <p>Nombre: {nombreImagen}</p>
      <p>Ruta: {rutaImagen}</p>
      <p>Tiene imagen específica: {tieneImagenEspecifica ? 'Sí' : 'No'}</p>
    </div>
  );
}

export { EjemploImagenCompleta, EjemploIconos, EjemploConHook };
