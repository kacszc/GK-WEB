import { Plus } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Pill } from "@/components/ui/Pill";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";
import { HeaderAuth } from "./HeaderAuth";
import { getI18n } from "@/i18n/server";

export async function Header() {
  const { t } = await getI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 md:flex">
          <a href="/pricing" className="text-sm font-medium text-ink-2 hover:text-ink">
            {t("nav.pricing")}
          </a>
          <a href="#" className="text-sm font-medium text-ink-2 hover:text-ink">
            {t("nav.howItWorks")}
          </a>
          <Pill
            as="a"
            href="/post-job"
            className="border border-line-2 bg-pill text-ink hover:bg-line-2"
          >
            <Plus className="h-4 w-4" />
            {t("nav.addJob")}
          </Pill>
          <LanguageSwitcher />
          <HeaderAuth />
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
