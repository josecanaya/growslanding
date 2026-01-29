'use client';

/**
 * Header fijo para todas las páginas del socio
 * Muestra el logo GROWS en dorado sobre fondo azul oscuro
 */
export function SocioHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#071A34] py-4 flex justify-center items-center shadow-md">
      <span className="text-[#D4AF37] text-xl font-bold tracking-wider">
        GROWS
      </span>
    </header>
  );
}

