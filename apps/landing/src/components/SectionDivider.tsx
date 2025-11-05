'use client';

import Image from 'next/image';

export function SectionDivider() {
  const separadorImages = [...Array(100)].map((_, i) => (
    <div key={i} className="flex-shrink-0">
      <Image
        src="/images/separador.svg"
        alt="Separador"
        width={56}
        height={32}
        className="object-cover"
      />
    </div>
  ));

  return (
    <div className="relative w-full bg-white overflow-hidden">
      {/* Hilera animada */}
      <div className="flex items-center justify-start flex-nowrap animate-scroll">
        {separadorImages}
        {/* Duplicado para continuidad */}
        {separadorImages}
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
