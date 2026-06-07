"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/lib/AuthProvider";
import { authService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/types";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  const { signInWithEmail, signUpWithEmail, refreshUser } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("employer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errors = {
    name: mode === "register" && !name.trim(),
    email: !emailOk(email),
    password: password.length < 6,
    terms: mode === "register" && !terms,
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
      if (mode === "register") {
        // Create the Firebase account, then finalize registration on the backend
        // (sets the `role` custom claim) and re-derive the app user so the new
        // role is reflected. Then continue into role-specific onboarding.
        await signUpWithEmail(email, password, name);
        await authService.registerFinalize(role);
        await refreshUser(); // force-refresh token + re-derive so the role claim is visible
        const base = role === "specialist" ? "/onboarding/specialist" : "/onboarding/employer";
        const qs = new URLSearchParams({ name, email }).toString();
        router.push(`${base}?${qs}`);
        return;
      }
      await signInWithEmail(email, password);
      router.push("/");
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
          <h1 className="text-xl font-bold tracking-[-0.5px] text-ink">
            {t(mode === "login" ? "auth.loginTitle" : "auth.registerTitle")}
          </h1>
          <p className="mt-1 text-[13px] text-ink-3">
            {t(mode === "login" ? "auth.loginSubtitle" : "auth.registerSubtitle")}
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {mode === "register" && (
              <div>
                <Field label={t("auth.roleQuestion")} />
                <div className="grid grid-cols-2 gap-2">
                  {(["employer", "specialist"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "rounded-tile border px-3 py-2.5 text-[13px] font-medium transition-colors",
                        role === r
                          ? "border-ink bg-ink text-on-dark"
                          : "border-line-2 text-ink hover:bg-muted",
                      )}
                    >
                      {t(r === "employer" ? "auth.roleEmployer" : "auth.roleSpecialist")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "register" && (
              <TextInput
                icon={<UserIcon className="h-4 w-4" />}
                label={t("auth.name")}
                value={name}
                onChange={setName}
                placeholder={t("auth.namePlaceholder")}
                error={showErrors && errors.name ? t("auth.errName") : undefined}
              />
            )}

            <TextInput
              icon={<Mail className="h-4 w-4" />}
              label={t("auth.email")}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder={t("auth.emailPlaceholder")}
              error={showErrors && errors.email ? t("auth.errEmail") : undefined}
            />
            <TextInput
              icon={<Lock className="h-4 w-4" />}
              label={t("auth.password")}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={t("auth.passwordPlaceholder")}
              error={showErrors && errors.password ? t("auth.errPassword") : undefined}
            />

            {mode === "register" && (
              <label className="flex items-start gap-2 text-[12px] text-ink-2">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 accent-brand-violet"
                />
                <span>
                  {t("auth.terms")}
                  {showErrors && errors.terms && (
                    <span className="block text-[#b07400]">{t("auth.errTerms")}</span>
                  )}
                </span>
              </label>
            )}

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
              {submitting
                ? t("auth.submitting")
                : t(mode === "login" ? "auth.loginCta" : "auth.registerCta")}
            </Button>
          </div>

          <p className="mt-5 text-center text-[13px] text-ink-3">
            {t(mode === "login" ? "auth.noAccount" : "auth.haveAccount")}{" "}
            <Link
              href={mode === "login" ? "/register" : "/login"}
              className="font-semibold text-brand-violet hover:underline"
            >
              {t(mode === "login" ? "auth.goRegister" : "auth.goLogin")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function TextInput({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <Field label={label} />
      <div
        className={cn(
          "flex items-center gap-2 rounded-tile border bg-surface px-3 transition-colors focus-within:border-ink",
          error ? "border-[#e0a400]" : "border-line-2",
        )}
      >
        <span className="text-ink-4">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-4"
        />
      </div>
      {error && <p className="mt-1 text-[12px] text-[#b07400]">{error}</p>}
    </div>
  );
}

function Field({ label }: { label: string }) {
  return <label className="mb-1.5 block text-[12px] font-semibold text-ink-3">{label}</label>;
}
