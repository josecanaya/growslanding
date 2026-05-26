'use client';

import type { SocioPerfilCompleto } from '@/components/socio/cuenta/EditarPerfilModal';
import { Award } from 'lucide-react';

interface PerfilPublicoPreviewProps {
  perfil: Partial<SocioPerfilCompleto> | null;
}

export function PerfilPublicoPreview({ perfil }: PerfilPublicoPreviewProps) {
  const nombreComercial =
    (perfil?.nombre_comercial || '').trim() ||
    [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ').trim() ||
    'Tu nombre comercial';
  const especialidad = (perfil?.especialidad || 'Especialidad principal').trim();
  const localidad = (perfil?.localidad || '').trim();
  const descripcion = (perfil?.descripcion || '').trim();
  const secundarias = Array.isArray(perfil?.especialidades_secundarias)
    ? perfil!.especialidades_secundarias.filter(Boolean)
    : [];

  return (
    <div className="rounded-2xl border border-[#c3c6d5]/30 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-sm">
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#43617c]">
        Vista previa pública
      </p>
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-[#d8e2ff] text-xl font-bold text-[#163274] shadow">
            {perfil?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={perfil.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              nombreComercial.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-lg border border-white bg-[#003473] p-1 text-white">
            <Award className="h-3 w-3" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-stitch-headline text-lg font-extrabold text-[#163274]">{nombreComercial}</h3>
          <p className="text-sm font-semibold text-[#43617c]">{especialidad}</p>
          {localidad ? <p className="mt-0.5 text-xs text-[#43617c]/80">{localidad}</p> : null}
          {descripcion ? (
            <p className="mt-2 line-clamp-3 text-sm text-[#434653]">{descripcion}</p>
          ) : (
            <p className="mt-2 text-sm italic text-[#434653]/60">Agregá una descripción profesional.</p>
          )}
          {secundarias.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {secundarias.map((es) => (
                <span
                  key={es}
                  className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#163274] shadow-sm"
                >
                  {es}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
