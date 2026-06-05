import { MapPin, ChevronDown, Plus } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getI18n } from "@/i18n/server";

export async function Header() {
  const { t } = await getI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Logo />
          <Pill className="hidden border border-line-2 bg-pill text-xs text-ink sm:inline-flex">
            <MapPin className="h-3.5 w-3.5 text-ink-3" />
            Warszawa
            <ChevronDown className="h-3.5 w-3.5 text-ink-3" />
          </Pill>
        </div>

        {/* Right */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <a href="#" className="hidden text-sm font-medium text-ink-2 hover:text-ink md:inline">
            {t("nav.pricing")}
          </a>
          <a href="#" className="hidden text-sm font-medium text-ink-2 hover:text-ink md:inline">
            {t("nav.howItWorks")}
          </a>
          <Pill
            as="button"
            className="hidden border border-line-2 bg-pill text-ink hover:bg-line-2 lg:inline-flex"
          >
            <Plus className="h-4 w-4" />
            {t("nav.addJob")}
          </Pill>
          <LanguageSwitcher />
          <a href="#" className="hidden text-sm font-medium text-ink-2 hover:text-ink sm:inline">
            {t("nav.login")}
          </a>
          <Button variant="dark" className="rounded-full px-4 py-2 text-sm">
            {t("nav.register")}
          </Button>
        </nav>
      </div>
    </header>
  );
}
