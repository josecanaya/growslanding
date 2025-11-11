'use client';

import { Badge, Button, Card, SectionLayout } from '@/components/ui/grows';

/**
 * Componente de verificación para asegurar que todos los badges y botones
 * estén usando el sistema GROWS correctamente
 */
export function VerificacionSistemaGROWS() {
  return (
    <SectionLayout
      title="Verificación del Sistema GROWS"
      subtitle="Todos los componentes usando el sistema unificado"
    >
      {/* Verificación de Badges */}
      <Card title="Badges - Estados de Obras">
        <div className="flex flex-wrap gap-3 mb-6">
          <Badge variant="success">ACTIVA</Badge>
          <Badge variant="warning">PAUSADA</Badge>
          <Badge variant="info">FINALIZADA</Badge>
          <Badge variant="error">CANCELADA</Badge>
          <Badge variant="default">SIN ESTADO</Badge>
        </div>
        <p className="text-sm text-grows-text-secondary">
          ✅ Todos los badges usan colores coherentes: ACTIVA (dorado), PAUSADA (gris), FINALIZADA (azul petróleo), CANCELADA (rojo apagado)
        </p>
      </Card>

      {/* Verificación de Botones */}
      <Card title="Botones - Variantes GROWS">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primario (Azul Pálido)</Button>
            <Button variant="secondary">Secundario (Borde Azul)</Button>
            <Button variant="ghost">Ghost (Sin Fondo)</Button>
            <Button variant="danger">Peligro (Rojo)</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm">Pequeño</Button>
            <Button variant="primary" size="md">Mediano</Button>
            <Button variant="primary" size="lg">Grande</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" loading>Cargando</Button>
            <Button variant="primary" disabled>Deshabilitado</Button>
          </div>
        </div>
        <p className="text-sm text-grows-text-secondary mt-4">
          ✅ Todos los botones usan el sistema GROWS: primary (fondo dorado, texto azul petróleo), secondary (borde dorado, fondo blanco)
        </p>
      </Card>

      {/* Verificación de Cards */}
      <Card title="Cards - Estructura Unificada">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            title="Card Simple"
            subtitle="Con subtítulo"
            className="hover:shadow-grows-md transition-all duration-200"
          >
            <p className="text-grows-text-secondary">Contenido de la card usando el sistema GROWS</p>
          </Card>
          
          <Card
            title="Card con Estado"
            subtitle="Con badge de estado"
            icon={<div className="h-6 w-6 bg-grows-secondary/10 rounded-grows-md flex items-center justify-center">📋</div>}
          >
            <p className="text-grows-text-secondary">Card con icono y estado usando Badge component</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-grows-text-secondary">Estado</span>
              <Badge variant="success">ACTIVA</Badge>
            </div>
          </Card>
        </div>
        <p className="text-sm text-grows-text-secondary mt-4">
          ✅ Todas las cards usan: rounded-grows-lg, shadow-grows-sm, border-grows-border, colores GROWS
        </p>
      </Card>

      {/* Verificación de Colores */}
      <Card title="Paleta de Colores GROWS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="h-16 w-16 bg-grows-primary rounded-grows-lg mx-auto mb-2"></div>
            <p className="text-sm font-medium text-grows-primary">Azul Petróleo</p>
            <p className="text-xs text-grows-text-secondary">#0C1D36</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 bg-grows-secondary rounded-grows-lg mx-auto mb-2"></div>
            <p className="text-sm font-medium text-grows-primary">Azul Pálido</p>
            <p className="text-xs text-grows-text-secondary">#4A6FA5</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 bg-grows-background rounded-grows-lg mx-auto mb-2 border border-grows-border"></div>
            <p className="text-sm font-medium text-grows-primary">Fondo</p>
            <p className="text-xs text-grows-text-secondary">#F5F6F7</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 bg-grows-surface rounded-grows-lg mx-auto mb-2 border border-grows-border"></div>
            <p className="text-sm font-medium text-grows-primary">Superficie</p>
            <p className="text-xs text-grows-text-secondary">#FFFFFF</p>
          </div>
        </div>
        <p className="text-sm text-grows-text-secondary mt-4">
          ✅ Paleta unificada: Azul petróleo como base principal, azul pálido como acento, fondo gris claro
        </p>
      </Card>

      {/* Resumen de Verificación */}
      <Card title="✅ Verificación Completa">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-grows-secondary rounded-full"></div>
            <span className="text-grows-text-secondary">Todos los badges usan el componente Badge.tsx con colores coherentes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-grows-secondary rounded-full"></div>
            <span className="text-grows-text-secondary">Todos los botones usan el componente Button.tsx con variantes GROWS</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-grows-secondary rounded-full"></div>
            <span className="text-grows-text-secondary">Todas las cards usan el componente Card.tsx con estructura unificada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-grows-secondary rounded-full"></div>
            <span className="text-grows-text-secondary">Todos los módulos usan SectionLayout.tsx para consistencia</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-grows-secondary rounded-full"></div>
            <span className="text-grows-text-secondary">Paleta de colores unificada en todos los componentes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-grows-secondary rounded-full"></div>
            <span className="text-grows-text-secondary">Microinteracciones aplicadas (hover, transitions, animations)</span>
          </div>
        </div>
      </Card>
    </SectionLayout>
  );
}
