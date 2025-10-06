'use client';

import IFCProcessorReal from './IFCProcessorReal';

interface ImportarIFCProps {
  onElementosImportados: (elementos: any[]) => void;
  onCancel: () => void;
}

export function ImportarIFC({ onElementosImportados, onCancel }: ImportarIFCProps) {
  return (
    <IFCProcessorReal
      onElementosImportados={onElementosImportados}
      onCancel={onCancel}
    />
  );
}