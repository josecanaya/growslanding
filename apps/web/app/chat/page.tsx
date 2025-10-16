'use client';

import { ChatSection } from '@/components/clienteTecnico/ChatSection';

/**
 * Página de ejemplo mostrando el ChatSection integrado
 * con el estilo Gemini exacto y branding GROWS
 */
export default function ChatPage() {
  return (
    <div className="min-h-screen bg-white">
      <ChatSection userName="Jose" />
    </div>
  );
}
