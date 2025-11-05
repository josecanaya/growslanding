import { Building2, Plus } from 'lucide-react';
import { ReactNode } from 'react';
import { Button, Card } from '@/components/ui/grows';

type EmptyStateProps = {
  primaryAction: () => void;
  secondaryAction: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  extraContent?: ReactNode;
};

export function EmptyState({
  primaryAction,
  secondaryAction,
  primaryLabel = 'Crear Obra Completa',
  secondaryLabel = 'Crear Básica',
  extraContent,
}: EmptyStateProps) {
  return (
    <Card className="py-12 text-center">
      <Building2 className="mx-auto mb-4 h-12 w-12 text-grows-text-secondary" />
      <h3 className="mb-2 text-lg font-medium text-grows-primary">
        No hay obras creadas
      </h3>
      <p className="mb-6 text-grows-text-secondary">
        Comienza creando tu primera obra
      </p>
      <div className="flex items-center justify-center space-x-3">
        <Button
          onClick={primaryAction}
          variant="primary"
          size="lg"
          icon={<Plus className="h-5 w-5" />}
        >
          {primaryLabel}
        </Button>
        <Button
          onClick={secondaryAction}
          variant="secondary"
          size="lg"
          icon={<Plus className="h-5 w-5" />}
        >
          {secondaryLabel}
        </Button>
      </div>
      {extraContent}
    </Card>
  );
}
