"use client";

import {
  List,
  Columns2,
  Map as MapIcon,
  ChevronDown,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { SpecialistSort } from "@/services";

export type ResultsView = "list" | "mapList" | "map";

const VIEWS: { id: ResultsView; key: string; icon: React.ReactNode; className?: string }[] = [
  { id: "list", key: "results.viewList", icon: <List className="h-4 w-4" /> },
  // Split (map + list) is a desktop-only layout — hidden on mobile, where only list/map are offered.
  { id: "mapList", key: "results.viewMapList", icon: <Columns2 className="h-4 w-4" />, className: "hidden lg:flex" },
  { id: "map", key: "results.viewMap", icon: <MapIcon className="h-4 w-4" /> },
];

const SORTS: { id: SpecialistSort; key: string }[] = [
  { id: "trust", key: "results.sortTrust" },
  { id: "distance", key: "results.sortDistance" },
  { id: "rate", key: "results.sortRate" },
];

export function ResultsToolbar({
  title,
  subtitle,
  view,
  onView,
  sort,
  onSort,
  onOpenFilters,
  filterCount = 0,
}: {
  title: string;
  subtitle: string;
  view: ResultsView;
  onView: (v: ResultsView) => void;
  sort: SpecialistSort;
  onSort: (s: SpecialistSort) => void;
  onOpenFilters?: () => void;
  filterCount?: number;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{title}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex rounded-tile border border-line-2 bg-surface p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => onView(v.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
                view === v.id ? "bg-ink text-on-dark" : "text-ink-2 hover:text-ink",
                v.className,
              )}
            >
              {v.icon}
              <span className="hidden sm:inline">{t(v.key)}</span>
            </button>
          ))}
        </div>

        {/* Filters (mobile) — between the view toggle and sort */}
        {onOpenFilters && (
          <button
            onClick={onOpenFilters}
            aria-label={t("results.filtersToggle")}
            className="flex items-center gap-1.5 rounded-tile border border-line-2 bg-surface px-3 py-2 text-[13px] font-semibold text-ink lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{t("results.filtersToggle")}</span>
            {filterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] text-on-dark">
                {filterCount}
              </span>
            )}
          </button>
        )}

        {/* Sort */}
        <Popover
          align="end"
          panelClassName="w-56 p-1.5"
          trigger={({ open }) => (
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-tile border border-line-2 bg-surface px-3 py-2 text-[13px] text-ink",
                open && "ring-2 ring-ink/10",
              )}
            >
              <span className="text-ink-3">{t("results.sortLabel")}</span>
              <span className="font-semibold">{t(SORTS.find((s) => s.id === sort)!.key)}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-ink-3 transition-transform", open && "rotate-180")} />
            </span>
          )}
        >
          {({ close }) => (
            <ul>
              {SORTS.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      onSort(s.id);
                      close();
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-tile px-3 py-2 text-left text-[13px] hover:bg-muted cursor-pointer",
                      s.id === sort ? "font-semibold text-ink" : "text-ink-2",
                    )}
                  >
                    {t(s.key)}
                    {s.id === sort && <Check className="h-4 w-4 text-brand-violet" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Popover>
      </div>
    </div>
  );
}
