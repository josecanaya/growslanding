import { HelpCircle, BookOpen } from 'lucide-react';

interface TutorialButtonProps {
  onClick: () => void;
  className?: string;
  'data-onboarding'?: string;
  variant?: 'inline' | 'fixed';
}

export default function TutorialButton({ 
  onClick, 
  className = '', 
  'data-onboarding': dataOnboarding,
  variant = 'inline'
}: TutorialButtonProps) {
  // Variante fixed: botón flotante en esquina inferior izquierda
  if (variant === 'fixed') {
    return (
      <button
        onClick={onClick}
        data-onboarding={dataOnboarding}
        className={`
          fixed bottom-6 left-6 z-50
          inline-flex items-center gap-3
          px-5 py-3
          rounded-xl shadow-lg
          bg-gradient-to-r from-[#CBA135] to-[#E2B043]
          text-white font-semibold text-base
          transition-all duration-200
          hover:from-[#E2B043] hover:to-[#F5C757] hover:shadow-xl
          hover:scale-105
          active:scale-95
          cursor-pointer
          group
          ${className}
        `}
        aria-label="Abrir tutorial"
      >
        <HelpCircle size={22} className="group-hover:rotate-12 transition-transform" />
        <span>Ayuda</span>
      </button>
    );
  }

  // Variante inline: botón mejorado para uso inline
  return (
    <button
      onClick={onClick}
      data-onboarding={dataOnboarding}
      className={`
        inline-flex items-center gap-2.5
        px-5 py-3
        rounded-xl
        bg-gradient-to-r from-[#CBA135] to-[#E2B043]
        text-white font-semibold text-base
        transition-all duration-200
        hover:from-[#E2B043] hover:to-[#F5C757]
        hover:shadow-lg hover:scale-105
        active:scale-95
        cursor-pointer
        group
        ${className}
      `}
      aria-label="Ver tutorial"
    >
      <BookOpen size={20} className="group-hover:rotate-6 transition-transform" />
      <span>Ver tutorial</span>
    </button>
  );
}

