"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { Check, Star, Coins, Phone, Mail } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/AuthProvider";
import { useWallet } from "@/lib/WalletProvider";
import { messagesService, contactsService } from "@/services";
import { ApiError } from "@/lib/api-client";

const CONTACT_COST = 3;
import type { Specialist } from "@/lib/types";

type ContactContextValue = { open: (s: Specialist) => void };
const ContactContext = createContext<ContactContextValue | null>(null);

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const [specialist, setSpecialist] = useState<Specialist | null>(null);

  return (
    <ContactContext.Provider value={{ open: setSpecialist }}>
      {children}
      <ContactModal
        key={specialist?.id ?? "none"}
        specialist={specialist}
        onClose={() => setSpecialist(null)}
      />
    </ContactContext.Provider>
  );
}

export function useContact(): ContactContextValue {
  const ctx = useContext(ContactContext);
  if (!ctx) throw new Error("useContact must be used within ContactProvider");
  return ctx;
}

function ContactModal({
  specialist,
  onClose,
}: {
  specialist: Specialist | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { balance, backed, spend, setBalance } = useWallet();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(false);
  const [insufficient, setInsufficient] = useState(false);
  const [revealed, setRevealed] = useState<{ phone: string | null; email: string | null } | null>(null);

  const s = specialist;
  const min = 5;

  async function send() {
    if (!s) return;
    if (!text.trim()) {
      setErr(true);
      return;
    }
    setSending(true);
    try {
      // Pay-per-contact: reveal contact details via the backend (debits tokens).
      // When the backend isn't wallet-backed (signed out / offline), fall back
      // to the local optimistic spend so the mock flow keeps working.
      if (backed) {
        try {
          const r = await contactsService.reveal(s.id);
          setBalance(r.balanceAfter);
          setRevealed({ phone: r.phone, email: r.email });
        } catch (e) {
          if (e instanceof ApiError && e.status === 422) {
            setInsufficient(true);
            return;
          }
          throw e;
        }
      } else if (!spend(CONTACT_COST)) {
        return; // insufficient local balance — gate is shown instead
      }
      await messagesService.send(s.id, text);
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  // Show the token gate when the local balance is short OR the backend rejected
  // the reveal with 422 (insufficient tokens).
  const showGate = insufficient || balance < CONTACT_COST;

  return (
    <Dialog open={!!s} onClose={onClose} title={sent ? undefined : t("contact.title")}>
      {!s ? null : sent ? (
        <div className="py-2 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-chip text-success-chip-text">
            <Check className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-lg font-bold text-ink">{t("contact.successTitle")}</h2>
          <p className="mt-1 text-sm text-ink-2">
            {t("contact.successDesc", { name: s.name, min })}
          </p>
          {revealed && (
            <div className="mt-4 flex flex-col gap-2 rounded-tile bg-subtle p-3 text-left">
              <p className="text-[12px] font-semibold text-ink-3">{t("contact.revealedTitle")}</p>
              {revealed.phone && (
                <a
                  href={`tel:${revealed.phone}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:underline"
                >
                  <Phone className="h-4 w-4 text-ink-3" />
                  {revealed.phone}
                </a>
              )}
              {revealed.email && (
                <a
                  href={`mailto:${revealed.email}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:underline"
                >
                  <Mail className="h-4 w-4 text-ink-3" />
                  {revealed.email}
                </a>
              )}
            </div>
          )}
          <Button variant="dark" onClick={onClose} className="mt-5 w-full rounded-tile py-3 text-sm">
            {t("contact.done")}
          </Button>
        </div>
      ) : (
        <>
          {/* Specialist summary */}
          <div className="flex items-center gap-3 rounded-tile bg-subtle p-3">
            <Avatar name={s.name} index={s.avatarIndex} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
              <p className="truncate text-[12px] text-ink-3">{s.role}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[12px] text-ink-2">
              <Star className="h-3.5 w-3.5 fill-current text-[#e0a400]" />
              {s.rating.toFixed(1)}
            </span>
          </div>

          {!user ? (
            <div className="mt-4 rounded-tile border border-line-2 p-4 text-center">
              <p className="text-sm text-ink-2">{t("contact.loginRequired")}</p>
              <Link
                href="/login"
                className="mt-3 inline-flex w-full items-center justify-center rounded-tile bg-ink px-4 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
              >
                {t("contact.loginCta")}
              </Link>
            </div>
          ) : showGate ? (
            <div className="mt-4 rounded-tile border border-brand-violet/30 bg-[#f6f3ff] p-4 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white">
                <Coins className="h-5 w-5 text-[#e0a400]" />
              </span>
              <p className="mt-2 text-sm font-semibold text-ink">{t("tokens.gateTitle")}</p>
              <p className="mt-1 text-[13px] text-ink-2">
                {t("tokens.gateDesc", { cost: CONTACT_COST, balance })}
              </p>
              <Link
                href="/account/tokens"
                className="mt-3 inline-flex w-full items-center justify-center rounded-tile bg-ink px-4 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
              >
                {t("tokens.gateBuy")}
              </Link>
            </div>
          ) : (
            <>
              <label className="mb-1.5 mt-4 block text-[12px] font-semibold text-ink-3">
                {t("contact.messageLabel")}
              </label>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (err) setErr(false);
                }}
                rows={4}
                placeholder={t("contact.messagePlaceholder")}
                className={`w-full resize-y rounded-tile border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 ${
                  err ? "border-[#e0a400]" : "border-line-2 focus:border-ink"
                }`}
              />
              {err && <p className="mt-1 text-[12px] text-[#b07400]">{t("contact.errEmpty")}</p>}
              <Button
                variant="gradient"
                onClick={send}
                disabled={sending}
                className="mt-3 w-full rounded-tile py-3 text-sm"
              >
                {sending ? t("contact.sending") : t("contact.send")}
                {!sending && (
                  <span className="font-normal opacity-80">{t("contact.cost", { n: CONTACT_COST })}</span>
                )}
              </Button>
              <p className="mt-2 text-center text-[12px] text-ink-3">
                {t("tokens.balanceShort", { n: balance })}
              </p>
            </>
          )}
        </>
      )}
    </Dialog>
  );
}
