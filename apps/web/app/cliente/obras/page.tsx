'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Plus } from 'lucide-react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { ObraCard } from '@/components/cliente/ObraCard';
import { MOCK_OBRAS } from '@/lib/mocks/clienteMockData';
import { Button } from '@/components/ui/grows';

export default function ObrasPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Proyectos"
        title="Obras"
        description="Listado prototipo: estado, avance y acceso al detalle / timeline."
        action={
          <Link href={'/cliente/obras/nueva' as Route}>
            <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
              Nueva obra
            </Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_OBRAS.map((o) => (
          <ObraCard key={o.id} {...o} />
        ))}
      </div>
    </div>
  );
}
