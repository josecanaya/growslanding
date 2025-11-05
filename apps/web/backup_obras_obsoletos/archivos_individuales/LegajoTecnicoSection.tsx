'use client';

import { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  Download, 
  Trash2, 
  Eye, 
  Plus,
  Calendar,
  User,
  Tag
} from 'lucide-react';

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
}

interface LegajoTecnicoSectionProps {
  obraId: string;
  documentos?: Documento[];
  onDocumentosChange?: (documentos: Documento[]) => void;
}

// Categorías de documentos
const CATEGORIAS_DOCUMENTOS = [
  'Planos',
  'Especificaciones',
  'Fotografías',
  'Informes',
  'Certificados',
  'Contratos',
  'Otros'
];

// Tipos de archivo permitidos
const TIPOS_PERMITIDOS = {
  'image/*': 'Imágenes',
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel'
};

// Componente para mostrar un documento
const DocumentoCard = ({ 
  documento, 
  onView, 
  onDownload, 
  onDelete 
}: { 
  documento: Documento; 
  onView: (documento: Documento) => void; 
  onDownload: (documento: Documento) => void; 
  onDelete: (documento: Documento) => void; 
}) => {
  const getIconoTipo = (tipo: string) => {
    if (tipo.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-600" />;
    } else if (tipo === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-600" />;
    } else {
      return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIconoTipo(documento.tipo)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {documento.nombre}
          </h3>
          
          <div className="flex items-center space-x-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {documento.categoria}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatearFecha(documento.fechaSubida)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{documento.subidoPor}</span>
            </div>
            <span>{formatearTamaño(documento.tamaño)}</span>
          </div>
          
          {documento.descripcion && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
              {documento.descripcion}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onView(documento)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Ver documento"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDownload(documento)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Descargar documento"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(documento)}
            className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
            title="Eliminar documento"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para subir documentos
const ModalSubirDocumento = ({ 
  isOpen, 
  onClose, 
  onUpload 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onUpload: (archivo: File, categoria: string, descripcion: string) => void; 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (archivo && categoria) {
      onUpload(archivo, categoria, descripcion);
      onClose();
      setArchivo(null);
      setCategoria('');
      setDescripcion('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Subir Documento</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Área de drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {archivo ? (
              <div className="space-y-2">
                <FileText className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{archivo.name}</p>
                <p className="text-xs text-gray-500">
                  {(archivo.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  Arrastra un archivo aquí o{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    selecciona uno
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  PDF, Word, Excel, imágenes (máx. 10MB)
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar categoría</option>
              {CATEGORIAS_DOCUMENTOS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del documento..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!archivo || !categoria}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Subir Documento
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function LegajoTecnicoSection({ 
  obraId, 
  documentos = [], 
  onDocumentosChange 
}: LegajoTecnicoSectionProps) {
  const [documentosLista, setDocumentosLista] = useState<Documento[]>(documentos);
  const [showModal, setShowModal] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  // Filtrar documentos
  const documentosFiltrados = documentosLista.filter(doc => {
    const matchesCategoria = filtroCategoria === 'Todas' || doc.categoria === filtroCategoria;
    const matchesBusqueda = busqueda === '' || 
      doc.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      doc.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    return matchesCategoria && matchesBusqueda;
  });

  // Agrupar documentos por categoría
  const documentosPorCategoria = documentosFiltrados.reduce((acc, doc) => {
    if (!acc[doc.categoria]) {
      acc[doc.categoria] = [];
    }
    acc[doc.categoria].push(doc);
    return acc;
  }, {} as Record<string, Documento[]>);

  const handleUpload = async (archivo: File, categoria: string, descripcion: string) => {
    try {
      // Simular subida de archivo
      const nuevoDocumento: Documento = {
        id: `doc-${Date.now()}`,
        nombre: archivo.name,
        tipo: archivo.type,
        tamaño: archivo.size,
        fechaSubida: new Date().toISOString(),
        subidoPor: 'Usuario Actual', // En una app real, esto vendría del contexto de autenticación
        url: URL.createObjectURL(archivo), // En una app real, esto sería la URL del servidor
        categoria,
        descripcion
      };

      const nuevosDocumentos = [...documentosLista, nuevoDocumento];
      setDocumentosLista(nuevosDocumentos);
      
      if (onDocumentosChange) {
        onDocumentosChange(nuevosDocumentos);
      }
    } catch (error) {
      console.error('Error al subir documento:', error);
    }
  };

  const handleView = (documento: Documento) => {
    // En una app real, esto abriría el documento en una nueva ventana o modal
    window.open(documento.url, '_blank');
  };

  const handleDownload = (documento: Documento) => {
    // En una app real, esto descargaría el archivo del servidor
    const link = document.createElement('a');
    link.href = documento.url;
    link.download = documento.nombre;
    link.click();
  };

  const handleDelete = (documento: Documento) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${documento.nombre}"?`)) {
      const nuevosDocumentos = documentosLista.filter(doc => doc.id !== documento.id);
      setDocumentosLista(nuevosDocumentos);
      
      if (onDocumentosChange) {
        onDocumentosChange(nuevosDocumentos);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Legajo Técnico</h2>
          <p className="text-gray-600 mt-1">Documentos y archivos de la obra</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Subir Documento</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todas">Todas las categorías</option>
            {CATEGORIAS_DOCUMENTOS.map(categoria => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{documentosLista.length}</p>
            </div>
          </div>
                    </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">PDFs</p>
              <p className="text-2xl font-bold text-gray-900">
                {documentosLista.filter(d => d.tipo === 'application/pdf').length}
              </p>
                      </div>
                    </div>
                  </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Image className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Imágenes</p>
              <p className="text-2xl font-bold text-gray-900">
                {documentosLista.filter(d => d.tipo.startsWith('image/')).length}
              </p>
                  </div>
                </div>
              </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <File className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Otros</p>
              <p className="text-2xl font-bold text-gray-900">
                {documentosLista.filter(d => d.tipo !== 'application/pdf' && !d.tipo.startsWith('image/')).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de documentos */}
      {documentosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {busqueda || filtroCategoria !== 'Todas' ? 'No se encontraron documentos' : 'No hay documentos'}
          </h3>
          <p className="text-gray-600 mb-6">
            {busqueda || filtroCategoria !== 'Todas' 
              ? 'Intenta ajustar los filtros de búsqueda' 
              : 'Comienza subiendo documentos al legajo técnico'
            }
          </p>
          {!busqueda && filtroCategoria === 'Todas' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              <Plus className="h-5 w-5" />
              <span>Subir Primer Documento</span>
            </button>
          )}
                </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(documentosPorCategoria).map(([categoria, docs]) => (
            <div key={categoria}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {categoria}
                </span>
                <span className="text-sm text-gray-500">({docs.length} documentos)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((documento) => (
                  <DocumentoCard
                    key={documento.id}
                    documento={documento}
                    onView={handleView}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para subir documentos */}
      <ModalSubirDocumento
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}