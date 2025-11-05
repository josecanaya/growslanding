'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Eye, 
  Plus,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Tipos de datos
interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  tamaño: number;
  fechaSubida: string;
  subidoPor: string;
  url: string;
  categoria: string;
  descripcion?: string;
  plantaId?: string;
}

interface CarpetaLegajo {
  id: string;
  nombre: string;
  tipo: 'elemento' | 'general';
  documentos: Documento[];
}

interface LegajoOrganizadoProps {
  obraId: string;
  documentos?: Documento[];
  onDocumentosChange?: (documentos: Documento[]) => void;
  plantaFiltro?: string;
  onQuitarFiltro?: () => void;
}

// Grupos de elementos constructivos
const GRUPOS_ELEMENTOS = [
  { id: 'fundaciones', nombre: 'Fundaciones y Estructuras' },
  { id: 'muros', nombre: 'Muros' },
  { id: 'pisos', nombre: 'Pisos' },
  { id: 'cubiertas', nombre: 'Cubiertas' },
  { id: 'escaleras', nombre: 'Escaleras' },
  { id: 'carpinterias', nombre: 'Carpinterías' },
];

const CATEGORIAS_DOCUMENTOS = [
  'Planos',
  'Especificaciones',
  'Fotografías',
  'Informes',
  'Certificados',
  'Contratos',
  'Otros'
];

