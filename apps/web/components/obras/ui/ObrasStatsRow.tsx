import { Card } from '@/components/ui/grows';
import { ObraStats } from '@/types/obras';

type ObrasStatsRowProps = {
  stats: ObraStats;
};

export function ObrasStatsRow({ stats }: ObrasStatsRowProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
      <Card title="Total Obras" className="text-center">
        <div className="text-2xl font-bold text-grows-primary">
          {stats.total}
        </div>
      </Card>
      <Card title="Activas" className="text-center">
        <div className="text-2xl font-bold text-grows-secondary">
          {stats.activas}
        </div>
      </Card>
      <Card title="Pausadas" className="text-center">
        <div className="text-2xl font-bold text-grows-warning">
          {stats.pausadas}
        </div>
      </Card>
      <Card title="Finalizadas" className="text-center">
        <div className="text-2xl font-bold text-grows-primary">
          {stats.finalizadas}
        </div>
      </Card>
      <Card title="Canceladas" className="text-center">
        <div className="text-2xl font-bold text-grows-error">
          {stats.canceladas}
        </div>
      </Card>
    </div>
  );
}
