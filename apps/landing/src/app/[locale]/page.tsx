import {useTranslations} from 'next-intl';
import {Navigation} from '@/components/Navigation';
import {Hero} from '@/components/Hero';
import {ProblemSection} from '@/components/ProblemSection';
import {SolutionSection} from '@/components/SolutionSection';
import {UserProfiles} from '@/components/UserProfiles';
import {CTASection} from '@/components/CTASection';
import {Footer} from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <UserProfiles />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
