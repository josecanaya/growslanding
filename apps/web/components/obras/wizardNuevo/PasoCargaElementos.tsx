'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from './useWizardStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { crearObra } from '@/services/obrasService';
import { DetalleObra } from '@/components/clienteTecnico/DetalleObra';

type PasoCargaElementosProps = {
  onPrev: () => void;
  onFinish: () => void;
};

export default function PasoCargaElementos({ onPrev, onFinish }: PasoCargaElementosProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  
  // Datos del wizard
  const direccion = useWizardStore((s) => s.direccion);
  const propietario = useWizardStore((s) => s.propietario);
  const tipoObra = useWizardStore((s) => s.tipoObra);
  const latitud = useWizardStore((s) => s.latitud);
  const longitud = useWizardStore((s) => s.longitud);
  const plantas = useWizardStore((s) => s.plantas);
  const terreno = useWizardStore((s) => s.terreno);
  const superficies = useWizardStore((s) => s.superficies);
  const reset = useWizardStore((s) => s.reset);

  // Estados
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [obraCreadaId, setObraCreadaId] = useState<string | null>(null);
  const [mostrarDetalleConElementos, setMostrarDetalleConElementos] = useState(false);

  // Función para generar el nombre de la obra
  const getNombreObra = () => {
    if (tipoObra && propietario) {
      return `${tipoObra} - ${propietario}`;
    }
    if (tipoObra) {
      return tipoObra;
    }
    if (propietario) {
      return `Obra - ${propietario}`;
    }
    return 'Nueva Obra';
  };

  // Función para guardar la obra en Supabase
  const handleGuardarObra = async () => {
    if (!currentUser?.orgId) {
      setError('No se pudo obtener la organización. Por favor, inicia sesión nuevamente.');
      return;
    }

    if (!direccion || direccion.trim().length < 3) {
      setError('La dirección es requerida (mínimo 3 caracteres).');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const nombreObra = getNombreObra();
      
      // Preparar todos los datos del wizard para enviar
      const obraData = {
        org_id: currentUser.orgId,
        nombre: nombreObra,
        localizacion: direccion.trim(),
        // Campos del Paso 1 (Datos básicos)
        propietario: propietario?.trim() || undefined,
        tipo_obra: tipoObra || undefined,
        latitud: latitud !== undefined ? latitud : undefined,
        longitud: longitud !== undefined ? longitud : undefined,
        // Campos del Paso 2 (Superficies)
        plantas: plantas !== undefined && plantas > 0 ? plantas : undefined,
        terreno: terreno !== undefined && terreno > 0 ? terreno : undefined,
        superficies: superficies && superficies.length > 0 ? superficies : undefined,
        // Estado por defecto
        estado: 'pendiente',
      };
      
      const obraCreada = await crearObra(obraData);

      // Guardar el ID de la obra creada para mostrar el botón de agregar elementos
      if (obraCreada?.id) {
        setObraCreadaId(obraCreada.id);
      }

      // Resetear el wizard
      reset();
      onFinish();
    } catch (err: any) {
      console.error('[ERROR_CREAR_OBRA]', err);
      setError(err.message || 'Error al crear la obra. Por favor, intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Función para mostrar el detalle de la obra con el tab de elementos
  const handleAgregarElementos = () => {
    if (obraCreadaId) {
      setMostrarDetalleConElementos(true);
    }
  };

  // Si se debe mostrar el detalle con elementos, mostrar el componente DetalleObra
  if (mostrarDetalleConElementos && obraCreadaId) {
    // Crear un objeto obra mock para el DetalleObra
    const obraParaDetalle = {
      id: obraCreadaId,
      nombre: getNombreObra(),
      localizacion: direccion || '',
      estado: 'ACTIVA',
      created_at: new Date().toISOString(),
      fecha_inicio: undefined,
      presupuesto: undefined,
      descripcion: '',
      cliente: propietario || undefined,
      tipoObra: (tipoObra as 'nueva' | 'reforma' | 'ampliacion') || 'nueva',
      numeroPermiso: undefined,
      progreso: 0,
      tareasActivas: 0,
      tareasCompletadas: 0,
      legajoTecnico: [],
    };

    return (
      <DetalleObra
        obra={obraParaDetalle}
        tareas={[]}
        tabInicial="elementos"
        onVolver={() => {
          setMostrarDetalleConElementos(false);
          reset();
          onFinish();
          router.push('/obras');
        }}
        onActualizarTarea={() => {}}
        onCrearTarea={() => {}}
        onCrearTareas={() => {}}
        onEliminarTarea={() => {}}
        onActualizarObra={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
        <div className="rounded-2xl bg-gray-50 px-5 py-4">
          <h2 className="text-lg font-semibold" style={{ color: '#003C6E' }}>
            Carga de elementos
          </h2>
          <p className="text-sm text-gray-600">Agregá elementos constructivos a la obra (opcional)</p>
        </div>

        <div className="p-5">
          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Resumen de la obra */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Resumen de la obra:</h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
              <div><span className="font-medium">Tipo:</span> {tipoObra || 'No especificado'}</div>
              <div><span className="font-medium">Propietario:</span> {propietario || 'No especificado'}</div>
              <div className="md:col-span-2"><span className="font-medium">Dirección:</span> {direccion || 'No especificada'}</div>
              {(latitud && longitud) && (
                <div className="md:col-span-2"><span className="font-medium">Coordenadas:</span> {latitud.toFixed(6)}, {longitud.toFixed(6)}</div>
              )}
              {plantas > 0 && (
                <div><span className="font-medium">Plantas:</span> {plantas}</div>
              )}
              {terreno > 0 && (
                <div><span className="font-medium">Terreno:</span> {terreno} m²</div>
              )}
              {superficies && superficies.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-medium">Superficies:</span>
                  <ul className="ml-4 mt-1 list-disc space-y-0.5">
                    {superficies.map((s) => (
                      <li key={s.planta}>
                        Planta {s.planta}: {s.cubiertos || 0} m² cubiertos, {s.descubiertos || 0} m² descubiertos
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="md:col-span-2"><span className="font-medium">Nombre generado:</span> {getNombreObra()}</div>
            </div>
          </div>

          {/* Mensaje de éxito y botón para agregar elementos */}
          {obraCreadaId && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-green-800 mb-1">
                    ¡Obra creada exitosamente!
                  </h3>
                  <p className="text-sm text-green-700">
                    Ahora podés agregar elementos constructivos a tu obra.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAgregarElementos}
                  className="rounded-lg px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: '#0055A4' }}
                >
                  Agregar elementos
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        <div className="flex items-center justify-center gap-3 p-5">
          <button
            type="button"
            onClick={onPrev}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-6 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Atrás
          </button>
          
          <button
            type="button"
            onClick={handleGuardarObra}
            disabled={isSaving || !currentUser?.orgId}
            className="rounded-lg px-6 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0055A4' }}
          >
            {isSaving ? 'Guardando...' : 'Guardar obra'}
          </button>
        </div>
      </div>
    </div>
  );
}

