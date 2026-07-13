"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { authService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { authErrorKey } from "@/lib/authErrors";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/types";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Turbo-minimal in-place registration (modal-friendly): e-mail + password + terms, nothing else.
 * No e-mail verification here and no onboarding redirect — the caller decides what happens next
 * (e.g. resume the intercepted job search); the profile gets completed later at the user's pace.
 */
export function QuickRegisterForm({
  role = "specialist",
  onRegistered,
}: {
  role?: UserRole;
  onRegistered: () => void;
}) {
  const { t } = useI18n();
  const { signUpWithEmail, refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errors = {
    email: !emailOk(email),
    password: password.length < 6,
    terms: !terms,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  async function submit() {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      // Same account pipeline as the full screen, minus verification e-mail and redirects.
      await signUpWithEmail(email, password);
      await authService.registerFinalize(role);
      await refreshUser(); // token refresh so the role claim is visible immediately
      onRegistered();
    } catch (e) {
      setFormError(t(authErrorKey(e)));
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = (bad: boolean) =>
    cn(
      "w-full rounded-tile border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink/40",
      showErrors && bad ? "border-[#e11d48]" : "border-line-2",
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2.5"
    >
      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("auth.email")}
        className={inputCls(errors.email)}
      />
      <input
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("auth.password")}
        className={inputCls(errors.password)}
      />
      <label className="flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-ink-3">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className={cn("mt-0.5 h-3.5 w-3.5 accent-ink", showErrors && errors.terms && "outline outline-1 outline-[#e11d48]")}
        />
        {t("auth.terms")}
      </label>
      {formError && (
        <p className="text-[12px] text-[#b42318]" role="alert">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-tile bg-ink py-3 text-sm font-bold text-on-dark transition-colors hover:bg-ink/90 disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("hero.qrCta")}
      </button>
    </form>
  );
}
