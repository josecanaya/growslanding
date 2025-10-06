'use client';

import React from 'react';
import { X } from 'lucide-react';

interface TestVisorProps {
  onClose: () => void;
}

export function TestVisor({ onClose }: TestVisorProps) {
  return (
    <div className="absolute inset-0 bg-white z-40 overflow-y-auto">
      {/* Header fijo */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Visor</h1>
            <p className="text-gray-600 mt-1">
              Este es un visor de prueba para verificar el posicionamiento
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">✅ Corrección Aplicada</h2>
          <p className="text-blue-700">
            Este visor ahora ocupa solo el área central y respeta el sidebar lateral.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Estructura Correcta</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Sidebar siempre visible</li>
              <li>• Visor ocupa área central completa</li>
              <li>• Posicionamiento `absolute inset-0`</li>
              <li>• Contenedor padre con `relative`</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Funcionalidades</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Header fijo con botón cerrar</li>
              <li>• Contenido scrolleable</li>
              <li>• Fondo blanco completo</li>
              <li>• Z-index para superposición</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900">🎉 ¡Corrección Exitosa!</h4>
          <p className="text-sm text-green-700 mt-1">
            Los visores ahora funcionan correctamente, ocupando solo el área central mientras 
            mantienen el sidebar siempre visible para navegación continua.
          </p>
        </div>
      </div>
    </div>
  );
}