export default function LegajoOrganizado({ 
  obraId, 
  documentos = [], 
  onDocumentosChange,
  plantaFiltro,
  onQuitarFiltro
}: LegajoOrganizadoProps) {
  const [documentosLista, setDocumentosLista] = useState<Documento[]>(documentos);
  const [showModal, setShowModal] = useState(false);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actualizar documentos cuando cambien desde fuera
  useEffect(() => {
    setDocumentosLista(documentos);
  }, [documentos]);

  // Mostrar toast
  const mostrarToast = (mensaje: string) => {
    setToastMessage(mensaje);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Organizar documentos en carpetas
  const organizarDocumentos = () => {
    const carpetas: CarpetaLegajo[] = [];

    // Carpeta de Planos Generales
    const planosGenerales = documentosLista.filter(doc => {
      if (plantaFiltro && doc.plantaId && doc.plantaId !== plantaFiltro) return false;
      
      return doc.categoria === 'Planos Generales' || 
             (doc.categoria === 'Planos' && !GRUPOS_ELEMENTOS.some(g => 
               doc.categoria.includes(g.nombre) || doc.descripcion?.includes(g.nombre)
             ));
    });

    carpetas.push({
      id: 'planos-generales',
      nombre: 'Planos Generales',
      tipo: 'general',
      documentos: planosGenerales
    });

    // Carpetas por grupo de elementos
    GRUPOS_ELEMENTOS.forEach(grupo => {
      const docsGrupo = documentosLista.filter(doc => {
        const perteneceAlGrupo = 
          doc.categoria.includes(grupo.nombre) || 
          doc.categoria === grupo.id ||
          doc.descripcion?.toLowerCase().includes(grupo.nombre.toLowerCase());

        if (plantaFiltro && perteneceAlGrupo) {
          return doc.plantaId === plantaFiltro || !doc.plantaId;
        }

        return perteneceAlGrupo;
      });

      carpetas.push({
        id: grupo.id,
        nombre: grupo.nombre,
        tipo: 'elemento',
        documentos: docsGrupo
      });
    });

    return carpetas;
  };

  const carpetas = organizarDocumentos();

  const handleOpenModal = (carpetaId: string) => {
    setCarpetaSeleccionada(carpetaId);
    setShowModal(true);
  };

  const handleUpload = async (files: FileList | null, carpetaId: string, categoria: string) => {
    if (!files || files.length === 0) return;

    const categoriaFinal = carpetaId === 'planos-generales' 
      ? 'Planos Generales' 
      : GRUPOS_ELEMENTOS.find(g => g.id === carpetaId)?.nombre || categoria;

    const nuevosDocumentos: Documento[] = Array.from(files).map((file, index) => ({
      id: `doc-${Date.now()}-${index}`,
      nombre: file.name,
      tipo: file.type,
      tamaño: file.size,
      fechaSubida: new Date().toISOString(),
      subidoPor: 'Usuario Actual',
      url: URL.createObjectURL(file),
      categoria: categoriaFinal,
      plantaId: plantaFiltro || undefined
    }));

    const actualizados = [...documentosLista, ...nuevosDocumentos];
    setDocumentosLista(actualizados);
    
    if (onDocumentosChange) {
      onDocumentosChange(actualizados);
    }

    const nombreCarpeta = carpetas.find(c => c.id === carpetaId)?.nombre || 'la carpeta';
    mostrarToast(`Documento agregado correctamente a ${nombreCarpeta}`);

    setShowModal(false);
    setCarpetaSeleccionada(null);
  };

  const handleDelete = (docId: string) => {
    if (window.confirm('¿Estás seguro de que querés eliminar este documento?')) {
      const actualizados = documentosLista.filter(doc => doc.id !== docId);
      setDocumentosLista(actualizados);
      
      if (onDocumentosChange) {
        onDocumentosChange(actualizados);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const result = Math.round(bytes / Math.pow(k, i) * 100) / 100;
    return result + ' ' + sizes[i];
  };

  return (
    <section className="space-y-8">
      {/* Encabezado institucional */}
      <Card className="p-6 shadow-sm border border-slate-200 bg-white">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-slate-800">Legajo Técnico</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestioná y organizá la documentación técnica cargada por categoría.
          </p>
          {plantaFiltro && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">Filtrado por planta:</span>
              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                {plantaFiltro}
              </span>
              {onQuitarFiltro && (
                <button
                  type="button"
                  onClick={onQuitarFiltro}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Quitar filtro
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Planos Generales - Destacado */}
      {carpetas.find(c => c.id === 'planos-generales') && (() => {
        const planosGenerales = carpetas.find(c => c.id === 'planos-generales')!;
        const tieneDocumentos = planosGenerales.documentos.length > 0;

        return (
          <Card
            className="p-6 border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{planosGenerales.nombre}</h3>
                <p className="text-sm text-slate-600 mt-1">Documentación general del proyecto</p>
              </div>
              <span className="text-base font-semibold text-sky-700 px-3 py-1 rounded-full bg-sky-100">
                {planosGenerales.documentos.length} {planosGenerales.documentos.length === 1 ? 'documento' : 'documentos'}
              </span>
            </div>

            {tieneDocumentos ? (
              <ul className="space-y-2 mb-4">
                {planosGenerales.documentos.map((documento) => (
                  <li
                    key={documento.id}
                    className="flex justify-between items-center border-2 border-sky-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white hover:bg-sky-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="truncate block font-medium">{documento.nombre}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(documento.fechaSubida).toLocaleDateString('es-AR')} - {formatFileSize(documento.tamaño)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(documento.url, '_blank')}
                        className="h-8 px-3 text-sky-700 hover:text-sky-800 hover:bg-sky-100"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(documento.id)}
                        className="h-8 px-3 text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mb-4 p-4 bg-white rounded-lg border-2 border-dashed border-sky-300">
                <p className="text-slate-500 text-center">
                  No hay documentos cargados
                </p>
              </div>
            )}

            <Button
              variant="default"
              size="default"
              onClick={() => handleOpenModal(planosGenerales.id)}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md py-2.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar documento
            </Button>
          </Card>
        );
      })()}

      {/* Grid de categorías (resto) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {carpetas.filter(c => c.id !== 'planos-generales').map((carpeta) => {
          const tieneDocumentos = carpeta.documentos.length > 0;

          return (
            <Card
              key={carpeta.id}
              className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-700">{carpeta.nombre}</h3>
                <span className="text-sm text-slate-500">
                  {carpeta.documentos.length} {carpeta.documentos.length === 1 ? 'documento' : 'documentos'}
                </span>
              </div>

              {tieneDocumentos ? (
                <ul className="space-y-1 mb-3">
                  {carpeta.documentos.map((documento) => (
                    <li
                      key={documento.id}
                      className="flex justify-between items-center border rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{documento.nombre}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(documento.fechaSubida).toLocaleDateString('es-AR')} - {formatFileSize(documento.tamaño)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(documento.url, '_blank')}
                          className="h-7 px-2 text-sky-700 hover:text-sky-800"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(documento.id)}
                          className="h-7 px-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm mb-4">
                  No hay documentos cargados
                </p>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={() => handleOpenModal(carpeta.id)}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Modal para subir documentos */}
      {showModal && carpetaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="max-w-md w-full mx-4 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Subir documentos</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setCarpetaSeleccionada(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carpeta: <span className="font-semibold">{carpetas.find(c => c.id === carpetaSeleccionada)?.nombre}</span>
                  </label>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
                    Tipo de documento
                  </label>
                  <select
                    id="categoria-select"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    defaultValue="Planos"
                  >
                    {CATEGORIAS_DOCUMENTOS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar archivos
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    onChange={(e) => {
                      const selectElement = document.getElementById('categoria-select') as HTMLSelectElement;
                      const categoria = selectElement?.value || 'Otros';
                      if (e.target.files && e.target.files.length > 0) {
                        handleUpload(e.target.files, carpetaSeleccionada || '', categoria);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setCarpetaSeleccionada(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  Seleccionar archivos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast de notificación */}
      {showToast && (
        <div 
          className="fixed bottom-6 right-6 z-50"
          style={{
            animation: 'fadeInUp 0.3s ease-out',
            transform: 'translateY(0)',
            opacity: 1
          }}
        >
          <Card className="border-green-200 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-medium text-gray-900">{toastMessage}</p>
              <button
                type="button"
                onClick={() => setShowToast(false)}
                className="ml-auto text-gray-400 hover:text-gray-600 transition"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
