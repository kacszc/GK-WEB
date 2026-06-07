"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, BadgeCheck, PenLine, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { portfolioService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { PortfolioItem } from "@/lib/types";
import { PortfolioUploadDialog } from "./PortfolioUploadDialog";

export function PortfolioScreen() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: portfolioService.getPortfolio,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("portfolio.title")}</h1>
          <p className="mt-1 text-[13px] text-ink-3">{t("portfolio.subtitle")}</p>
        </div>
        <Button variant="dark" onClick={() => setOpen(true)} className="shrink-0 rounded-tile px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" />
          {t("portfolio.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-panel" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="grid min-h-[220px] place-items-center rounded-panel border border-dashed border-line-2 text-center">
          <div>
            <ImageIcon className="mx-auto h-8 w-8 text-ink-4" />
            <p className="mt-2 text-sm text-ink-3">{t("portfolio.empty")}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <PortfolioCard key={it.id} item={it} />
          ))}
        </div>
      )}

      <PortfolioUploadDialog
        open={open}
        onClose={() => setOpen(false)}
        onUploaded={() => qc.invalidateQueries({ queryKey: ["portfolio"] })}
      />
    </div>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const { t } = useI18n();
  const verified = item.status === "verified";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-panel border bg-surface",
        verified ? "border-success-badge" : "border-line-3",
      )}
    >
      {/* Photo strip with the provenance badge overlaid top-right */}
      <div className="relative flex h-36 gap-0.5">
        {item.colors.slice(0, 3).map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
        <span
          className={cn(
            "absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold shadow-sm backdrop-blur",
            verified ? "bg-success-chip/95 text-success-chip-text" : "bg-[#efeaff]/95 text-brand-violet",
          )}
        >
          {verified ? <BadgeCheck className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
          {t(verified ? "portfolio.verified" : "portfolio.selfAdded")}
        </span>
      </div>

      <div className="p-4">
        <h2 className="text-[15px] font-semibold text-ink">{item.title}</h2>
        <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{item.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-ink-4" />
            {item.location}
          </span>
          <span>{item.date}</span>
          <span>· {t("portfolio.photos", { n: item.photoCount })}</span>
        </div>
      </div>
    </div>
  );
}
