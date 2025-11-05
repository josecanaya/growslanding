'use client';

import { TecnicoElementosWizard } from '../../wizard/TecnicoElementosWizard';
import { Seleccion } from '../../wizard/SubgrupoAccordion';

interface PasoElementosConstructivosProps {
  elementosSeleccionados: Seleccion[];
  onElementosChange: (elementos: Seleccion[]) => void;
  etapaActual?: number;
}

export function PasoElementosConstructivos({ elementosSeleccionados, onElementosChange, etapaActual = 0 }: PasoElementosConstructivosProps) {
  return (
    <TecnicoElementosWizard 
      onSeleccionesChange={onElementosChange}
      etapaActual={etapaActual}
    />
  );
}

