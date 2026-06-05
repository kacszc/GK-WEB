import { Star, ChevronRight, Map as MapIcon, Briefcase, SearchX } from "lucide-react";
import { Kbd } from "@/components/ui/Kbd";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SuggestionSkeleton } from "@/components/ui/Skeleton";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { Specialization, Person, SearchMode } from "@/lib/types";

type Props = {
  query: string;
  specializations: Specialization[];
  people: Person[];
  totalCount: number;
  loading?: boolean;
  mode: SearchMode;
  onPick: (value: string) => void;
};

export function AutocompleteDropdown({
  query,
  specializations,
  people,
  totalCount,
  loading = false,
  mode,
  onPick,
}: Props) {
  const { t } = useI18n();
  const empty = specializations.length === 0 && people.length === 0;
  const label = query.trim() ? query.trim().toUpperCase() : "";

  return (
    <div className="w-full max-w-[900px] origin-top animate-pop-in overflow-hidden rounded-panel border border-line bg-surface py-2 shadow-dropdown">
      {loading ? (
        <div aria-busy="true">
          <SectionLabel left={t("dropdown.searching")} right="" />
          <SuggestionSkeleton />
          <SuggestionSkeleton />
          <SuggestionSkeleton />
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <SearchX className="h-6 w-6 text-ink-4" />
          <p className="text-sm font-semibold text-ink">
            {t("dropdown.noResults", { query })}
          </p>
          <p className="text-[12px] text-ink-3">{t("dropdown.noResultsHint")}</p>
        </div>
      ) : (
        <>
          {specializations.length > 0 && (
            <>
              <SectionLabel
                left={`${t("dropdown.suggested")}${label ? ` · ${label}` : ""}`}
                right={t(`mode.${mode}.availableNow`, { count: totalCount })}
              />
              <ul>
                {specializations.map((s, i) => (
                  <li
                    key={s.title}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <button
                      onClick={() => onPick(s.title)}
                      className={cn(
                        "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-muted cursor-pointer",
                        i === 0 && "bg-muted",
                      )}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-tile bg-pill text-ink-3">
                        <Briefcase className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {s.title}
                        </span>
                        <span className="block text-[11px] text-ink-3">
                          {t(`mode.${mode}.itemsCount`, { count: s.count })}
                        </span>
                      </span>
                      <Kbd>{s.hint === "enter" ? "↵" : "→"}</Kbd>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {specializations.length > 0 && people.length > 0 && (
            <hr className="my-1 border-line" />
          )}

          {people.length > 0 && (
            <>
              <SectionLabel
                left={t(`mode.${mode}.nearby`)}
                right={t("filters.upTo", { km: 25 })}
              />
              <ul>
                {people.map((p, i) => (
                  <li
                    key={p.name}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <button
                      onClick={() => onPick(p.name)}
                      className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-muted cursor-pointer"
                    >
                      <Avatar name={p.name} index={i} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-semibold text-ink">
                            {p.name}
                          </span>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-success-badge px-1.5 py-0.5 text-[10px] font-bold text-on-dark">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            {p.score.toFixed(1)}
                          </span>
                        </span>
                        <span className="block truncate text-[11px] text-ink-3">{p.meta}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-1 flex items-center justify-between gap-3 bg-muted px-5 py-3">
            <span className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
              {t(`mode.${mode}.showAll`, { count: totalCount })} <Kbd>↵</Kbd>
            </span>
            <Button variant="outline" className="rounded-soft px-3 py-1.5 text-xs font-medium">
              <MapIcon className="h-3.5 w-3.5" />
              {t("dropdown.openMap")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function SectionLabel({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-2">
      <span className="text-[11px] font-semibold tracking-[0.5px] text-ink-3">{left}</span>
      <span className="text-[11px] text-ink-3">{right}</span>
    </div>
  );
}
