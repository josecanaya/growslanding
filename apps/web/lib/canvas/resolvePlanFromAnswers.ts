import type { ObraProductKind } from '@/lib/canvas/obraProductKind';
import { defaultTemplateSlugForKind } from '@/lib/canvas/officialCanvasTemplates';

export type TrabajoSimpleDetalle = 'porton' | 'puerta' | 'otro';

export type PlanWizardAnswers = {
  obraProductKind: ObraProductKind;
  trabajoSimpleDetalle?: TrabajoSimpleDetalle;
};

/** Mapea respuestas cortas del asistente a un slug del catálogo oficial (Sprint 2+ ampliar reglas / IA). */
export function resolveTemplateSlugFromPlanWizard(answers: PlanWizardAnswers): string {
  if (answers.obraProductKind === 'trabajo_simple') {
    switch (answers.trabajoSimpleDetalle) {
      case 'porton':
        return 'trabajo_simple_colocar_porton';
      case 'puerta':
        return 'puerta_interior';
      default:
        return 'trabajo_simple_colocar_porton';
    }
  }
  return defaultTemplateSlugForKind(answers.obraProductKind);
}
