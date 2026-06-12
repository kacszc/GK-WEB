import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { ProfessionChips } from "@/components/landing/ProfessionChips";
import { RecentlyViewed } from "@/components/landing/RecentlyViewed";
import { ActionCards } from "@/components/landing/ActionCards";
import { PopularSection } from "@/components/landing/PopularSection";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Reveal } from "@/components/ui/Reveal";
import { redirect } from "next/navigation";
import { landingService } from "@/services";
import { getI18n } from "@/i18n/server";
import type { Landing } from "@/lib/types";

export default async function Home() {
  const { locale } = await getI18n();
  // Whole landing page in one backend call (auth-aware: personalized when signed in).
  // If the backend is unreachable, send visitors to the maintenance page rather than a broken
  // home (redirect() throws its NEXT_REDIRECT signal from the catch, so it isn't swallowed).
  let landing: Landing;
  try {
    landing = await landingService.getLanding({ locale });
  } catch {
    redirect("/maintenance");
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero seedKeys={landing.searchKeys} />
        <Reveal>
          <ProfessionChips items={landing.popular} />
        </Reveal>
        <Reveal>
          <RecentlyViewed serverRecent={landing.recent} />
        </Reveal>
        <Reveal>
          <ActionCards />
        </Reveal>
        <Reveal>
          <PopularSection trending={landing.trending} liveStats={landing.liveStats} />
        </Reveal>
        <Reveal>
          <TrustStrip />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
