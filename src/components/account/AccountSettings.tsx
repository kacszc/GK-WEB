"use client";

import { useState } from "react";
import { Check, Download, FileClock, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";
import { Toggle as Switch } from "@/components/ui/Toggle";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

export function AccountSettings() {
  const { t } = useI18n();
  const { user, ready, signOut } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [notif, setNotif] = useState({ email: true, push: true, sms: false });
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const input = cn(inputClass(), "mt-1.5");

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // While the session is being restored, show a form-shaped skeleton instead of
  // inputs seeded with empty values.
  if (!ready) {
    return <SettingsSkeleton title={t("account.settingsTitle")} />;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("account.settingsTitle")}</h1>

      <section className="rounded-panel border border-line-3 bg-surface p-6">
        <h2 className="text-[15px] font-semibold text-ink">{t("account.sectionProfile")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("auth.name")}</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </div>
          <div>
            <Label>{t("auth.email")}</Label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
          <div>
            <Label>{t("account.phone")}</Label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+48 …" className={input} />
          </div>
        </div>
      </section>

      <section className="rounded-panel border border-line-3 bg-surface p-6">
        <h2 className="text-[15px] font-semibold text-ink">{t("account.sectionPrefs")}</h2>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-ink">{t("account.interfaceLang")}</span>
          <LanguageSwitcher />
        </div>
        <hr className="my-4 border-line" />
        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
          <Bell className="h-3.5 w-3.5" />
          {t("account.notifications")}
        </p>
        <div className="flex flex-col gap-1">
          <ToggleRow label={t("account.notifEmail")} on={notif.email} onChange={(v) => setNotif((n) => ({ ...n, email: v }))} />
          <ToggleRow label={t("account.notifPush")} on={notif.push} onChange={(v) => setNotif((n) => ({ ...n, push: v }))} />
          <ToggleRow label={t("account.notifSms")} on={notif.sms} onChange={(v) => setNotif((n) => ({ ...n, sms: v }))} />
        </div>
      </section>

      {/* Privacy & GDPR */}
      <section className="rounded-panel border border-line-3 bg-surface p-6">
        <h2 className="text-[15px] font-semibold text-ink">{t("account.gdprTitle")}</h2>
        <div className="mt-3 flex items-start gap-2 rounded-tile bg-[#eef1ff] px-3.5 py-2.5 text-[12px] text-[#1f3a8a]">
          <span aria-hidden>ℹ️</span>
          <span>{t("account.gdprInfo")}</span>
        </div>
        <div className="mt-3 divide-y divide-line">
          <GdprRow
            icon={<Download className="h-4 w-4 text-ink-3" />}
            title={t("account.exportData")}
            desc={t("account.exportDesc")}
            action={<Button variant="outline" className="rounded-tile px-3.5 py-2 text-[13px]">{t("account.exportBtn")}</Button>}
          />
          <GdprRow
            icon={<Bell className="h-4 w-4 text-ink-3" />}
            title={t("account.marketingConsent")}
            desc={t("account.marketingDesc")}
            action={<Button variant="outline" className="rounded-tile px-3.5 py-2 text-[13px]">{t("account.changeConsent")}</Button>}
          />
          <GdprRow
            icon={<FileClock className="h-4 w-4 text-ink-3" />}
            title={t("account.consentHistory")}
            desc={t("account.consentHistoryDesc")}
            action={<Button variant="outline" className="rounded-tile px-3.5 py-2 text-[13px]">{t("account.view")}</Button>}
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button variant="dark" onClick={save} className="rounded-tile px-5 py-2.5 text-sm">
          {t("account.save")}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-success">
            <Check className="h-4 w-4" />
            {t("account.saved")}
          </span>
        )}
      </div>

      {/* Danger zone */}
      <section className="rounded-panel border border-danger/40 bg-danger/5 p-6">
        <h2 className="text-[15px] font-semibold text-danger">{t("account.dangerZone")}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{t("account.dangerDesc")}</p>
        <div className="mt-4 divide-y divide-danger/15">
          <GdprRow
            title={t("account.deactivate")}
            desc={t("account.deactivateDesc")}
            action={<Button variant="outline" className="rounded-tile border-danger/40 px-3.5 py-2 text-[13px] text-danger">{t("account.deactivateBtn")}</Button>}
          />
          <GdprRow
            title={t("account.deleteAccount")}
            desc={t("account.deleteDesc")}
            action={
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(true)}
                className="rounded-tile border-danger/40 px-3.5 py-2 text-[13px] text-danger"
              >
                {t("account.deleteBtn")}
              </Button>
            }
          />
        </div>
      </section>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t("account.deleteAccount")}>
        <p className="text-sm leading-relaxed text-ink-2">{t("account.dangerDesc")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(false)} className="rounded-tile px-4 py-2.5 text-sm">
            {t("portfolio.cancel")}
          </Button>
          <Button
            variant="dark"
            onClick={() => {
              setConfirmDelete(false);
              signOut();
            }}
            className="rounded-tile bg-danger px-4 py-2.5 text-sm hover:bg-danger/90"
          >
            {t("account.deleteBtn")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function SettingsSkeleton({ title }: { title: string }) {
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{title}</h1>
      {Array.from({ length: 2 }).map((_, s) => (
        <section key={s} className="rounded-panel border border-line-3 bg-surface p-6">
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, f) => (
              <div key={f} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-11 w-full rounded-tile" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-ink-3">{children}</label>;
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm text-ink">
      {label}
      <Switch on={on} onChange={onChange} />
    </div>
  );
}

function GdprRow({
  icon,
  title,
  desc,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  desc: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-2.5">
        {icon && <span className="mt-0.5">{icon}</span>}
        <div>
          <p className="text-[13px] font-semibold text-ink">{title}</p>
          <p className="text-[12px] text-ink-3">{desc}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
