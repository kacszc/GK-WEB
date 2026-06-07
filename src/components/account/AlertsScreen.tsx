"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { alertsService, specialistsService, type JobAlert } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function AlertsScreen() {
  const { t, locale } = useI18n();
  const qc = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({ queryKey: ["alerts"], queryFn: alertsService.getAlerts });
  const { data: schema } = useQuery({
    queryKey: ["searchFilters", locale],
    queryFn: () => specialistsService.getFilters(locale),
  });

  const [professions, setProfessions] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [minRate, setMinRate] = useState("");
  const [openIndustry, setOpenIndustry] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const specsOf = (code: string) => schema?.specializations[code] ?? [];
  const industryLabel = (code: string) => schema?.industries.find((i) => i.code === code)?.label ?? code;
  const professionLabel = (code: string) => {
    for (const arr of Object.values(schema?.specializations ?? {})) {
      const hit = arr.find((s) => s.code === code);
      if (hit) return hit.label;
    }
    return code;
  };

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function add() {
    setBusy(true);
    try {
      await alertsService.create({ professions, industries, minRate: minRate ? Number(minRate) : null });
      setProfessions([]);
      setIndustries([]);
      setMinRate("");
      setOpenIndustry(null);
      qc.invalidateQueries({ queryKey: ["alerts"] });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(a: JobAlert) {
    await alertsService.toggle(a.id, !a.active);
    qc.invalidateQueries({ queryKey: ["alerts"] });
  }
  async function remove(id: string) {
    await alertsService.remove(id);
    qc.invalidateQueries({ queryKey: ["alerts"] });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("alerts.title")}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{t("alerts.subtitle")}</p>
      </div>

      {/* Create form */}
      <section className="rounded-panel border border-line-3 bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">{t("alerts.newTitle")}</h2>
        <p className="mb-3 mt-1 text-[12px] text-ink-3">{t("alerts.pickWhat")}</p>

        <div className="flex flex-wrap gap-1.5">
          {schema?.industries.map((i) => {
            const n = specsOf(i.code).filter((s) => professions.includes(s.code)).length;
            const whole = industries.includes(i.code);
            return (
              <Chip
                key={i.code}
                label={!whole && n > 0 ? `${i.label} · ${n}` : i.label}
                selected={whole || n > 0}
                onClick={() => {
                  toggle(industries, setIndustries, i.code);
                  setOpenIndustry(openIndustry === i.code ? null : i.code);
                }}
              />
            );
          })}
        </div>

        {openIndustry && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specsOf(openIndustry).map((s) => (
              <Chip
                key={s.code}
                small
                label={s.label}
                selected={professions.includes(s.code)}
                onClick={() => toggle(professions, setProfessions, s.code)}
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-[12px] font-semibold text-ink-3">
            {t("alerts.minRate")}
            <input
              type="number"
              inputMode="numeric"
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              placeholder={t("alerts.minRatePlaceholder")}
              className="mt-1 block w-32 rounded-tile border border-line-2 bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink"
            />
          </label>
          <Button variant="dark" onClick={add} disabled={busy} className="rounded-tile px-4 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            {t("alerts.add")}
          </Button>
        </div>
      </section>

      {/* Existing alerts */}
      {isLoading ? (
        <div className="skeleton h-24 rounded-panel" />
      ) : alerts.length === 0 ? (
        <div className="grid min-h-[120px] place-items-center rounded-panel border border-dashed border-line-2 text-center">
          <div>
            <BellRing className="mx-auto h-7 w-7 text-ink-4" />
            <p className="mt-2 text-sm text-ink-3">{t("alerts.empty")}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((a) => {
            const tags = [
              ...a.industries.map((c) => industryLabel(c)),
              ...a.professions.map((c) => professionLabel(c)),
            ];
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-panel border bg-surface p-4",
                  a.active ? "border-line-3" : "border-line-2 opacity-70",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    {tags.length > 0 ? (
                      tags.map((label, i) => (
                        <span key={i} className="rounded-full bg-pill px-2.5 py-1 text-[12px] font-medium text-ink">
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-[13px] text-ink-2">{t("alerts.any")}</span>
                    )}
                  </div>
                  {a.minRate != null && (
                    <p className="mt-1.5 text-[12px] text-ink-3">{t("alerts.rateFrom", { rate: a.minRate })}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => toggleActive(a)}
                    className={cn(
                      "text-[12px] font-semibold",
                      a.active ? "text-success" : "text-ink-4 hover:text-ink-2",
                    )}
                  >
                    {a.active ? t("alerts.active") : t("alerts.paused")}
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    aria-label={t("alerts.delete")}
                    className="grid h-8 w-8 place-items-center rounded-tile text-ink-3 hover:bg-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  selected,
  small,
  onClick,
}: {
  label: string;
  selected: boolean;
  small?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border font-medium transition-colors",
        small ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[12px]",
        selected ? "border-ink bg-ink text-on-dark" : "border-line-2 text-ink hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
