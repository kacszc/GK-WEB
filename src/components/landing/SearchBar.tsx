import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { WhenFilter } from "./WhenFilter";
import { WhereFilter } from "./WhereFilter";
import { useI18n } from "@/i18n/I18nProvider";
import { useTypewriter } from "@/lib/useTypewriter";
import type { WhenValue, WhereValue } from "@/lib/types";

type SearchBarProps = {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  resultCount: number;
  loading?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  when: WhenValue;
  onWhenChange: (v: WhenValue) => void;
  where: WhereValue;
  onWhereChange: (v: WhereValue) => void;
};

/** Hero search bar — controlled input with filters and CTA. */
export function SearchBar({
  value,
  onChange,
  onFocus,
  resultCount,
  loading = false,
  inputRef,
  when,
  onWhenChange,
  where,
  onWhereChange,
}: SearchBarProps) {
  const { t, dict } = useI18n();
  const isEmpty = value.trim() === "";
  const animatedPlaceholder = useTypewriter(dict.search.examples, isEmpty);
  const showSpinner = loading && !isEmpty;
  return (
    <div className="w-full max-w-[900px]">
      <div className="flex flex-col gap-3 rounded-card border-2 border-ink bg-surface p-2 shadow-search sm:flex-row sm:items-center">
        {/* Pole */}
        <div className="flex flex-1 items-center gap-3 px-3 py-2">
          {showSpinner ? (
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-brand-violet" />
          ) : (
            <Search className="h-6 w-6 shrink-0 text-ink-3" />
          )}
          <div className="min-w-0 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              placeholder={isEmpty ? animatedPlaceholder || t("search.placeholder") : t("search.placeholder")}
              aria-label={t("search.cta")}
              className="w-full bg-transparent text-2xl font-bold tracking-[-0.5px] text-ink caret-brand-violet outline-none placeholder:text-ink-3 placeholder:font-normal placeholder:tracking-normal placeholder:text-base"
            />
            <p className="truncate text-xs text-ink-3">
              {isEmpty
                ? t("search.subtitleEmpty")
                : loading
                  ? t("search.subtitleLoading")
                  : resultCount > 0
                    ? t("search.subtitleResults", { count: resultCount })
                    : t("search.subtitleEmpty")}
            </p>
          </div>
        </div>

        {/* Right: filters + CTA */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <WhenFilter value={when} onChange={onWhenChange} />
            <WhereFilter value={where} onChange={onWhereChange} />
          </div>
          <Button
            variant="gradient"
            className="flex-1 rounded-field px-6 py-4 text-[15px] sm:flex-none"
          >
            {t("search.cta")}
          </Button>
        </div>
      </div>

      {/* Hint below the bar */}
      <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-ink-3 sm:justify-start">
        {t("search.quickSearch")}
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        {t("search.fromAnywhere")}
      </p>
    </div>
  );
}
