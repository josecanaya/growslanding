'use client';

import { DiagnosticTool } from '@/components/ui/grows/DiagnosticTool';
import { SectionLayout } from '@/components/ui/grows';

/**
 * Página de diagnóstico para errores "Failed to fetch"
 * Accesible en /diagnostic
 */
export default function DiagnosticPage() {
  return (
    <SectionLayout
      title="Diagnóstico de Errores"
      subtitle="Herramienta para identificar y solucionar errores 'Failed to fetch'"
    >
      <DiagnosticTool />
    </SectionLayout>
  );
}
