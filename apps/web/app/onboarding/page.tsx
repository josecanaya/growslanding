import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  // Redirigir a la página de onboarding del cliente
  redirect('/cliente/onboarding');
}

