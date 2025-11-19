'use client';

import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

// Pasos específicos por sección
const ONBOARDING_STEPS_BY_SECTION: Record<string, Array<{
  id: string;
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}>> = {
  obras: [
    {
      id: 'crear-obra',
      target: '[data-onboarding="crear-obra"]',
      title: 'Crear una nueva obra',
      description: 'Usá este botón para crear una nueva obra. Podrás definir el nombre, ubicación y tipo de construcción. Cada obra es un proyecto independiente que podrás gestionar por separado.',
      position: 'bottom' as const,
    },
    {
      id: 'estadisticas-obras',
      target: '[data-onboarding="estadisticas-obras"]',
      title: 'Estadísticas de tus obras',
      description: 'Acá podés ver un resumen rápido: el total de obras, cuántas están activas, pausadas, finalizadas o canceladas. Te ayuda a tener una vista general del estado de todos tus proyectos.',
      position: 'bottom' as const,
    },
    {
      id: 'card-obra',
      target: '[data-onboarding="card-obra"]',
      title: 'Tarjeta de obra',
      description: 'Cada tarjeta muestra la información principal de una obra: nombre, ubicación, estado y fecha de creación. Hacé click en cualquier parte de la tarjeta para ver el detalle completo.',
      position: 'bottom' as const,
    },
    {
      id: 'estado-obra',
      target: '[data-onboarding="estado-obra"]',
      title: 'Estado de la obra',
      description: 'El badge de estado indica si la obra está ACTIVA (en curso), PAUSADA (temporalmente detenida), FINALIZADA (completada) o CANCELADA. Podés cambiar el estado desde el detalle de la obra.',
      position: 'right' as const,
    },
    {
      id: 'acciones-obra',
      target: '[data-onboarding="acciones-obra"]',
      title: 'Acciones sobre la obra',
      description: 'Con estos botones podés: VER (abrir el detalle completo), EDITAR (modificar información básica) o ELIMINAR (borrar la obra permanentemente).',
      position: 'top' as const,
    },
  ],
  tareas: [
    {
      id: 'cargar-elementos',
      target: '[data-onboarding="cargar-elementos"]',
      title: 'Agregá los elementos de tu obra',
      description: 'Cargá paredes, techos, pisos y otros componentes. Cada elemento generará tareas automáticamente según el tipo de construcción. Primero seleccioná una obra y luego hacé click en "Organiza".',
      position: 'bottom' as const,
    },
    {
      id: 'organizar-tareas',
      target: '[data-onboarding="organizar-tareas"]',
      title: 'Organizá el flujo de trabajo',
      description: 'Arrastrá las tareas al lienzo para definir el orden. El sistema calculará automáticamente el camino crítico y la duración del proyecto.',
      position: 'top' as const,
    },
  ],
  'detalle-obra': [
    {
      id: 'progreso-general',
      target: '[data-onboarding="progreso-general"]',
      title: 'Progreso general de la obra',
      description: 'Acá podés ver el porcentaje de avance general del proyecto. Se calcula automáticamente según las tareas completadas y los elementos cargados.',
      position: 'bottom' as const,
    },
    {
      id: 'editar-informacion',
      target: '[data-onboarding="editar-informacion"]',
      title: 'Editar información de la obra',
      description: 'Usá este botón para modificar los datos básicos de la obra: nombre, cliente, tipo, ubicación, plantas y superficies.',
      position: 'left' as const,
    },
    {
      id: 'tabs-navegacion',
      target: '[data-onboarding="tabs-navegacion"]',
      title: 'Navegación entre secciones',
      description: 'Acá podés cambiar entre las diferentes vistas: RESUMEN (métricas y estadísticas), ELEMENTOS (cargar componentes constructivos) y LEGAJO (documentos técnicos).',
      position: 'bottom' as const,
    },
    {
      id: 'estadisticas-metros',
      target: '[data-onboarding="estadisticas-metros"]',
      title: 'Estadísticas de metros',
      description: 'Estas tarjetas muestran los metros totales, cubiertos y descubiertos de la obra. Los valores se actualizan automáticamente según las plantas y elementos cargados.',
      position: 'bottom' as const,
    },
    {
      id: 'plantas-proyecto',
      target: '[data-onboarding="plantas-proyecto"]',
      title: 'Plantas del proyecto',
      description: 'Seleccioná una planta para ver sus métricas específicas. Cada planta tiene su propio progreso, elementos y tareas asociadas.',
      position: 'right' as const,
    },
    {
      id: 'acciones-rapidas',
      target: '[data-onboarding="acciones-rapidas"]',
      title: 'Acciones rápidas',
      description: 'Botones de acceso rápido: VER ELEMENTOS (ir a la pestaña de elementos) y AGREGAR LEGAJO (subir documentos técnicos).',
      position: 'top' as const,
    },
  ],
};

// Pasos por defecto (para compatibilidad)
const DEFAULT_STEPS = [
  {
    id: 'crear-obra',
    target: '[data-onboarding="crear-obra"]',
    title: 'Crea tu primera obra',
    description: 'Empezá definiendo el proyecto. Acá podrás agregar el nombre, dirección y tipo de construcción.',
    position: 'bottom' as const,
  },
];

export function useOnboardingCliente(section?: string) {
  const contextValue = useOnboardingContext();
  const pathname = usePathname();
  const [detectedSection, setDetectedSection] = useState<string | null>(null);

  // Detectar la sección actual del DOM
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectSection = () => {
      // Detectar si estamos en el detalle de obra
      const isDetalleObra = document.querySelector('[data-onboarding-section="detalle-obra"]') !== null;
      if (isDetalleObra) {
        setDetectedSection('detalle-obra');
        return;
      }
      setDetectedSection(null);
    };

    // Detectar inmediatamente
    detectSection();

    // Observar cambios en el DOM
    const observer = new MutationObserver(detectSection);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname]);

  // Determinar la sección actual
  const currentSection = section || detectedSection || (() => {
    if (pathname?.includes('/obras')) return 'obras';
    if (pathname?.includes('/tareas')) return 'tareas';
    return null;
  })();

  // Obtener los pasos para la sección actual
  const steps = useMemo(() => {
    // Si no hay sección detectada, retornar array vacío en lugar de DEFAULT_STEPS
    if (!currentSection) {
      return [];
    }

    let baseSteps = ONBOARDING_STEPS_BY_SECTION[currentSection];
    
    // Si no hay pasos para esta sección, retornar array vacío
    if (!baseSteps) {
      return [];
    }

    // Filtrar pasos que requieren elementos que no existen (solo en cliente)
    if (typeof window !== 'undefined') {
      baseSteps = baseSteps.filter(step => {
        // Verificar si el elemento target existe en el DOM
        const targetExists = document.querySelector(step.target) !== null;
        
        // Si no existe, filtrarlo
        if (!targetExists) {
          return false;
        }
        
        // Si el paso requiere una card de obra, verificar que exista al menos una
        if (currentSection === 'obras' && (step.id === 'card-obra' || step.id === 'estado-obra' || step.id === 'acciones-obra')) {
          const hasObras = document.querySelectorAll('[data-onboarding="card-obra"]').length > 0;
          return hasObras;
        }
        
        return true;
      });
    }

    return baseSteps;
  }, [currentSection, detectedSection]);

  return {
    isActive: contextValue.isActive,
    currentStepIndex: contextValue.currentStepIndex,
    steps,
    startOnboarding: contextValue.startOnboarding,
    stopOnboarding: contextValue.stopOnboarding,
    completeOnboarding: contextValue.completeOnboarding,
    setStepIndex: contextValue.setStepIndex,
  };
}

