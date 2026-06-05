import { SearchToggle } from "./SearchToggle";
import { HeroSearch } from "./HeroSearch";
import { getI18n } from "@/i18n/server";

export async function Hero() {
  const { t } = await getI18n();

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 px-4 pb-8 pt-12 sm:px-8 sm:pt-16">
      <SearchToggle />

      <h1 className="animate-fade-up text-center text-4xl font-bold leading-[1.05] tracking-[-1.5px] text-ink sm:text-5xl">
        {t("hero.title")}
      </h1>

      <HeroSearch />
    </section>
  );
}
