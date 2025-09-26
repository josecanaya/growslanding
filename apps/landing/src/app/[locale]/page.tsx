import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { WhatIsSection } from "@/components/WhatIsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ConstructorSection } from "@/components/ConstructorSection";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { setRequestLocale } from "next-intl/server";

type Props = { params: { locale: string } };

export default function HomePage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Hero />
        <WhatIsSection />
        <FeaturesSection />
        <ConstructorSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
