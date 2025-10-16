'use client';

import { useState } from 'react';
import { ChatSection } from '@/components/clienteTecnico/ChatSection';
import { Card, Button, SectionLayout } from '@/components/ui/grows';
import { MessageCircle, Bot, Send, User } from 'lucide-react';

/**
 * Componente de demostración del ChatSection con estilo Gemini
 * Muestra todas las características implementadas
 */
export function ChatDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const [userName, setUserName] = useState('Usuario Demo');

  return (
    <SectionLayout
      title="Chat GROWS - Estilo Gemini"
      subtitle="Interfaz de chat centrada y sutil con branding GROWS"
    >
      {!showDemo ? (
        <div className="space-y-6">
          {/* Descripción del diseño */}
          <Card title="Características del Diseño">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-grows-primary mb-3">🎨 Estilo Visual</h4>
                <ul className="space-y-2 text-sm text-grows-text-secondary">
                  <li>• Fondo blanco limpio sin cards ni sombras</li>
                  <li>• Contenido centrado vertical y horizontalmente</li>
                  <li>• Columna de foco máximo 750px</li>
                  <li>• Estética muy sutil con mucho aire blanco</li>
                  <li>• Sin bordes visibles ni sombras duras</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-grows-primary mb-3">🎯 Branding GROWS</h4>
                <ul className="space-y-2 text-sm text-grows-text-secondary">
                  <li>• Azul petróleo (#0C1D36) para texto principal</li>
                  <li>• Dorado (#E8C547) para acentos e íconos</li>
                  <li>• Tipografía Rubik para el saludo</li>
                  <li>• Ícono dorado distintivo de GrowsBot</li>
                  <li>• Animaciones fade-in sutiles</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Configuración */}
          <Card title="Configuración">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-grows-primary mb-2">
                  Nombre del usuario
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
                  placeholder="Ingresá tu nombre"
                />
              </div>
              <Button
                onClick={() => setShowDemo(true)}
                variant="primary"
                icon={<MessageCircle className="h-4 w-4" />}
                className="w-full"
              >
                Abrir Chat Demo
              </Button>
            </div>
          </Card>

          {/* Características técnicas */}
          <Card title="Características Técnicas">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-grows-border rounded-grows-lg">
                <Bot className="h-8 w-8 text-grows-secondary mx-auto mb-2" />
                <h4 className="font-semibold text-grows-primary mb-1">Bot Inteligente</h4>
                <p className="text-sm text-grows-text-secondary">
                  Respuestas contextuales sobre construcción y gestión de obras
                </p>
              </div>
              <div className="text-center p-4 border border-grows-border rounded-grows-lg">
                <Send className="h-8 w-8 text-grows-secondary mx-auto mb-2" />
                <h4 className="font-semibold text-grows-primary mb-1">Interacción Fluida</h4>
                <p className="text-sm text-grows-text-secondary">
                  Auto-scroll, indicador de escritura, animaciones sutiles
                </p>
              </div>
              <div className="text-center p-4 border border-grows-border rounded-grows-lg">
                <User className="h-8 w-8 text-grows-secondary mx-auto mb-2" />
                <h4 className="font-semibold text-grows-primary mb-1">Responsive</h4>
                <p className="text-sm text-grows-text-secondary">
                  Adaptado para móviles con contenedores flexibles
                </p>
              </div>
            </div>
          </Card>

          {/* Código de ejemplo */}
          <Card title="Código de Ejemplo">
            <div className="bg-grows-neutral/30 rounded-grows-lg p-4">
              <pre className="text-sm text-grows-text-secondary overflow-x-auto">
{`import { ChatSection } from '@/components/clienteTecnico/ChatSection';

export default function MiChat() {
  return (
    <div className="min-h-screen bg-white">
      <ChatSection userName="Carlos Pérez" />
    </div>
  );
}`}
              </pre>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-grows-primary">
              Chat Demo - {userName}
            </h3>
            <Button
              onClick={() => setShowDemo(false)}
              variant="ghost"
              size="sm"
            >
              ← Volver
            </Button>
          </div>
          
          <div className="border border-grows-border rounded-grows-lg overflow-hidden">
            <ChatSection userName={userName} />
          </div>
        </div>
      )}
    </SectionLayout>
  );
}
