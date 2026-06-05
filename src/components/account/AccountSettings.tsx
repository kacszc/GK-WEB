"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function AccountSettings() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [notif, setNotif] = useState({ email: true, push: true, sms: false });
  const [saved, setSaved] = useState(false);

  const input =
    "mt-1.5 w-full rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-4";

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        <p className="mb-2 text-[12px] font-semibold text-ink-3">{t("account.notifications")}</p>
        <div className="flex flex-col gap-1">
          <Toggle label={t("account.notifEmail")} on={notif.email} onChange={(v) => setNotif((n) => ({ ...n, email: v }))} />
          <Toggle label={t("account.notifPush")} on={notif.push} onChange={(v) => setNotif((n) => ({ ...n, push: v }))} />
          <Toggle label={t("account.notifSms")} on={notif.sms} onChange={(v) => setNotif((n) => ({ ...n, sms: v }))} />
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
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-ink-3">{children}</label>;
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center justify-between py-2 text-sm text-ink"
    >
      {label}
      <span
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors",
          on ? "bg-brand-violet" : "bg-line-4",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            on ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
