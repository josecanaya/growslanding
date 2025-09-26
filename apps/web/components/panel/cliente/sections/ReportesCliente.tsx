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

interface ReportesClienteProps {
  user: User;
}

export function ReportesCliente({ user }: ReportesClienteProps) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-oscuro mb-8">Reportes</h1>
      <div className="bg-claro rounded-xl p-8 text-center">
        <p className="text-oscuro/70">Sección de reportes en desarrollo...</p>
      </div>
    </div>
  );
}
