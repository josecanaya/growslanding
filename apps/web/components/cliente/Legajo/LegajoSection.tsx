'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import LegajoCard from './LegajoCard';
import DocumentUploader from './DocumentUploader';
import {
  obtenerCategoriasLegajo,
  obtenerDocumentosPorCategoria,
  subirDocumento,
  eliminarDocumento,
  obtenerUrlDescarga,
  type CategoriaLegajo,
  type DocumentoLegajo,
} from '@/lib/supabase/legajo-client';

interface LegajoSectionProps {
  obraId: string;
}

export default function LegajoSection({ obraId }: LegajoSectionProps) {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<CategoriaLegajo[]>([]);
  const [documentosPorCategoria, setDocumentosPorCategoria] = useState<
    Record<string, DocumentoLegajo[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaLegajo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Cargar categorías y documentos
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar categorías
      const categoriasData = await obtenerCategoriasLegajo();
      setCategorias(categoriasData);

      // Cargar documentos para cada categoría
      const documentosMap: Record<string, DocumentoLegajo[]> = {};
      
      await Promise.all(
        categoriasData.map(async (categoria) => {
          const documentos = await obtenerDocumentosPorCategoria(obraId, categoria.id);
          documentosMap[categoria.id] = documentos;
        })
      );

      setDocumentosPorCategoria(documentosMap);
    } catch (error) {
      console.error('[LEGAJO] Error cargando datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del legajo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [obraId, toast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Separar categorías: Planos Generales y el resto
  const categoriaPlanosGenerales = categorias.find((c) => c.id === 'planos_generales');
  const otrasCategorias = categorias.filter((c) => c.id !== 'planos_generales');

  // Manejar agregar documento
  const handleAgregarDocumento = (categoria: CategoriaLegajo) => {
    setCategoriaSeleccionada(categoria);
    setShowUploader(true);
  };

  // Manejar subir documento
  const handleSubirDocumento = async (file: File, descripcion?: string) => {
    if (!categoriaSeleccionada) return;

    try {
      setIsUploading(true);
      const nuevoDocumento = await subirDocumento(
        obraId,
        categoriaSeleccionada.id,
        file,
        descripcion
      );

      // Actualizar documentos en el estado
      setDocumentosPorCategoria((prev) => ({
        ...prev,
        [categoriaSeleccionada.id]: [
          nuevoDocumento,
          ...(prev[categoriaSeleccionada.id] || []),
        ],
      }));

      toast({
        title: 'Éxito',
        description: 'Documento subido correctamente',
      });

      setShowUploader(false);
      setCategoriaSeleccionada(null);
    } catch (error) {
      console.error('[LEGAJO] Error subiendo documento:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al subir el documento',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Manejar eliminar documento
  const handleEliminarDocumento = async (documentoId: string, url: string) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar este documento?')) {
      return;
    }

    try {
      setIsDeleting(documentoId);
      await eliminarDocumento(documentoId, url);

      // Actualizar documentos en el estado
      setDocumentosPorCategoria((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((categoriaId) => {
          updated[categoriaId] = updated[categoriaId].filter(
            (doc) => doc.id !== documentoId
          );
        });
        return updated;
      });

      toast({
        title: 'Éxito',
        description: 'Documento eliminado correctamente',
      });
    } catch (error) {
      console.error('[LEGAJO] Error eliminando documento:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar el documento',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Manejar ver documento
  const handleVerDocumento = (url: string) => {
    const urlDescarga = obtenerUrlDescarga(url);
    window.open(urlDescarga, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Planos Generales - Destacado */}
      {categoriaPlanosGenerales && (
        <LegajoCard
          categoriaId={categoriaPlanosGenerales.id}
          categoriaNombre={categoriaPlanosGenerales.nombre}
          descripcion={categoriaPlanosGenerales.descripcion}
          documentos={documentosPorCategoria[categoriaPlanosGenerales.id] || []}
          onAgregarDocumento={() => handleAgregarDocumento(categoriaPlanosGenerales!)}
          onEliminarDocumento={handleEliminarDocumento}
          onVerDocumento={handleVerDocumento}
          isDestacado={true}
        />
      )}

      {/* Detalles Técnicos */}
      {otrasCategorias.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Detalles Técnicos</h2>
            <p className="text-slate-600 text-sm">
              Planos y documentación técnica por disciplina
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otrasCategorias.map((categoria) => (
              <LegajoCard
                key={categoria.id}
                categoriaId={categoria.id}
                categoriaNombre={categoria.nombre}
                descripcion={categoria.descripcion}
                documentos={documentosPorCategoria[categoria.id] || []}
                onAgregarDocumento={() => handleAgregarDocumento(categoria)}
                onEliminarDocumento={handleEliminarDocumento}
                onVerDocumento={handleVerDocumento}
                isDestacado={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal de Upload */}
      {showUploader && categoriaSeleccionada && (
        <DocumentUploader
          categoriaNombre={categoriaSeleccionada.nombre}
          onUpload={handleSubirDocumento}
          onClose={() => {
            setShowUploader(false);
            setCategoriaSeleccionada(null);
          }}
          isUploading={isUploading}
        />
      )}
    </section>
  );
}

