'use client';

import { useState, useRef } from 'react';
import { IfcElemento, ProcesamientoIFC, ifcReader } from '../../lib/services/ifcReader';

interface IFCProcessorProps {
  archivo: File;
  onElementosProcesados: (elementos: IfcElemento[]) => void;
  onError: (error: string) => void;
}

export default function IFCProcessor({ archivo, onElementosProcesados, onError }: IFCProcessorProps) {
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  const procesarArchivo = async () => {
    if (!archivo) return;

    setProcesando(true);
    setProgreso(0);

    try {
      // Simular progreso
      const interval = setInterval(() => {
        setProgreso(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Procesar archivo IFC real usando importación estática
      const resultado: ProcesamientoIFC = await ifcReader.procesarArchivoIFC(archivo);
      
      clearInterval(interval);
      setProgreso(100);
      
      onElementosProcesados(resultado.elementos);
      
    } catch (error) {
      console.error('Error al procesar archivo IFC:', error);
      onError(error instanceof Error ? error.message : 'Error desconocido al procesar el archivo IFC');
    } finally {
      setProcesando(false);
    }
  };

  // Procesar automáticamente cuando se monta el componente
  useState(() => {
    procesarArchivo();
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            {procesando ? (
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {procesando ? 'Procesando archivo IFC' : 'Listo para procesar'}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {procesando 
              ? 'Extrayendo elementos constructivos del modelo BIM...' 
              : `Archivo: ${archivo.name}`
            }
          </p>

          {procesando && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
          )}

          <div className="text-sm text-gray-500">
            Progreso: {progreso}%
          </div>
        </div>
      </div>
    </div>
  );
}
