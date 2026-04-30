'use client';

import { ActivacionObraCard } from './ActivacionObraCard';

const BANNER_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCmQQRMjc5_gtRdjeSUgWabLjWjAKMl9IwCNcDJKuUSc48hm1jjKu6Oga1xqRjBNZ1fKrA7Nj0N8IX-FRfviPINN_-CHkW2kJsHXR7BYZadNg1MuSPElzLAcBkjzej3PjWdpycxZBkQ0_3Zre-C5yJ-Zid_9futKT9RjwJk1u8Y9vqjVGCaB6Ggg2g9qaXFKaLy_cEuBKQf5lM-5CC93GXISGJBSD13Tt587fxMP937Rd12e_FuaaOVPgDDrM4OX3w3O-pu5ow1LeYp';

/** Columna derecha del hub Stitch: sticky + banner */
export function NuevaObraHubAside() {
  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
      <ActivacionObraCard />
      <div className="group relative h-52 overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- URL externa de referencia de diseño */}
        <img
          src={BANNER_SRC}
          alt=""
          className="h-full w-full object-cover grayscale brightness-50 transition duration-700 group-hover:grayscale-0 group-hover:brightness-[0.85]"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#001629]/80 to-transparent p-6">
          <p className="text-lg font-bold leading-tight text-white">
            Visualizá el impacto de tu obra desde el primer día.
          </p>
        </div>
      </div>
    </div>
  );
}
