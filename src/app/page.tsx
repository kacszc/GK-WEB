import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { ProfessionChips } from "@/components/landing/ProfessionChips";
import { ActionCards } from "@/components/landing/ActionCards";
import { PopularSection } from "@/components/landing/PopularSection";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Reveal } from "@/components/ui/Reveal";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Reveal>
          <ProfessionChips />
        </Reveal>
        <Reveal>
          <ActionCards />
        </Reveal>
        <Reveal>
          <PopularSection />
        </Reveal>
        <Reveal>
          <TrustStrip />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
