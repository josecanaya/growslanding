import { Lightbulb } from 'lucide-react';

interface TutorialButtonProps {
  onClick: () => void;
  className?: string;
  'data-onboarding'?: string;
}

export default function TutorialButton({ onClick, className = '', 'data-onboarding': dataOnboarding }: TutorialButtonProps) {
  return (
    <button
      onClick={onClick}
      data-onboarding={dataOnboarding}
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5
        rounded-lg
        border border-[#FFD168]
        bg-[#FFD16822]
        text-[#B88A00] font-semibold text-sm
        transition-all duration-200
        hover:bg-[#FFD16833] hover:border-[#E2B043]
        cursor-pointer
        ${className}
      `}
    >
      <Lightbulb size={16} />
      Ver tutorial
    </button>
  );
}

