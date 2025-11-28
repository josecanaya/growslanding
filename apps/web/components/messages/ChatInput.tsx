'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onEnviar: (texto: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Input para escribir y enviar mensajes
 */
export function ChatInput({ onEnviar, disabled = false, placeholder = 'Escribí un mensaje…' }: ChatInputProps) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async () => {
    const textoTrimmed = texto.trim();
    if (!textoTrimmed || enviando || disabled) return;

    setEnviando(true);
    try {
      await onEnviar(textoTrimmed);
      setTexto('');
    } catch (error) {
      console.error('[ChatInput] Error al enviar:', error);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleEnviar();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || enviando}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Button
          onClick={handleEnviar}
          disabled={!texto.trim() || enviando || disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Enviar</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

