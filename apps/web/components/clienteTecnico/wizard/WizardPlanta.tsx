'use client';

import { useState } from 'react';
import { 
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Ruler,
  Home,
  Bath,
  ChefHat,
  Sofa,
  Car,
  TreePine,
  Square,
  Plus,
  Minus,
  Trash2,
  Save,
  Move,
  Edit3
} from 'lucide-react';
import { ModalDimensionesAmbiente } from './ModalDimensionesAmbiente';
import { ModalAmbientePersonalizado } from './ModalAmbientePersonalizado';
import { PlanoInteractivoFabric } from './PlanoInteractivoFabric';

interface DimensionesPlanta {
  ancho: number;
  largo: number;
  superficie: number;
}

interface Ambiente {
  id: string;
  tipo: string;
  cantidad: number;
  superficie?: number;
}

interface EspacioAdicional {
  id: string;
  tipo: string;
  seleccionado: boolean;
}

interface PlanoBloque {
  id: string;
  tipo: string;
  nombre: string;
  color: string;
  x: number;
  y: number;
  ancho: number;
  largo: number;
  superficie: number;
  isDragging?: boolean;
}

interface PlantaData {
  numero: number;
  nombre: string;
  dimensiones: DimensionesPlanta;
  ambientes: Ambiente[];
  espacios_adicionales: EspacioAdicional[];
  bloques: PlanoBloque[];
}

interface WizardPlantaProps {
  data: PlantaData;
  onChange: (data: PlantaData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLastPlanta: boolean;
}

export function WizardPlanta({ data, onChange, onNext, onPrevious, isLastPlanta }: WizardPlantaProps) {
  const [activeTab, setActiveTab] = useState<'plano'>('plano');
  const [selectedBlock, setSelectedBlock] = useState<PlanoBloque | null>(null);
  const [showDimensionesModal, setShowDimensionesModal] = useState(false);
  const [showAmbientePersonalizadoModal, setShowAmbientePersonalizadoModal] = useState(false);
  const [selectedAmbienteType, setSelectedAmbienteType] = useState<{id: string, nombre: string, color: string} | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<PlanoBloque | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const tiposAmbientes = [
    { id: 'AMB001', label: 'Dormitorios', icon: Home, unidad: 'unidades' },
    { id: 'AMB002', label: 'Baños', icon: Bath, unidad: 'unidades' },
    { id: 'AMB003', label: 'Cocinas', icon: ChefHat, unidad: 'unidades' },
    { id: 'AMB004', label: 'Estar/Comedor', icon: Sofa, unidad: 'unidades' },
    { id: 'AMB005', label: 'Lavadero', icon: Square, unidad: 'unidades' }
  ];

  const tiposEspacios = [
    { id: 'AMB006', label: 'Garage', icon: Car },
    { id: 'AMB007', label: 'Quincho', icon: TreePine },
    { id: 'AMB008', label: 'Galería', icon: Square },
    { id: 'AMB009', label: 'Balcón', icon: Square },
    { id: 'AMB010', label: 'Terraza', icon: Square },
    { id: 'AMB011', label: 'Patio', icon: Square }
  ];

  // Tipos de ambientes disponibles para el plano
  const tiposAmbientesPlano = [
    { id: 'AMB001', nombre: 'Dormitorio', color: 'bg-blue-400' },
    { id: 'AMB002', nombre: 'Baño', color: 'bg-green-400' },
    { id: 'AMB003', nombre: 'Cocina', color: 'bg-orange-400' },
    { id: 'AMB004', nombre: 'Estar', color: 'bg-purple-400' },
    { id: 'AMB005', nombre: 'Circulación', color: 'bg-gray-400' },
    { id: 'AMB006', nombre: 'Garage', color: 'bg-slate-400' },
    { id: 'AMB007', nombre: 'Quincho', color: 'bg-amber-400' },
    { id: 'AMB008', nombre: 'Galería', color: 'bg-cyan-400' },
    { id: 'AMB009', nombre: 'Balcón', color: 'bg-teal-400' },
    { id: 'AMB010', nombre: 'Terraza', color: 'bg-lime-400' },
    { id: 'AMB011', nombre: 'Patio', color: 'bg-emerald-400' }
  ];

  const updateDimensiones = (campo: 'ancho' | 'largo', valor: number) => {
    const nuevasDimensiones = { ...data.dimensiones, [campo]: valor };
    nuevasDimensiones.superficie = nuevasDimensiones.ancho * nuevasDimensiones.largo;
    onChange({ ...data, dimensiones: nuevasDimensiones });
  };

  const updateAmbiente = (tipo: string, cantidad: number) => {
    const ambientesActualizados = data.ambientes.filter(a => a.tipo !== tipo);
    if (cantidad > 0) {
      ambientesActualizados.push({ id: tipo, tipo, cantidad });
    }
    onChange({ ...data, ambientes: ambientesActualizados });
  };

  const toggleEspacioAdicional = (tipo: string) => {
    const espaciosActualizados = data.espacios_adicionales.map(esp => 
      esp.tipo === tipo ? { ...esp, seleccionado: !esp.seleccionado } : esp
    );
    onChange({ ...data, espacios_adicionales: espaciosActualizados });
  };

  const handleAmbienteClick = (tipoAmbiente: {id: string, nombre: string, color: string}) => {
    setSelectedAmbienteType(tipoAmbiente);
    setShowDimensionesModal(true);
  };

  const addBloque = (ancho: number, largo: number) => {
    if (!selectedAmbienteType) return;

    const nuevoBloque: PlanoBloque = {
      id: `bloque_${Date.now()}`,
      tipo: selectedAmbienteType.id,
      nombre: selectedAmbienteType.nombre,
      color: selectedAmbienteType.color,
      x: Math.random() * Math.max(1, data.dimensiones.ancho - ancho),
      y: Math.random() * Math.max(1, data.dimensiones.largo - largo),
      ancho,
      largo,
      superficie: ancho * largo
    };
    onChange({ ...data, bloques: [...data.bloques, nuevoBloque] });
    setSelectedAmbienteType(null);
  };

  const handleAmbientePersonalizado = (nombre: string, color: string, id: string) => {
    const nuevoTipoAmbiente = { id, nombre, color };
    setSelectedAmbienteType(nuevoTipoAmbiente);
    setShowDimensionesModal(true);
  };

  const updateBloque = (bloqueId: string, updates: Partial<PlanoBloque>) => {
    const bloquesActualizados = data.bloques.map(bloque => 
      bloque.id === bloqueId ? { ...bloque, ...updates } : bloque
    );
    onChange({ ...data, bloques: bloquesActualizados });
  };

  const deleteBloque = (bloqueId: string) => {
    const bloquesActualizados = data.bloques.filter(bloque => bloque.id !== bloqueId);
    onChange({ ...data, bloques: bloquesActualizados });
  };

  // Funciones de drag & drop
  const handleMouseDown = (e: React.MouseEvent, bloque: PlanoBloque) => {
    e.preventDefault();
    setDraggedBlock(bloque);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedBlock) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(data.dimensiones.ancho - draggedBlock.ancho, (e.clientX - rect.left - dragOffset.x) / rect.width * data.dimensiones.ancho));
    const y = Math.max(0, Math.min(data.dimensiones.largo - draggedBlock.largo, (e.clientY - rect.top - dragOffset.y) / rect.height * data.dimensiones.largo));
    
