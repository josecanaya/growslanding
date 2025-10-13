'use client';

import { Button } from '@/components/ui/button';
import { ViewMode } from '@/lib/roadmap/types';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeSelector({ currentMode, onModeChange }: ViewModeSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
      <Button
        variant={currentMode === 'timeline' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('timeline')}
        className="h-8 px-3"
      >
        📅 Timeline
      </Button>
      <Button
        variant={currentMode === 'modules' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('modules')}
        className="h-8 px-3"
      >
        📦 Módulos
      </Button>
      <Button
        variant={currentMode === 'phases' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('phases')}
        className="h-8 px-3"
      >
        🚀 Fases
      </Button>
    </div>
  );
}
