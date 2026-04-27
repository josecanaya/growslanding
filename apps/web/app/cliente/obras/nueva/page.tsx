'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/grows';
import { ArrowLeft } from 'lucide-react';
import { WizardCrearObraLayout } from '@/components/obras/wizardNuevo/WizardCrearObraLayout';

export default function NuevaObraPage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push('/cliente/obras' as Route)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a obras
      </Button>
      <WizardCrearObraLayout />
    </div>
  );
}
