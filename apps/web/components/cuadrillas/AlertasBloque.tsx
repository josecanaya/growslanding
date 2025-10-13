'use client';

import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';

export function AlertasBloque() {
  const { cuadrillas } = useCuadrillasStore();

  // Calcular alertas
  const cuadrillasSinSeguro = cuadrillas.filter(c => 
    c.integrantes.some(i => !i.seguroVigente)
  ).length;
  
  const documentosVencidos = cuadrillas.reduce((sum, c) => 
    sum + c.documentos.filter(d => !d.vigente).length, 0
  );
  
  const totalAlertas = cuadrillasSinSeguro + documentosVencidos;

  if (totalAlertas === 0) {
    return null;
  }

  return (
    <div 
      className="alerta-container mt-8 mx-auto max-w-3xl rounded-xl border-2 p-4 text-center font-medium"
      style={{
        backgroundColor: 'rgba(244, 226, 126, 0.15)',
        borderColor: '#f4e27e',
        color: '#1B263B'
      }}
    >
      <p className="text-base">
        ⚠️ {totalAlertas} {totalAlertas === 1 ? 'alerta crítica' : 'alertas críticas'} — {' '}
        {cuadrillasSinSeguro > 0 && `${cuadrillasSinSeguro} sin seguro`}
        {cuadrillasSinSeguro > 0 && documentosVencidos > 0 && ' / '}
        {documentosVencidos > 0 && `${documentosVencidos} documentos vencidos`}
      </p>
    </div>
  );
}

