'use client';

import { Building2, MapPin, Calendar, Users } from 'lucide-react';

export function FooterPanelCliente() {
  const oportunidades = [
    {
      id: '1',
      titulo: 'Casa de 2 plantas - Palermo',
      ubicacion: 'Palermo, CABA',
      fechaInicio: '15 Oct 2024',
      presupuesto: '$3,200,000',
      cuadrillasNecesarias: 2,
      estado: 'disponible'
    },
    {
      id: '2',
      titulo: 'Departamento - Recoleta',
      ubicacion: 'Recoleta, CABA',
      fechaInicio: '22 Oct 2024',
      presupuesto: '$1,800,000',
      cuadrillasNecesarias: 1,
      estado: 'disponible'
    },
    {
      id: '3',
      titulo: 'Oficinas - Microcentro',
      ubicacion: 'Microcentro, CABA',
      fechaInicio: '5 Nov 2024',
      presupuesto: '$4,500,000',
      cuadrillasNecesarias: 3,
      estado: 'próximo'
    }
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'bg-green-100 text-green-800';
      case 'próximo':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-claro border-t border-claro p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-oscuro">Oportunidades Disponibles</h3>
          <button className="text-primario hover:text-primario/80 font-medium">
            Ver todas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {oportunidades.map((oportunidad) => (
            <div key={oportunidad.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-oscuro mb-2">{oportunidad.titulo}</h4>
                  <div className="flex items-center text-oscuro/70 mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{oportunidad.ubicacion}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(oportunidad.estado)}`}>
                  {oportunidad.estado}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-oscuro/70">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Inicio:</span>
                  </div>
                  <span className="font-medium text-oscuro">{oportunidad.fechaInicio}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-oscuro/70">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>Presupuesto:</span>
                  </div>
                  <span className="font-medium text-primario">{oportunidad.presupuesto}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-oscuro/70">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Cuadrillas:</span>
                  </div>
                  <span className="font-medium text-oscuro">{oportunidad.cuadrillasNecesarias}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-claro">
                <button className="w-full bg-primario text-white py-2 px-4 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200">
                  Aplicar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
