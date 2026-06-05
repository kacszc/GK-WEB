"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MessageCircle, ShieldAlert, Paperclip, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";
import { supportService } from "@/services";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { ContactMethod } from "@/lib/types";

const methodIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  phone: Phone,
  chat: MessageCircle,
  abuse: ShieldAlert,
};
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function ContactScreen() {
  const { t, dict } = useI18n();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const { data: methods = [] } = useQuery({ queryKey: ["contactMethods"], queryFn: supportService.getContactMethods });
  const { data: company } = useQuery({ queryKey: ["companyInfo"], queryFn: supportService.getCompanyInfo });

  const errors = { name: !name.trim(), email: !emailOk(email), topic: !topic, message: message.trim().length < 5 };
  const hasErrors = Object.values(errors).some(Boolean);

  async function submit() {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    try {
      await supportService.sendContactMessage({ name, email, topic, message });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = (err: boolean) => cn(inputClass(err), "mt-1.5");

  return (
    <main className="flex-1">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-12 sm:px-8">
          <p className="text-[12px] font-bold uppercase tracking-[1px] text-brand-violet">{t("contactPage.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.5px] text-ink sm:text-4xl">{t("contactPage.title")}</h1>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1080px] gap-6 px-4 py-12 sm:px-8 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <div className="rounded-panel border border-line-3 bg-surface p-6">
          {sent ? (
            <div className="grid min-h-[360px] place-items-center text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-chip text-success-chip-text">
                  <Check className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-lg font-bold text-ink">{t("contactPage.successTitle")}</h2>
                <p className="mt-1 text-sm text-ink-2">{t("contactPage.successDesc")}</p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-ink">{t("contactPage.formTitle")}</h2>
              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <Label>{t("contactPage.name")}</Label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls(showErrors && errors.name)} />
                </div>
                <div>
                  <Label>{t("contactPage.email")}</Label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls(showErrors && errors.email)} />
                </div>
                <div>
                  <Label>{t("contactPage.topic")}</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dict.contactPage.topics.map((tp) => (
                      <button
                        key={tp}
                        onClick={() => setTopic(tp)}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                          topic === tp
                            ? "border-ink bg-ink text-on-dark"
                            : cn("text-ink hover:bg-muted", showErrors && errors.topic ? "border-[#e0a400]" : "border-line-2"),
                        )}
                      >
                        {tp}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>{t("contactPage.message")}</Label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder={t("contactPage.messagePlaceholder")}
                    className={cn(inputCls(showErrors && errors.message), "resize-y")}
                  />
                </div>
                <div className="flex items-center gap-2 rounded-tile border border-dashed border-line-2 px-3.5 py-3 text-[12px] text-ink-3">
                  <Paperclip className="h-4 w-4 text-ink-4" />
                  {t("contactPage.attach")}
                </div>
                <Button variant="dark" onClick={submit} disabled={submitting} className="w-full rounded-tile py-3 text-sm">
                  {submitting ? t("contactPage.submitting") : t("contactPage.submit")}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Methods + company */}
        <div className="flex flex-col gap-3">
          {methods.map((m) => (
            <MethodCard key={m.id} m={m} />
          ))}
          {company && (
            <div className="rounded-panel bg-ink p-5 text-on-dark">
              <p className="text-[11px] font-bold uppercase tracking-[1px] text-[#ffcf6b]">{t("contactPage.headquarters")}</p>
              <p className="mt-2 text-sm font-bold">{company.legalName}</p>
              {company.address.map((line) => (
                <p key={line} className="text-[13px] text-on-dark/80">{line}</p>
              ))}
              <p className="mt-1 text-[11px] text-on-dark/60">{company.registry}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function MethodCard({ m }: { m: ContactMethod }) {
  const Icon = methodIcon[m.id] ?? Mail;
  return (
    <div className="rounded-panel border border-line-3 bg-surface p-4">
      <span className="grid h-9 w-9 place-items-center rounded-tile" style={{ background: m.color }}>
        <Icon className="h-4 w-4 text-on-dark" />
      </span>
      <p className="mt-3 text-[15px] font-semibold text-ink">{m.label}</p>
      <p className="text-[13px] font-medium text-ink">{m.value}</p>
      <p className="mt-0.5 text-[12px] text-ink-4">{m.hint}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-ink-3">{children}</label>;
}
