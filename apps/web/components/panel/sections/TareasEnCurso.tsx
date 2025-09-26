'use client';

import { useState } from 'react';
import { CheckSquare, Play, Pause, Upload, ChevronRight } from 'lucide-react';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface TareasEnCursoProps {
  user: User;
}

interface Task {
  id: number;
  title: string;
  stage: string;
  progress: number;
  items: TaskItem[];
}

interface TaskItem {
  id: number;
  title: string;
  completed: boolean;
  evidence?: string;
}

export function TareasEnCurso({ user }: TareasEnCursoProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tasks: Task[] = [
    {
      id: 1,
      title: 'Replanteo de cimientos',
      stage: 'Replanteo',
      progress: 60,
      items: [
        { id: 1, title: 'Marcar ejes principales', completed: true },
        { id: 2, title: 'Verificar niveles', completed: true },
        { id: 3, title: 'Marcar puntos de excavación', completed: false },
        { id: 4, title: 'Documentar con fotos', completed: false },
      ]
    },
    {
      id: 2,
      title: 'Ejecución de estructura',
      stage: 'Ejecución',
      progress: 30,
      items: [
        { id: 1, title: 'Armar encofrados', completed: true },
        { id: 2, title: 'Colocar hierros', completed: false },
        { id: 3, title: 'Hormigonar', completed: false },
        { id: 4, title: 'Desencofrar', completed: false },
      ]
    }
  ];

  const stages = ['Replanteo', 'Ejecución', 'Finalización'];

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleItemToggle = (taskId: number, itemId: number) => {
    if (selectedTask && selectedTask.id === taskId) {
      const updatedTask = {
        ...selectedTask,
        items: selectedTask.items.map(item =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      };
      setSelectedTask(updatedTask);
    }
  };

  const handleSwipeNext = () => {
    if (selectedTask) {
      const currentStageIndex = stages.indexOf(selectedTask.stage);
      if (currentStageIndex < stages.length - 1) {
        const updatedTask = {
          ...selectedTask,
          stage: stages[currentStageIndex + 1],
          progress: Math.min(100, selectedTask.progress + 20)
        };
        setSelectedTask(updatedTask);
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-dark mb-6">Tareas en Curso</h2>
      
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-light rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-dark">{task.title}</h3>
                <p className="text-dark/70">Etapa: {task.stage}</p>
              </div>
              <button
                onClick={() => handleTaskClick(task)}
                className="bg-accent text-dark px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors duration-200 flex items-center space-x-2"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Ver checklist</span>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-dark/70 mb-2">
                <span>Progreso</span>
                <span>{task.progress}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1">
                  <Play className="h-3 w-3" />
                  <span>Iniciar</span>
                </button>
                <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1">
                  <Pause className="h-3 w-3" />
                  <span>Pausar</span>
                </button>
              </div>
              <button className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary/90 transition-colors duration-200 flex items-center space-x-1">
                <Upload className="h-3 w-3" />
                <span>Subir evidencia</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal del Checklist */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-dark">{selectedTask.title}</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-dark/70 hover:text-dark"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3 mb-6">
                {selectedTask.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleItemToggle(selectedTask.id, item.id)}
                      className="w-4 h-4 text-accent rounded"
                    />
                    <span className={`flex-1 ${item.completed ? 'line-through text-dark/50' : 'text-dark'}`}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSwipeNext}
                  className="flex-1 bg-accent text-dark py-2 px-4 rounded-lg hover:bg-accent/90 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Avanzar etapa</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-dark/20 text-dark rounded-lg hover:bg-light transition-colors duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
