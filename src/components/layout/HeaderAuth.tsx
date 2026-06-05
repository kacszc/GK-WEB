"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Popover } from "@/components/ui/Popover";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

export function HeaderAuth() {
  const { user, ready, signOut } = useAuth();
  const { t } = useI18n();

  if (ready && user) {
    return (
      <Popover
        align="end"
        panelClassName="w-52 p-1.5"
        trigger={({ open }) => (
          <span
            className={`flex items-center gap-2 rounded-full border border-line-2 py-1 pl-1 pr-3 transition-colors ${
              open ? "bg-muted" : "hover:bg-muted"
            }`}
          >
            <Avatar name={user.name} index={0} size={28} />
            <span className="hidden max-w-28 truncate text-sm font-medium text-ink sm:inline">
              {user.name}
            </span>
          </span>
        )}
      >
        {({ close }) => (
          <div>
            <div className="truncate px-3 py-2 text-[12px] text-ink-3">{user.email}</div>
            <button
              onClick={() => {
                signOut();
                close();
              }}
              className="flex w-full items-center gap-2 rounded-tile px-3 py-2 text-left text-sm text-ink hover:bg-muted"
            >
              <LogOut className="h-4 w-4 text-ink-3" />
              {t("auth.logout")}
            </button>
          </div>
        )}
      </Popover>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="hidden text-sm font-medium text-ink-2 hover:text-ink sm:inline"
      >
        {t("nav.login")}
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-bold text-on-dark transition-colors hover:bg-ink/90"
      >
        {t("nav.register")}
      </Link>
    </>
  );
}
