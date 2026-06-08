"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, MailCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Standalone "forgot password" screen (mirrors the auth screen) — sends the Firebase reset link. */
export function ForgotPasswordScreen() {
  const { t } = useI18n();
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const invalid = !emailOk(email);

  async function submit() {
    if (invalid) {
      setShowError(true);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch {
      setFormError(t("auth.errGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/">
          <Logo />
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-card border border-line-3 bg-surface p-7 shadow-search">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eef1ff] text-brand-violet">
                <MailCheck className="h-7 w-7" />
              </span>
              <h1 className="mt-4 text-xl font-bold tracking-[-0.5px] text-ink">
                {t("auth.resetSentTitle")}
              </h1>
              <p className="mt-1.5 text-[13px] text-ink-3">{t("auth.resetSent", { email })}</p>
              <Link
                href="/login"
                className="mt-5 inline-flex w-full items-center justify-center rounded-tile bg-ink px-4 py-3 text-sm font-bold text-on-dark hover:bg-ink/90"
              >
                {t("auth.backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-[-0.5px] text-ink">{t("auth.resetTitle")}</h1>
              <p className="mt-1 text-[13px] text-ink-3">{t("auth.resetSubtitle")}</p>

              <div className="mt-5 flex flex-col gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-3">
                    {t("auth.email")}
                  </label>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-tile border bg-surface px-3 transition-colors focus-within:border-ink",
                      showError && invalid ? "border-[#e0a400]" : "border-line-2",
                    )}
                  >
                    <span className="text-ink-4">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.emailPlaceholder")}
                      className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-4"
                    />
                  </div>
                  {showError && invalid && (
                    <p className="mt-1 text-[12px] text-[#b07400]">{t("auth.errEmail")}</p>
                  )}
                </div>

                {formError && (
                  <p className="text-[12px] text-[#b07400]" role="alert">
                    {formError}
                  </p>
                )}

                <Button
                  variant="gradient"
                  onClick={submit}
                  disabled={submitting}
                  className="mt-1 w-full rounded-tile py-3 text-sm"
                >
                  {submitting ? t("auth.submitting") : t("auth.resetCta")}
                </Button>
              </div>

              <Link
                href="/login"
                className="mt-5 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-ink-3 hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.backToLogin")}
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
