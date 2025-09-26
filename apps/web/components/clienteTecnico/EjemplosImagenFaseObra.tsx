// Ejemplo de uso del componente ImagenFaseObra

import { ImagenFaseObra, ImagenFaseObraSimple, useImagenFase } from './ImagenFaseObra';

// Ejemplo 1: Componente completo con contenedor
function EjemploImagenFaseCompleta() {
  const [faseActual, setFaseActual] = useState<'estructura' | 'obra_gris' | 'terminaciones'>('estructura');

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Imágenes de Fases de Obra</h3>
      
      {/* Selector de fase */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Selecciona la fase:</label>
        <select 
          value={faseActual} 
          onChange={(e) => setFaseActual(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="estructura">Estructura</option>
          <option value="obra_gris">Obra Gris</option>
          <option value="terminaciones">Terminaciones</option>
        </select>
      </div>

      {/* Imagen de la fase */}
      <ImagenFaseObra 
        fase={faseActual}
        className="w-full max-w-md mx-auto"
        alt={`Imagen de fase ${faseActual}`}
      />
    </div>
  );
}

// Ejemplo 2: Imagen simple sin contenedor
function EjemploImagenSimple() {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Imágenes Simples</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <ImagenFaseObraSimple 
            fase="estructura" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <p className="mt-2 text-sm">Estructura</p>
        </div>
        <div className="text-center">
          <ImagenFaseObraSimple 
            fase="obra_gris" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <p className="mt-2 text-sm">Obra Gris</p>
        </div>
        <div className="text-center">
          <ImagenFaseObraSimple 
            fase="terminaciones" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <p className="mt-2 text-sm">Terminaciones</p>
        </div>
      </div>
    </div>
  );
}

// Ejemplo 3: Usando el hook
function EjemploConHook() {
  const { nombreImagen, rutaImagen, tieneImagenEspecifica } = useImagenFase('obra_gris');
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Información de la Fase</h3>
      <p>Nombre: {nombreImagen}</p>
      <p>Ruta: {rutaImagen}</p>
      <p>Tiene imagen específica: {tieneImagenEspecifica ? 'Sí' : 'No'}</p>
    </div>
  );
}

// Ejemplo 4: Integración en un selector de fases
function SelectorFasesEjemplo() {
  const [faseSeleccionada, setFaseSeleccionada] = useState<'estructura' | 'obra_gris' | 'terminaciones'>('estructura');

  const fases = [
    { key: 'estructura', label: 'Estructura', desc: 'Cimientos, paredes, estructura básica' },
    { key: 'obra_gris', label: 'Obra Gris', desc: 'Instalaciones, revoques, acabados básicos' },
    { key: 'terminaciones', label: 'Terminaciones', desc: 'Pintura, pisos, aberturas, detalles finales' }
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Selector de Fases</h3>
      
      {/* Botones de fase */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {fases.map((fase) => (
          <button
            key={fase.key}
            onClick={() => setFaseSeleccionada(fase.key as any)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
              faseSeleccionada === fase.key
                ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="font-semibold text-lg mb-1">{fase.label}</div>
            <div className="text-sm opacity-80">{fase.desc}</div>
          </button>
        ))}
      </div>

      {/* Imagen de la fase seleccionada */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <ImagenFaseObra 
          fase={faseSeleccionada}
          className="w-full max-w-md mx-auto"
        />
        <div className="mt-4 text-center">
          <h4 className="text-xl font-semibold">
            {fases.find(f => f.key === faseSeleccionada)?.label}
          </h4>
        </div>
      </div>
    </div>
  );
}

export { EjemploImagenFaseCompleta, EjemploImagenSimple, EjemploConHook, SelectorFasesEjemplo };
