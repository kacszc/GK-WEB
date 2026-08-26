"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { assistantService } from "@/services";
import type { ProfileDraft } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Assisted fill (oferteo-style "virtual assistant"): describe yourself in plain words, the
 * backend extracts profile fields. The parent applies the draft to its own form state and
 * returns whether anything useful was recognized — that drives the ok/fail status line here.
 * Used by the quick-interview modal and the specialist onboarding wizard.
 */
export function AiAssistCard({ onDraft }: { onDraft: (draft: ProfileDraft) => boolean }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"ok" | "fail" | null>(null);

  async function fill() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setDone(null);
    try {
      const draft = await assistantService.draftProfile(text.trim());
      setDone(onDraft(draft) ? "ok" : "fail");
    } catch {
      setDone("fail");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-tile border border-line-2 bg-muted/60 p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
        <Sparkles className="h-3.5 w-3.5 text-brand-violet" />
        {t("hero.aiTitle")}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("hero.aiPlaceholder")}
        rows={2}
        maxLength={2000}
        className="w-full resize-none rounded-tile border border-line-2 bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-ink/40"
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] text-ink-4">
          {done === "ok" ? t("hero.aiOk") : done === "fail" ? t("hero.aiFail") : ""}
        </p>
        <button
          type="button"
          onClick={fill}
          disabled={busy || !text.trim()}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-tile bg-ink px-3 py-1.5 text-[12px] font-semibold text-on-dark transition-colors hover:bg-ink/90 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {t("hero.aiFill")}
        </button>
      </div>
    </div>
  );
}
