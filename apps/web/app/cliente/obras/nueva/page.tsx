'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/grows';
import { ArrowLeft } from 'lucide-react';
import { WizardCrearObraLayout } from '@/components/obras/wizardNuevo/WizardCrearObraLayout';

export default function NuevaObraPage() {
  const router = useRouter();

  return (
    <div className="bg-[#f6fafe]">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-[#002b49] hover:bg-[#e4e9ed]"
          onClick={() => router.push('/cliente/obras' as Route)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a obras
        </Button>
      </div>
      <WizardCrearObraLayout />
    </div>
  );
}
