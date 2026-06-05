"use client";

import { Menu, X, Plus } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";

export function MobileNav() {
  const { t } = useI18n();

  return (
    <Popover
      align="end"
      panelClassName="w-[240px] p-2"
      trigger={({ open }) => (
        <span
          className="grid h-10 w-10 place-items-center rounded-tile border border-line-2 bg-pill text-ink"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </span>
      )}
    >
      {({ close }) => (
        <nav className="flex flex-col gap-0.5">
          <MenuLink onClick={close}>{t("nav.pricing")}</MenuLink>
          <MenuLink onClick={close}>{t("nav.howItWorks")}</MenuLink>
          <MenuLink href="/post-job" onClick={close}>
            <Plus className="h-4 w-4" />
            {t("nav.addJob")}
          </MenuLink>
          <hr className="my-2 border-line" />
          <MenuLink onClick={close}>{t("nav.login")}</MenuLink>
          <Button
            variant="dark"
            onClick={close}
            className="mt-1 w-full rounded-full px-4 py-2.5 text-sm"
          >
            {t("nav.register")}
          </Button>
        </nav>
      )}
    </Popover>
  );
}

function MenuLink({
  children,
  onClick,
  href = "#",
}: {
  children: React.ReactNode;
  onClick: () => void;
  href?: string;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-tile px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-muted"
    >
      {children}
    </a>
  );
}
