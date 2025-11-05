import { useWizardStore } from './useWizardStore';

// Nuevo componente por defecto (compatible con el layout rediseñado)
export type PasoResumenNuevoProps = {
  onPrev: () => void;
  onFinish: () => void;
};

export default function PasoResumen({ onPrev, onFinish }: PasoResumenNuevoProps) {
  const state = useWizardStore((s) => s);
  const totalConstruido = state.superficies.reduce((acc, p) => acc + (p.cubiertos || 0) + (p.descubiertos || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
        <div className="rounded-2xl bg-gray-50 px-5 py-4">
          <h2 className="text-lg font-semibold" style={{ color: '#003C6E' }}>Resumen</h2>
          <p className="text-sm text-gray-600">Revisá la información antes de finalizar</p>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-3 font-semibold">Datos básicos</h3>
            <ul className="grid gap-1 text-sm">
              <li><span className="text-gray-600">ID:</span> #{state.id}</li>
              <li><span className="text-gray-600">Dirección:</span> {state.direccion || '-'}</li>
              <li><span className="text-gray-600">Dueño:</span> {state.propietario || '-'}</li>
              <li><span className="text-gray-600">Tipo de obra:</span> {state.tipoObra || '-'}</li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-3 font-semibold">Estructura</h3>
            <ul className="grid gap-1 text-sm">
              <li><span className="text-gray-600">Plantas:</span> {state.plantas}</li>
              <li><span className="text-gray-600">Terreno total:</span> {state.terreno || 0} m²</li>
              <li><span className="text-gray-600">Total construido estimado:</span> {totalConstruido} m²</li>
            </ul>
          </div>
        </div>

        <div className="mx-5 mb-4 rounded-lg border border-gray-200 p-4">
          <h3 className="mb-3 font-semibold">Legajos y planos</h3>
          <p className="text-sm text-gray-600">(No se cargaron legajos en este flujo)</p>
        </div>

        <div className="border-t border-gray-100" />
        <div className="flex items-center justify-center gap-3 p-5">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg border border-gray-300 px-6 py-2.5 font-semibold text-gray-800 hover:bg-gray-50"
          >
            Volver a editar
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="rounded-lg px-6 py-2.5 font-semibold text-white"
            style={{ backgroundColor: '#0055A4' }}
          >
            Guardar obra
          </button>
        </div>
      </div>
    </div>
  );
}

// Mantener export original nombrado (legacy) para compatibilidad en otras partes
export { PasoResumen as LegacyPasoResumen };

// Componentes auxiliares legacy conservados por si son usados en otro lado
import { Building2, Layers } from 'lucide-react';
type ResumenItemProps = { etiqueta: string; valor: string; color: string; capitalizar?: boolean };
function ResumenItem({ etiqueta, valor, color, capitalizar }: ResumenItemProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className={`mt-2 h-2 w-2 rounded-full ${color}`} />
      <div>
        <span className="text-sm font-medium text-gray-500">{etiqueta}</span>
        <p className={`font-semibold text-gray-900 ${capitalizar ? 'capitalize' : ''}`}>{valor}</p>
      </div>
    </div>
  );
}

type ResumenElementoProps = { valor: number | string; descripcion: string; color: string };
function ResumenElemento({ valor, descripcion, color }: ResumenElementoProps) {
  return (
    <div className="text-center">
      <div className={`mb-1 text-3xl font-bold ${color}`}>{valor}</div>
      <div className="text-sm text-gray-600">{descripcion}</div>
    </div>
  );
}

// (legacy helpers retained once above)
