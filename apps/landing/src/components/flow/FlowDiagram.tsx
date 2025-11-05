'use client';

import { motion } from 'framer-motion';
import { growsFlow, FlowNode, FlowStep } from '@/data/growsFlow';

interface FlowDiagramProps {
  activeStep: number;
  onStepClick?: (stepId: number) => void;
}

const nodePositions: Record<FlowNode, { x: number; y: number; radius: number }> = {
  'GROWS Core': { x: 50, y: 50, radius: 10 },
  'Cliente técnico': { x: 20, y: 20, radius: 6 },
  'Obra': { x: 30, y: 20, radius: 6 },
  'Plantillas': { x: 40, y: 20, radius: 6 },
  'Tareas': { x: 60, y: 40, radius: 6 },
  'Socio constructor': { x: 80, y: 40, radius: 6 },
  'Evidencias': { x: 90, y: 40, radius: 6 },
  'Validación': { x: 30, y: 80, radius: 6 },
  'Pagos': { x: 20, y: 80, radius: 6 },
  'KPIs/Reportes': { x: 70, y: 80, radius: 6 },
};

export default function FlowDiagram({ activeStep, onStepClick }: FlowDiagramProps) {
  const currentFlow = growsFlow.find(f => f.id === activeStep);
  
  const getNodePosition = (nodeName: FlowNode) => {
    return nodePositions[nodeName] || { x: 50, y: 50, radius: 6 };
  };

  const getPathData = (source: FlowNode, target: FlowNode) => {
    const sourcePos = getNodePosition(source);
    const targetPos = getNodePosition(target);
    
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    
    const offset = 20;
    return `M ${sourcePos.x + offset},${sourcePos.y} Q ${sourcePos.x + offset + dx/2},${sourcePos.y + dy/2} ${targetPos.x - offset},${targetPos.y}`;
  };

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Líneas inactivas */}
        {growsFlow.map((step, idx) => {
          if (idx + 1 === activeStep) return null;
          const pathData = getPathData(step.source, step.target);
          return (
            <motion.path
              key={`inactive-${step.id}`}
              d={pathData}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          );
        })}

        {/* Línea activa */}
        {currentFlow && (
          <motion.path
            d={getPathData(currentFlow.source, currentFlow.target)}
            fill="none"
            stroke="#FACC15"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))',
            }}
          />
        )}

        {/* Nodos */}
        {Object.entries(nodePositions).map(([name, pos]) => (
          <g key={name}>
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r={pos.radius}
              fill={name === 'GROWS Core' ? '#FACC15' : '#94A3B8'}
              stroke={name === (currentFlow?.source || currentFlow?.target) ? '#FACC15' : '#E2E8F0'}
              strokeWidth={name === (currentFlow?.source || currentFlow?.target) ? '1' : '0.5'}
              animate={{
                scale: name === (currentFlow?.source || currentFlow?.target) ? 1.2 : 1,
                opacity: name === (currentFlow?.source || currentFlow?.target) ? 1 : 0.6,
              }}
              transition={{ duration: 0.3 }}
              className="cursor-pointer"
              onClick={() => onStepClick && onStepClick(activeStep)}
            />
            <text
              x={pos.x}
              y={pos.y + pos.radius + 4}
              textAnchor="middle"
              fontSize="2"
              fill="#64748B"
              className="pointer-events-none"
            >
              {name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

