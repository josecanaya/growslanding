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

// Demo video: simular planos y documentos cargados sin base de datos (nombres de fantasía)
const DEMO_OBRA_ID = 'demo-obra-1-casa-familiar';

const MOCK_CATEGORIAS_LEGAJO: CategoriaLegajo[] = [
  { id: 'planos_generales', nombre: 'Planos Generales', descripcion: 'Planos de planta y ubicación de la obra', orden: 1 },
  { id: 'estructuras', nombre: 'Estructuras', descripcion: 'Planos y memorias de estructura', orden: 2 },
  { id: 'instalaciones', nombre: 'Instalaciones', descripcion: 'Instalaciones eléctrica, gas y sanitaria', orden: 3 },
  { id: 'permisos', nombre: 'Permisos y habilitaciones', descripcion: 'Permisos de obra y habilitaciones', orden: 4 },
  { id: 'contratos', nombre: 'Contratos y seguros', descripcion: 'Contratos y pólizas', orden: 5 },
  { id: 'seguridad', nombre: 'Seguridad e higiene', descripcion: 'Plan de seguridad y certificados', orden: 6 },
];

function buildMockDocumentos(obraId: string): Record<string, DocumentoLegajo[]> {
  const base = { obra_id: obraId, url: '#', descripcion: null };
  const doc = (id: string, cat: string, nombre: string, desc?: string | null): DocumentoLegajo => ({
    ...base,
    id,
    categoria: cat,
    nombre_archivo: nombre,
    descripcion: desc ?? null,
    created_at: new Date().toISOString(),
  });
  return {
    planos_generales: [
      doc('mock-leg-1', 'planos_generales', 'Plano de ubicación - Lote 12 Manzana A.pdf'),
      doc('mock-leg-2', 'planos_generales', 'Plano de planta baja - Casa Familiar.pdf'),
      doc('mock-leg-3', 'planos_generales', 'Plano de primer piso - Casa Familiar.pdf'),
      doc('mock-leg-4', 'planos_generales', 'Planta de cubierta y desagües.pdf'),
      doc('mock-leg-5', 'planos_generales', 'Memoria descriptiva del proyecto.pdf'),
      doc('mock-leg-6', 'planos_generales', 'Fachadas N-S-E-O.pdf'),
    ],
    estructuras: [
      doc('mock-leg-7', 'estructuras', 'Plano de fundaciones - PB.pdf'),
      doc('mock-leg-8', 'estructuras', 'Plano de estructura planta baja.pdf'),
      doc('mock-leg-9', 'estructuras', 'Plano de losa PB y vigas.pdf'),
      doc('mock-leg-10', 'estructuras', 'Memoria de cálculo de estructura.pdf'),
      doc('mock-leg-11', 'estructuras', 'Detalles de armadura y anclajes.pdf'),
    ],
    instalaciones: [
      doc('mock-leg-12', 'instalaciones', 'Esquema unifilar - Instalación eléctrica.pdf'),
      doc('mock-leg-13', 'instalaciones', 'Plano instalación sanitaria - baños y cocina.pdf'),
      doc('mock-leg-14', 'instalaciones', 'Plano de gas interno - recorrido y artefactos.pdf'),
      doc('mock-leg-15', 'instalaciones', 'Especificación artefactos y equipos.pdf'),
    ],
    permisos: [
      doc('mock-leg-16', 'permisos', 'Permiso de obra municipal - Expediente 2024-12345.pdf'),
      doc('mock-leg-17', 'permisos', 'Habilitación bomberos - Certificado.pdf'),
      doc('mock-leg-18', 'permisos', 'Informe de suelo - Estudio geotécnico.pdf'),
    ],
    contratos: [
      doc('mock-leg-19', 'contratos', 'Contrato principal de obra - Cliente y constructor.pdf'),
      doc('mock-leg-20', 'contratos', 'Póliza de seguro de obra - Vigencia 2024.pdf'),
      doc('mock-leg-21', 'contratos', 'Garantía de materiales y mano de obra.pdf'),
    ],
    seguridad: [
      doc('mock-leg-22', 'seguridad', 'Plan de seguridad e higiene - PSI.pdf'),
      doc('mock-leg-23', 'seguridad', 'Certificado ART - Cobertura obra.pdf'),
      doc('mock-leg-24', 'seguridad', 'Inducción de personal - Registro.pdf'),
    ],
  };
}

