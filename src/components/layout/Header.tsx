import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";
import { HeaderAuth } from "./HeaderAuth";
import { HeaderCta } from "./HeaderCta";
import { HeaderMobileAuth } from "./HeaderMobileAuth";
import { getI18n } from "@/i18n/server";

export async function Header() {
  const { t } = await getI18n();

  return (
    <header className="pt-safe sticky top-0 z-50 border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Logo href="/" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 md:flex">
          <a href="/pricing" className="text-sm font-medium text-ink-2 hover:text-ink">
            {t("nav.pricing")}
          </a>
          <a href="/how-it-works" className="text-sm font-medium text-ink-2 hover:text-ink">
            {t("nav.howItWorks")}
          </a>
          <HeaderCta />
          <LanguageSwitcher />
          <HeaderAuth />
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Messages + notifications shortcuts (signed in) — same controls as the app top bars. */}
          <HeaderMobileAuth />
          <LanguageSwitcher />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
