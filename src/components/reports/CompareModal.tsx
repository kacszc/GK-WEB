"use client";

import { useRef, useState } from "react";
import { X, Download, Star, Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { printArea } from "@/lib/print";
import { cn } from "@/lib/cn";
import type { HireRow } from "@/lib/types";

const MAX = 5;

/** Side-by-side comparison of up to 5 hired candidates, exportable to PDF for management. */
export function CompareModal({
  candidates,
  open,
  onClose,
}: {
  candidates: HireRow[];
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const printRef = useRef<HTMLDivElement>(null);
  // Pre-select the first few so the table is populated on open.
  const [selected, setSelected] = useState<string[]>(() => candidates.slice(0, 3).map((c) => c.id));

  if (!open) return null;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX ? [...prev, id] : prev,
    );
  }

  const chosen = candidates.filter((c) => selected.includes(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-3xl rounded-card bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{t("reports.compareTitle")}</h2>
            <p className="mt-0.5 text-[12px] text-ink-3">{t("reports.comparePick", { max: MAX })}</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-ink-3 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Candidate picker */}
        <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
          {candidates.length === 0 && <p className="text-[13px] text-ink-3">{t("reports.compareNoData")}</p>}
          {candidates.map((c) => {
            const on = selected.includes(c.id);
            const full = !on && selected.length >= MAX;
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                disabled={full}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[13px] transition-colors",
                  on ? "border-ink bg-ink text-on-dark" : "border-line-2 text-ink-2 hover:bg-muted",
                  full && "cursor-not-allowed opacity-40",
                )}
              >
                {on ? <Check className="h-3.5 w-3.5" /> : <Avatar name={c.name} index={c.avatarIndex} size={18} />}
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Comparison table (the print target) */}
        <div ref={printRef} className="px-5 py-4">
          <div className="mb-3 hidden print:block">
            <p className="text-lg font-bold text-ink">{t("reports.compareTitle")} — skill.com</p>
          </div>
          {chosen.length < 2 ? (
            <p className="py-8 text-center text-[13px] text-ink-3">{t("reports.compareEmpty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr>
                    <th className="w-32 pb-3" />
                    {chosen.map((c) => (
                      <th key={c.id} className="pb-3 pl-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Avatar name={c.name} index={c.avatarIndex} size={40} />
                          <span className="text-[13px] font-semibold text-ink">{c.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <MetricRow label={t("reports.colRating")}>
                    {chosen.map((c) => (
                      <Cell key={c.id}>
                        <span className="inline-flex items-center gap-0.5 text-[#e0a400]">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {c.rating.toFixed(1)}
                        </span>
                      </Cell>
                    ))}
                  </MetricRow>
                  <MetricRow label={t("reports.colRate")}>
                    {chosen.map((c) => (
                      <Cell key={c.id}>
                        <span className="font-medium text-ink">{c.rate} zł</span>
                      </Cell>
                    ))}
                  </MetricRow>
                  <MetricRow label={t("reports.colJob")}>
                    {chosen.map((c) => (
                      <Cell key={c.id}>
                        <span className="text-ink-2">{c.job}</span>
                      </Cell>
                    ))}
                  </MetricRow>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3 print:hidden">
          <Button variant="outline" onClick={onClose} className="rounded-tile px-4 py-2 text-[13px]">
            {t("reports.compareClose")}
          </Button>
          <Button
            variant="dark"
            onClick={() => printArea(printRef.current)}
            disabled={chosen.length < 2}
            className="rounded-tile px-4 py-2 text-[13px] disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            {t("reports.export")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <th className="py-3 text-[11px] font-bold uppercase tracking-[0.5px] text-ink-4">{label}</th>
      {children}
    </tr>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="py-3 pl-3 text-center">{children}</td>;
}
