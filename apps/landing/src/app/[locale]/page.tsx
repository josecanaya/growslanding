import { Navigation } from "../../components/Navigation";
import { Hero } from "../../components/Hero";
import { IntegratedSolutionSection } from "../../components/IntegratedSolutionSection";
import { PricingSection } from "../../components/PricingSection";
import { UserProfiles } from "../../components/UserProfiles";
import { CTASection } from "../../components/CTASection";
import { Footer } from "../../components/Footer";
import { setRequestLocale } from "next-intl/server";

type Props = { params: { locale: string } };

export default function HomePage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Hero />
        <IntegratedSolutionSection />
        <PricingSection />
        <UserProfiles />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
