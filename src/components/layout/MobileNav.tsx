"use client";

import { Menu, X, Plus, LogOut } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/AuthProvider";

export function MobileNav() {
  const { t } = useI18n();
  const { user, ready, signOut } = useAuth();

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
          <MenuLink href="/pricing" onClick={close}>{t("nav.pricing")}</MenuLink>
          <MenuLink onClick={close}>{t("nav.howItWorks")}</MenuLink>
          <MenuLink href="/post-job" onClick={close}>
            <Plus className="h-4 w-4" />
            {t("nav.addJob")}
          </MenuLink>
          <hr className="my-2 border-line" />
          {ready && user ? (
            <>
              <span className="truncate px-3 py-1 text-[12px] text-ink-3">{user.email}</span>
              <button
                onClick={() => {
                  signOut();
                  close();
                }}
                className="flex items-center gap-2 rounded-tile px-3 py-2.5 text-sm font-medium text-ink hover:bg-muted"
              >
                <LogOut className="h-4 w-4 text-ink-3" />
                {t("auth.logout")}
              </button>
            </>
          ) : (
            <>
              <MenuLink href="/login" onClick={close}>
                {t("nav.login")}
              </MenuLink>
              <a
                href="/register"
                onClick={close}
                className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-on-dark"
              >
                {t("nav.register")}
              </a>
            </>
          )}
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
