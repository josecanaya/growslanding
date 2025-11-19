'use client';

import { OnboardingCliente } from '@/components/onboarding/OnboardingCliente';
import { useOnboardingCliente } from '@/hooks/useOnboardingCliente';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <ClienteLayoutContent>{children}</ClienteLayoutContent>
    </OnboardingProvider>
  );
}

function ClienteLayoutContent({ children }: { children: React.ReactNode }) {
  const { isActive, currentStepIndex, steps, stopOnboarding, completeOnboarding, setStepIndex } = useOnboardingCliente();

  return (
    <>
      {children}
      <OnboardingCliente
        steps={steps}
        isActive={isActive}
        currentStepIndex={currentStepIndex}
        onClose={stopOnboarding}
        onComplete={completeOnboarding}
        onStepChange={setStepIndex}
      />
    </>
  );
}

