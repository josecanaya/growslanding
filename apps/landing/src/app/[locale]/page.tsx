import { Navigation } from "@/components/navigation/Navigation";
import { Hero } from "@/components/hero/Hero";
import { SolutionsSection } from "@/components/sections/landing/SolutionsSection";
import { PricingSection } from "@/components/sections/landing/PricingSection";
import { UserProfiles } from "@/components/sections/landing/UserProfiles";
import { EcosystemSection } from "@/components/sections/landing/EcosystemSection";
import { Footer } from "@/components/footer/Footer";
import { StorytellingFlow } from "@/components/sections/landing/StorytellingFlow";
import { setRequestLocale } from "next-intl/server";
import { GrowsBot } from "@/components/chat/GrowsBot";
import { SectionDivider } from "@/components/SectionDivider";

type Props = { params: { locale: string } };

export default function HomePage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Hero />
        <SolutionsSection />
        <StorytellingFlow />
        <SectionDivider />
        <UserProfiles />
        <EcosystemSection />
        <PricingSection />
      </main>
      <Footer />
      <GrowsBot />
    </div>
  );
}