export default function LegajoSection({ obraId }: LegajoSectionProps) {
  const { toast } = useToast();
  const isDemoObra = obraId === DEMO_OBRA_ID;
  const [categorias, setCategorias] = useState<CategoriaLegajo[]>([]);
  const [documentosPorCategoria, setDocumentosPorCategoria] = useState<
    Record<string, DocumentoLegajo[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaLegajo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Cargar categorías y documentos (demo: solo mocks, sin API)
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      if (isDemoObra) {
        setCategorias(MOCK_CATEGORIAS_LEGAJO);
        setDocumentosPorCategoria(buildMockDocumentos(obraId));
        setLoading(false);
        return;
      }

      const categoriasData = await obtenerCategoriasLegajo();
      setCategorias(categoriasData);

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
  }, [obraId, toast, isDemoObra]);

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

  // Manejar subir documento (demo: solo estado local, sin API)
  const handleSubirDocumento = async (file: File, descripcion?: string) => {
    if (!categoriaSeleccionada) return;

    if (isDemoObra) {
      const nuevoDocumento: DocumentoLegajo = {
        id: `mock-leg-${Date.now()}`,
        obra_id: obraId,
        categoria: categoriaSeleccionada.id,
        nombre_archivo: file.name,
        url: '#',
        descripcion: descripcion ?? null,
        created_at: new Date().toISOString(),
      };
      setDocumentosPorCategoria((prev) => ({
        ...prev,
        [categoriaSeleccionada.id]: [
          nuevoDocumento,
          ...(prev[categoriaSeleccionada.id] || []),
        ],
      }));
      toast({ title: 'Éxito', description: 'Documento agregado (demo)' });
      setShowUploader(false);
      setCategoriaSeleccionada(null);
      return;
    }

    try {
      setIsUploading(true);
      const nuevoDocumento = await subirDocumento(
        obraId,
        categoriaSeleccionada.id,
        file,
        descripcion
      );
      setDocumentosPorCategoria((prev) => ({
        ...prev,
        [categoriaSeleccionada.id]: [
          nuevoDocumento,
          ...(prev[categoriaSeleccionada.id] || []),
        ],
      }));
      toast({ title: 'Éxito', description: 'Documento subido correctamente' });
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

  // Manejar eliminar documento (demo: solo estado local, sin API)
  const handleEliminarDocumento = async (documentoId: string, url: string) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar este documento?')) {
      return;
    }

    if (isDemoObra) {
      setDocumentosPorCategoria((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((categoriaId) => {
          updated[categoriaId] = updated[categoriaId].filter(
            (doc) => doc.id !== documentoId
          );
        });
        return updated;
      });
      toast({ title: 'Éxito', description: 'Documento eliminado (demo)' });
      return;
    }

    try {
      setIsDeleting(documentoId);
      await eliminarDocumento(documentoId, url);
      setDocumentosPorCategoria((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((categoriaId) => {
          updated[categoriaId] = updated[categoriaId].filter(
            (doc) => doc.id !== documentoId
          );
        });
        return updated;
      });
      toast({ title: 'Éxito', description: 'Documento eliminado correctamente' });
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

  // Manejar ver documento (demo: url "#" no abre nada)
  const handleVerDocumento = (url: string) => {
    if (url === '#' || !url) {
      toast({ title: 'Demo', description: 'Documento simulado, sin archivo real' });
      return;
    }
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