    updateBloque(draggedBlock.id, { x, y });
  };

  const handleMouseUp = () => {
    setDraggedBlock(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Función de snap automático
  const snapToGrid = (value: number, gridSize: number = 0.5) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const renderDimensiones = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <Ruler className="h-5 w-5 text-blue-600" />
            <span>Ancho (metros)</span>
          </label>
          <input
            type="number"
            value={data.dimensiones.ancho}
            onChange={(e) => updateDimensiones('ancho', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            placeholder="0.00"
            step="0.1"
            min="1"
          />
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <Ruler className="h-5 w-5 text-green-600" />
            <span>Largo (metros)</span>
          </label>
          <input
            type="number"
            value={data.dimensiones.largo}
            onChange={(e) => updateDimensiones('largo', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            placeholder="0.00"
            step="0.1"
            min="1"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Superficie Total</h3>
        <div className="text-3xl font-bold text-blue-600">
          {data.dimensiones.superficie.toFixed(2)} m²
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Calculada automáticamente: {data.dimensiones.ancho}m × {data.dimensiones.largo}m
        </p>
      </div>
    </div>
  );

  const renderAmbientes = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiposAmbientes.map((tipo) => {
          const ambiente = data.ambientes.find(a => a.tipo === tipo.id);
          const cantidad = ambiente?.cantidad || 0;
          const Icon = tipo.icon;

          return (
            <div key={tipo.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{tipo.label}</h4>
                    <p className="text-xs text-gray-500">ID: {tipo.id}</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">{cantidad}</div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateAmbiente(tipo.id, Math.max(0, cantidad - 1))}
                  className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => updateAmbiente(tipo.id, parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  min="0"
                />
                <button
                  onClick={() => updateAmbiente(tipo.id, cantidad + 1)}
                  className="p-1 bg-green-100 hover:bg-green-200 text-green-600 rounded"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Total de Ambientes</h4>
        <div className="text-xl font-bold text-blue-600">
          {data.ambientes.reduce((total, amb) => total + amb.cantidad, 0)} ambientes
        </div>
      </div>
    </div>
  );

  const renderEspaciosAdicionales = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tiposEspacios.map((espacio) => {
          const espacioData = data.espacios_adicionales.find(e => e.tipo === espacio.id);
          const seleccionado = espacioData?.seleccionado || false;
          const Icon = espacio.icon;

          return (
            <button
              key={espacio.id}
              onClick={() => toggleEspacioAdicional(espacio.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                seleccionado
                  ? 'bg-green-50 border-green-500 shadow-md'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white rounded-lg">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                {seleccionado && (
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{espacio.label}</h4>
              <p className="text-xs text-gray-500 mt-1">ID: {espacio.id}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Espacios Seleccionados</h4>
        <div className="text-sm text-gray-600">
          {data.espacios_adicionales.filter(e => e.seleccionado).length} de {tiposEspacios.length} espacios
        </div>
      </div>
    </div>
  );

  const renderPlano = () => (
    <PlanoInteractivoFabric
      data={data}
      onUpdate={(updatedData) => {
        // Actualizar datos del plano
        onChange(updatedData);
      }}
      onNext={onNext}
      onPrevious={onPrevious}
      isLastPlanta={isLastPlanta}
    />
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#1A202C' }}>
                {data.nombre} - Planta {data.numero}
              </h2>
              <p className="text-gray-600">Configuración detallada de la planta</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Superficie Total</div>
              <div className="text-xl font-bold" style={{ color: '#FEEB70' }}>
                {data.dimensiones.superficie.toFixed(2)} m²
              </div>
            </div>
          </div>
        </div>

        {/* Content - Solo Plano */}
        <div className="p-0">
          {renderPlano()}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="flex justify-between">
            <button
              onClick={onPrevious}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm"
              style={{ 
                color: '#1A202C',
                backgroundColor: '#FEEB70'
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={onNext}
              className="flex items-center space-x-2 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
              style={{ backgroundColor: '#22C55E' }}
            >
              <span>{isLastPlanta ? 'Finalizar Plantas' : 'Siguiente Planta'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
