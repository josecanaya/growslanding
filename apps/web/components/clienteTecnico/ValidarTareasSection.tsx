'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, Camera, Star } from 'lucide-react';

export function ValidarTareasSection() {
  const [seguridad, setSeguridad] = useState(false);
  const [orden, setOrden] = useState(false);
  const [calidad, setCalidad] = useState(false);
  const [evaluacion, setEvaluacion] = useState('3');
  const [comentarios, setComentarios] = useState('');

  const handleValidarTarea = () => {
    alert('✅ Tarea validada exitosamente. Se ha notificado al socio constructor.');
  };

  const handleReportarIncidencia = () => {
    alert('⚠️ Incidencia reportada. Se ha creado un ticket de seguimiento.');
  };

  const handleEvidencias = () => {
    alert('📸 Funcionalidad de evidencias en desarrollo. Próximamente podrás subir y revisar fotos.');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-claro px-6 py-4 border-b border-claro">
          <h2 className="text-xl font-semibold text-primario">Validación de Tareas</h2>
          <p className="text-sm text-primario/70">Revisa y valida las tareas completadas por los socios</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tarea Example */}
          <div className="bg-claro rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-primario mb-2">Información de la Tarea</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-primario mb-1">Nombre de tarea:</label>
                    <p className="text-oscuro font-medium">Revoque - Obra #238</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primario mb-1">Socio constructor:</label>
                    <p className="text-oscuro font-medium">Juan Pérez</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primario mb-1">Fecha de entrega:</label>
                    <p className="text-oscuro">15 de Octubre, 2024</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primario mb-2">Detalles Técnicos</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-primario mb-1">Tipo de trabajo:</label>
                    <p className="text-oscuro">Revoque fino exterior</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primario mb-1">Área:</label>
                    <p className="text-oscuro">45 m²</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primario mb-1">Material:</label>
                    <p className="text-oscuro">Cemento, arena, cal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primario mb-4">Checklist de Validación</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seguridad}
                  onChange={(e) => setSeguridad(e.target.checked)}
                  className="w-5 h-5 text-primario border-claro rounded focus:ring-acento focus:ring-2"
                />
                <span className="text-oscuro font-medium">Seguridad</span>
                <span className="text-sm text-primario/70">- Cumple con normas de seguridad</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orden}
                  onChange={(e) => setOrden(e.target.checked)}
                  className="w-5 h-5 text-primario border-claro rounded focus:ring-acento focus:ring-2"
                />
                <span className="text-oscuro font-medium">Orden</span>
                <span className="text-sm text-primario/70">- Área limpia y organizada</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calidad}
                  onChange={(e) => setCalidad(e.target.checked)}
                  className="w-5 h-5 text-primario border-claro rounded focus:ring-acento focus:ring-2"
                />
                <span className="text-oscuro font-medium">Calidad</span>
                <span className="text-sm text-primario/70">- Trabajo realizado según especificaciones</span>
              </label>
            </div>
          </div>

          {/* Evaluación */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primario mb-4">Evaluación General</h3>
            <div className="flex items-center space-x-4">
              <label className="text-oscuro font-medium">Calificación:</label>
              <select
                value={evaluacion}
                onChange={(e) => setEvaluacion(e.target.value)}
                className="px-3 py-2 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario"
              >
                <option value="1">1⭐ - Muy deficiente</option>
                <option value="2">2⭐ - Deficiente</option>
                <option value="3">3⭐ - Regular</option>
                <option value="4">4⭐ - Bueno</option>
                <option value="5">5⭐ - Excelente</option>
              </select>
            </div>
          </div>

          {/* Comentarios */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primario mb-4">Comentarios</h3>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Agrega comentarios sobre la tarea realizada..."
              className="w-full h-32 px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent text-primario placeholder-primario/50 resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleValidarTarea}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
            >
              <CheckCircle className="h-5 w-5" />
              <span>✅ Validar tarea</span>
            </button>

            <button
              onClick={handleReportarIncidencia}
              className="flex items-center space-x-2 bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors duration-200"
            >
              <AlertTriangle className="h-5 w-5" />
              <span>⚠️ Reportar incidencia</span>
            </button>

            <button
              onClick={handleEvidencias}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              <Camera className="h-5 w-5" />
              <span>📸 Evidencias</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
