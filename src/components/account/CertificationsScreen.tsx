"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Plus, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { certificationsService, type Certification } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";
import { cn } from "@/lib/cn";

/** Specialist-side: add/remove certificates shown on the public profile. */
export function CertificationsScreen() {
  const { t } = useI18n();
  const { show } = useToast();
  const qc = useQueryClient();
  const onError = () => show({ title: t("alerts.errorTitle"), body: t("alerts.errorBody") });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["certifications"],
    queryFn: certificationsService.getMine,
  });

  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);

  const input =
    "rounded-tile border border-line-2 bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink";

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await certificationsService.create({
        name: name.trim(),
        issuer: issuer.trim() || null,
        year: year ? Number(year) : null,
      });
      setName("");
      setIssuer("");
      setYear("");
      qc.invalidateQueries({ queryKey: ["certifications"] });
    } catch {
      onError();
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    try {
      await certificationsService.remove(id);
      qc.invalidateQueries({ queryKey: ["certifications"] });
    } catch {
      onError();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("certifications.title")}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{t("certifications.subtitle")}</p>
      </div>

      {/* Add form */}
      <section className="rounded-panel border border-line-3 bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">{t("certifications.newTitle")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("certifications.namePlaceholder")} className={input} />
          <input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder={t("certifications.issuerPlaceholder")} className={input} />
          <input
            type="number"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder={t("certifications.yearPlaceholder")}
            className={input}
          />
        </div>
        <Button variant="dark" onClick={add} disabled={busy || !name.trim()} className="mt-3 rounded-tile px-4 py-2.5 text-sm disabled:opacity-40">
          <Plus className="h-4 w-4" />
          {t("certifications.add")}
        </Button>
      </section>

      {/* List */}
      {isLoading ? (
        <div className="skeleton h-24 rounded-panel" />
      ) : items.length === 0 ? (
        <div className="grid min-h-[120px] place-items-center rounded-panel border border-dashed border-line-2 text-center">
          <div>
            <Award className="mx-auto h-7 w-7 text-ink-4" />
            <p className="mt-2 text-sm text-ink-3">{t("certifications.empty")}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((c: Certification) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-panel border border-line-3 bg-surface p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                  {c.name}
                  {c.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-chip px-2 py-0.5 text-[10px] font-semibold text-success-chip-text">
                      <ShieldCheck className="h-3 w-3" />
                      {t("certifications.verified")}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  {[c.issuer, c.year].filter(Boolean).join(" · ") || t("certifications.noDetails")}
                </p>
              </div>
              <button
                onClick={() => remove(c.id)}
                aria-label={t("certifications.delete")}
                className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-tile text-ink-3 hover:bg-muted hover:text-danger")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
