"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, X, Check } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { portfolioService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

type PickedFile = { name: string; size: string; color: string };

const thumbColors = ["#5b4636", "#c47b35", "#4f6b58", "#3f5b6b", "#6b4f5a"];

export function PortfolioUploadDialog({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<PickedFile[]>([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [linkedJobId, setLinkedJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ["linkableJobs"],
    queryFn: portfolioService.getLinkableJobs,
    enabled: open,
  });

  function reset() {
    setFiles([]);
    setDescription("");
    setLocation("");
    setDate("");
    setLinkedJobId(null);
    setDone(false);
  }

  function close() {
    onClose();
    setTimeout(reset, 200);
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, 5 - files.length);
    const mapped: PickedFile[] = picked.map((f, i) => ({
      name: f.name,
      size: `${(f.size / 1_000_000).toFixed(1)} MB`,
      color: thumbColors[(files.length + i) % thumbColors.length],
    }));
    setFiles((prev) => [...prev, ...mapped].slice(0, 5));
    e.target.value = "";
  }

  async function submit() {
    if (files.length === 0) return;
    setSubmitting(true);
    try {
      await portfolioService.upload({
        fileNames: files.map((f) => f.name),
        description,
        location,
        date,
        linkedJobId,
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={close} size="lg" title={done ? undefined : t("portfolio.uploadTitle")}>
      {done ? (
        <div className="py-2 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-chip text-success-chip-text">
            <Check className="h-7 w-7" />
          </span>
          <h2 className="mt-3 text-lg font-bold text-ink">{t("portfolio.successTitle")}</h2>
          <p className="mt-1 text-sm text-ink-2">{t("portfolio.successDesc")}</p>
          <Button
            variant="dark"
            onClick={() => {
              onUploaded();
              close();
            }}
            className="mt-5 w-full rounded-tile py-3 text-sm"
          >
            {t("contact.done")}
          </Button>
        </div>
      ) : (
        <>
          <p className="-mt-2 mb-4 text-[13px] leading-relaxed text-ink-3">{t("portfolio.uploadSubtitle")}</p>

          {/* Dropzone */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-1.5 rounded-panel border-2 border-dashed border-line-2 bg-muted/40 px-4 py-8 text-center transition-colors hover:border-line-4"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-ink-3 shadow-sm">
              <Camera className="h-5 w-5" />
            </span>
            <span className="mt-1 text-[15px] font-semibold text-ink">{t("portfolio.drop")}</span>
            <span className="text-[12px] text-ink-4">{t("portfolio.dropHint")}</span>
            <span className="mt-2 inline-flex items-center rounded-tile bg-ink px-4 py-2 text-[13px] font-bold text-on-dark">
              {t("portfolio.choose")}
            </span>
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={pick} className="hidden" />

          {/* Picked files */}
          {files.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[12px] font-semibold text-ink-3">{t("portfolio.ready", { n: files.length })}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`}>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-tile" style={{ background: f.color }}>
                      <span className="absolute left-2 top-2 rounded-full bg-ink/55 px-2 py-0.5 text-[10px] font-semibold text-on-dark">
                        {t("portfolio.pending")}
                      </span>
                      <button
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Remove"
                        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-ink/55 text-on-dark hover:bg-ink/75"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-1 truncate text-[12px] font-medium text-ink">{f.name}</p>
                    <p className="text-[11px] text-ink-4">{f.size}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <label className="mb-1.5 mt-5 block text-[12px] font-semibold text-ink-3">{t("portfolio.descLabel")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={t("portfolio.descPlaceholder")}
            className="w-full resize-y rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink"
          />

          {/* Location + date */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-3">{t("portfolio.locationLabel")}</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("portfolio.locationPlaceholder")} className="w-full rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-3">{t("portfolio.dateLabel")}</label>
              <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="12.04.2026" className="w-full rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink" />
            </div>
          </div>

          {/* Link to job */}
          <p className="mb-2 mt-5 text-[12px] font-semibold text-ink-3">{t("portfolio.linkLabel")}</p>
          <div className="flex flex-col gap-2">
            {jobs.map((j) => (
              <LinkOption
                key={j.id}
                selected={linkedJobId === j.id}
                onClick={() => setLinkedJobId(j.id)}
                title={`${j.title} · ${j.date}`}
                sub={`${j.employer} · ${t("portfolio.completed")}`}
              />
            ))}
            <LinkOption
              selected={linkedJobId === null}
              onClick={() => setLinkedJobId(null)}
              title={t("portfolio.linkNone")}
              sub={t("portfolio.linkNoneHint")}
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={close} className="rounded-tile px-5 py-2.5 text-sm">
              {t("portfolio.cancel")}
            </Button>
            <Button variant="dark" onClick={submit} disabled={files.length === 0 || submitting} className="rounded-tile px-5 py-2.5 text-sm disabled:opacity-40">
              {submitting ? t("portfolio.submitting") : t("portfolio.submit", { n: files.length })}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}

function LinkOption({
  selected,
  onClick,
  title,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-tile border px-3.5 py-3 text-left transition-colors",
        selected ? "border-success-badge bg-success-chip/40" : "border-line-2 hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2",
          selected ? "border-success-badge" : "border-line-4",
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-success-badge" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-ink">{title}</span>
        <span className="block truncate text-[12px] text-ink-3">{sub}</span>
      </span>
    </button>
  );
}
