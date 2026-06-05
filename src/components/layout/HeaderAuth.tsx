"use client";

import Link from "next/link";
import { LogOut, Coins, Bell, Settings, Briefcase, User as UserIcon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Popover } from "@/components/ui/Popover";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

export function HeaderAuth() {
  const { user, ready, signOut } = useAuth();
  const { t } = useI18n();

  // Logged in → tokens, notifications and an account menu.
  if (ready && user) {
    const roleItem =
      user.role === "employer"
        ? { icon: <Briefcase className="h-4 w-4 text-ink-3" />, label: t("auth.myJobs"), href: "/post-job" }
        : { icon: <UserIcon className="h-4 w-4 text-ink-3" />, label: t("auth.myProfile"), href: "#" };

    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="hidden items-center gap-1.5 rounded-full bg-pill px-3 py-1.5 text-xs font-semibold text-ink sm:inline-flex">
          <Coins className="h-3.5 w-3.5 text-[#e0a400]" />
          {t("results.tokens", { n: 27 })}
        </span>

        <button
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full border border-line-2 text-ink-2 hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-success ring-2 ring-surface" />
        </button>

        <Popover
          align="end"
          panelClassName="w-56 p-1.5"
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
            <div className="flex flex-col">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                <p className="truncate text-[12px] text-ink-3">{user.email}</p>
              </div>
              <hr className="my-1 border-line" />
              <MenuItem href={roleItem.href} onClick={close} icon={roleItem.icon}>
                {roleItem.label}
              </MenuItem>
              <MenuItem href="#" onClick={close} icon={<Settings className="h-4 w-4 text-ink-3" />}>
                {t("auth.settings")}
              </MenuItem>
              <hr className="my-1 border-line" />
              <button
                onClick={() => {
                  signOut();
                  close();
                }}
                className="flex items-center gap-2 rounded-tile px-3 py-2 text-left text-sm text-ink hover:bg-muted"
              >
                <LogOut className="h-4 w-4 text-ink-3" />
                {t("auth.logout")}
              </button>
            </div>
          )}
        </Popover>
      </div>
    );
  }

  // Logged out → log in / sign up.
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

function MenuItem({
  href,
  onClick,
  icon,
  children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-tile px-3 py-2 text-sm text-ink hover:bg-muted"
    >
      {icon}
      {children}
    </Link>
  );
}
