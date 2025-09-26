'use client';

import { Building2, MapPin, Calendar, DollarSign } from 'lucide-react';

export function FooterPanel() {
  const opportunities = [
    {
      id: 1,
      title: 'Casa Familiar - San Isidro',
      location: 'San Isidro, Buenos Aires',
      startDate: '15 de Enero',
      budget: '$45,000',
      status: 'Disponible'
    },
    {
      id: 2,
      title: 'Edificio Residencial - Palermo',
      location: 'Palermo, Buenos Aires',
      startDate: '22 de Enero',
      budget: '$120,000',
      status: 'Próxima'
    },
    {
      id: 3,
      title: 'Oficinas Corporativas - Puerto Madero',
      location: 'Puerto Madero, Buenos Aires',
      startDate: '5 de Febrero',
      budget: '$200,000',
      status: 'En evaluación'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible': return 'bg-green-100 text-green-800';
      case 'Próxima': return 'bg-blue-100 text-blue-800';
      case 'En evaluación': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border-t border-light p-6">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-xl font-bold text-dark mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-primary" />
          Oportunidades de Obras
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="bg-light rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-dark text-sm">{opportunity.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(opportunity.status)}`}>
                  {opportunity.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-dark/70">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  {opportunity.location}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Inicio: {opportunity.startDate}
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-primary" />
                  Presupuesto: {opportunity.budget}
                </div>
              </div>
              
              <button className="w-full mt-4 bg-accent text-dark py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors duration-200">
                Ver detalles
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
