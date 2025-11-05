'use client';

import { useState, useEffect, useRef } from 'react';
import { sampleTasks, Task } from '@/data/cpm/sampleProject';
import { computeCPM, CpmNode } from './utils/cpm';
import { layoutByLevels, Positioned } from './utils/layout';
import TaskNode from './TaskNode';
import Legend from './Legend';

export default function CpmDiagram() {
  const [tasks] = useState<Task[]>(sampleTasks);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const result = computeCPM(tasks);
  const layoutOpts = {
    width,
    colWidth: width < 1024 ? 150 : 180,
    colGap: width < 1024 ? 24 : 32,
    rowGap: width < 1024 ? 60 : 70,
    rowHeight: width < 1024 ? 110 : 120,
  };
  const { P: positionedNodes, size } = layoutByLevels(result.nodes, result.edges, layoutOpts);

  const getNodePosition = (id: string): Positioned | undefined => {
    return positionedNodes.find(n => n.id === id);
  };

  const getBezierPath = (from: Positioned, to: Positioned) => {
    const fromX = from.x + from.w;
    const fromY = from.y + from.h / 2;
    const toX = to.x;
    const toY = to.y + to.h / 2;
    
    // Control points con offset más grande para evitar cruces
    const offset = 80;
    const verticalAdjust = Math.abs(toY - fromY) > 100 ? 50 : 0;
    
    return `M ${fromX} ${fromY} C ${fromX + offset} ${fromY + verticalAdjust}, ${toX - offset} ${toY - verticalAdjust}, ${toX} ${toY}`;
  };

  return (
    <div className="w-full py-12 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
            Camino <span className="text-yellow-600">Crítico (CPM)</span>
          </h3>
          <p className="text-sm md:text-base text-gray-700">
            GROWS calcula automáticamente el camino crítico. Si una tarea cambia de duración,
            el sistema recalcula y muestra el nuevo flujo óptimo.
          </p>
        </div>

        {/* Diagram Container - Sin contenedor, directamente en canvas */}
        <div 
          ref={containerRef}
          className="overflow-x-auto py-6"
        >
          <div className="relative" style={{ height: `${size.height}px`, width: `${size.width}px`, minWidth: '100%' }}>
            
            {/* SVG for arrows */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none" 
              style={{ overflow: 'visible' }}
            >
              {/* Non-critical edges */}
              {result.edges.map((edge, i) => {
                const from = getNodePosition(edge.from);
                const to = getNodePosition(edge.to);
                if (!from || !to) return null;
                
                const isCritical = result.cpmPath.includes(edge.from) && result.cpmPath.includes(edge.to);
                if (isCritical) return null;
                
                return (
                  <path
                    key={`edge-${i}`}
                    d={getBezierPath(from, to)}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                  />
                );
              })}

              {/* Critical path edges */}
              {result.edges
                .filter(edge => result.cpmPath.includes(edge.from) && result.cpmPath.includes(edge.to))
                .map((edge, i) => {
                  const from = getNodePosition(edge.from);
                  const to = getNodePosition(edge.to);
                  if (!from || !to) return null;
                  
                  return (
                    <path
                      key={`critical-${i}`}
                      d={getBezierPath(from, to)}
                      fill="none"
                      stroke="#FFC300"
                      strokeWidth="4"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(255, 195, 0, 0.5))',
                      }}
                    />
                  );
                })}
            </svg>

            {/* Task nodes */}
            {positionedNodes.map((node, index) => (
              <TaskNode
                key={node.id}
                p={{ x: node.x, y: node.y, w: node.w, h: node.h }}
                title={node.name}
                owner={node.owner}
                duration={node.duration}
                isCritical={node.slack === 0}
                meta={{
                  ES: node.ES,
                  EF: node.EF,
                  LS: node.LS,
                  LF: node.LF,
                  slack: node.slack,
                }}
                index={index}
              />
            ))}
          </div>

          {/* Footer info */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="text-lg font-bold text-gray-900">
              Duración del proyecto: <span className="text-yellow-600">{result.projectDuration} días</span>
            </div>
            <Legend />
          </div>
        </div>
      </div>
    </div>
  );
}
