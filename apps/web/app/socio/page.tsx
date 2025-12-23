'use client';

import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { HomeSolicitudesSection } from '@/components/socio/home/HomeSolicitudesSection';
import { AccesosRapidosGrid } from '@/components/socio/home/AccesosRapidosGrid';
import { TrabajosHoySection } from '@/components/socio/home/TrabajosHoySection';

export default function SocioHomePage() {
  const currentUser = useCurrentUser();

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {/* Contenido principal */}
      <div className="p-4 pt-6">
        {/* Saludo */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Hola, {currentUser?.name || 'Socio'}
          </h1>
        </div>

        {/* Trabajos para hoy - PRIORIDAD #1 (destacado, verde, animado) */}
        <div className="mb-6">
          <TrabajosHoySection />
        </div>

        {/* Accesos rápidos - 4 botones circulares */}
        <div className="mb-6">
          <AccesosRapidosGrid hideTitle showOnly="high" />
        </div>

        {/* Oportunidades laborales */}
        <HomeSolicitudesSection />
      </div>
    </div>
  );
}
