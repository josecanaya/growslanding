'use client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  company: string;
  role: string;
  rating: number;
  level: string;
  obrasActivas: number;
  cuadrillasAsignadas: number;
}

interface PlantillasClienteProps {
  user: User;
}

export function PlantillasCliente({ user }: PlantillasClienteProps) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-oscuro mb-8">Plantillas</h1>
      <div className="bg-claro rounded-xl p-8 text-center">
        <p className="text-oscuro/70">Sección de plantillas en desarrollo...</p>
      </div>
    </div>
  );
}
