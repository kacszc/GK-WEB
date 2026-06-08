"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { SearchTopbar } from "./SearchTopbar";
import { FilterSidebar } from "./FilterSidebar";
import { ActiveFilters } from "./ActiveFilters";
import { ResultsToolbar, type ResultsView } from "./ResultsToolbar";
import { SpecialistCard, SpecialistCardSkeleton } from "./SpecialistCard";
import { Pagination } from "./Pagination";
import { MapView } from "./MapView";
import { FiltersModal } from "./FiltersModal";
import { useSpecialistSearch } from "@/hooks/useSpecialistSearch";
import { useI18n } from "@/i18n/I18nProvider";
import { serializeSearchFilters } from "./searchParams";
import type { SpecialistFilters } from "@/services";
import type { UserLocation } from "@/lib/types";

const PAGE_SIZE = 9;
const CITY = "Warszawa";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** True at >= lg (1024px). Lets us drop the desktop-only split view on mobile. */
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 1024px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true, // SSR snapshot: desktop-first design
  );
}

export function SearchScreen({
  initialFilters,
  initialView = "list",
}: {
  initialFilters: SpecialistFilters;
  initialView?: ResultsView;
}) {
  const { t } = useI18n();
  const [filters, setFilters] = useState<SpecialistFilters>(initialFilters);
  const [view, setView] = useState<ResultsView>(initialView);
  const isDesktop = useIsDesktop();

  // Keep the URL query in sync so a search is shareable and survives reload. Skip the first run so
  // a clean incoming link (e.g. ?q=barman) isn't immediately rewritten with defaults.
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    const qs = serializeSearchFilters(filters, view);
    window.history.replaceState(null, "", qs ? `/search?${qs}` : "/search");
  }, [filters, view]);
  // The split (map + list) is a desktop-only layout; on mobile fall back to the list.
  const effectiveView = !isDesktop && view === "mapList" ? "list" : view;
  const [page, setPage] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile filters toggle

  const activeCount =
    (filters.professions?.length ?? 0) +
    (filters.industries?.length ?? 0) +
    (filters.customIndustries?.length ?? 0) +
    (filters.availability?.length ?? 0) +
    (filters.kyc ? 1 : 0) +
    (filters.minTrust ? 1 : 0) +
    (filters.maxDistanceKm != null ? 1 : 0);

  const queryFilters: SpecialistFilters = {
    ...filters,
    near: userLocation ? { lng: userLocation.lng, lat: userLocation.lat } : undefined,
  };
  const { data, isLoading, isFetching } = useSpecialistSearch(queryFilters);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // No results: showing a map makes no sense — fall back to the list layout with the empty message.
  const noResults = !isLoading && total === 0;
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const patch = (p: Partial<SpecialistFilters>) => {
    setFilters((f) => ({ ...f, ...p }));
    setPage(1);
  };
  const clear = () => {
    setFilters((f) => ({ q: f.q, sort: f.sort }));
    setPage(1);
  };

  const category = filters.q ? capitalize(filters.q) : t("results.allSpecialists");
  const city = userLocation?.city ?? CITY;
  const title =
    view === "list"
      ? t("results.titleArea", { count: total, city })
      : t("results.titleCity", { count: total, city });
  const subtitle =
    view === "list"
      ? t("results.subtitle", { category })
      : t("results.subtitleMap", {
          category,
          now: data?.availableNow ?? 0,
          week: data?.availableWeek ?? 0,
        });

  const sidebarProps = {
    filters,
    onPatch: patch,
    onClear: clear,
    userLocation,
    onLocate: setUserLocation,
    onClearLocation: () => setUserLocation(null),
  };

  // Inline sidebar — desktop only; mobile uses the fullscreen modal.
  const sidebar = (
    <div className="hidden lg:block">
      <FilterSidebar {...sidebarProps} variant={effectiveView === "list" ? "full" : "compact"} />
    </div>
  );

  return (
    <>
      <SearchTopbar category={category} />

      <main className="mx-auto mb-8 flex w-full max-w-[1280px] flex-1 flex-col gap-4 px-4 pt-6 pb-20 sm:px-8">
        <ResultsToolbar
          title={title}
          subtitle={subtitle}
          view={effectiveView}
          onView={setView}
          sort={filters.sort ?? "trust"}
          onSort={(s) => patch({ sort: s })}
          onOpenFilters={() => setFiltersOpen(true)}
          filterCount={activeCount}
        />

        <ActiveFilters filters={filters} onPatch={patch} />

        {/* List view — also used as the fallback for map/split when there are no results. */}
        {(effectiveView === "list" || noResults) && (
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            {sidebar}
            <div>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SpecialistCardSkeleton key={i} />
                  ))}
                </div>
              ) : total === 0 ? (
                <Empty t={t} />
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {pageItems.map((s) => (
                      <SpecialistCard key={s.id} s={s} href={`/specialist/${s.id}`} />
                    ))}
                  </div>
                  <div className="mt-8">
                    <Pagination page={page} pageCount={pageCount} onPage={setPage} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Map + List view (desktop only — coerced to list on mobile; hidden when no results) */}
        {effectiveView === "mapList" && !noResults && (
          <div className="grid gap-4 lg:h-[calc(100vh-220px)] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[200px_minmax(300px,400px)_1fr]">
            {sidebar}
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SpecialistCardSkeleton key={i} compact />
                  ))
                : items.map((s) => (
                    <SpecialistCard
                      key={s.id}
                      s={s}
                      compact
                      active={activeId === s.id}
                      onSelect={setActiveId}
                    />
                  ))}
            </div>
            <MapView
              specialists={items}
              activeId={activeId}
              onSelect={setActiveId}
              cityCode={userLocation?.code ?? "warszawa"}
              center={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
            />
          </div>
        )}

        {/* Map only view (hidden when no results — no point showing an empty map) */}
        {effectiveView === "map" && !noResults && (
          <div className="grid gap-4 lg:h-[calc(100vh-220px)] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[200px_1fr]">
            {sidebar}
            <MapView
              specialists={items}
              activeId={activeId}
              onSelect={setActiveId}
              cityCode={userLocation?.code ?? "warszawa"}
              center={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
            />
          </div>
        )}

        {isFetching && !isLoading && (
          <div className="pointer-events-none fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-2 text-[12px] text-on-dark shadow-dropdown">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            …
          </div>
        )}
      </main>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        userLocation={userLocation}
        onApply={(f) => {
          setFilters(f);
          setPage(1);
        }}
        renderSidebar={(draft, patchDraft, clearDraft) => (
          <FilterSidebar
            filters={draft}
            onPatch={patchDraft}
            onClear={clearDraft}
            userLocation={userLocation}
            onLocate={setUserLocation}
            onClearLocation={() => setUserLocation(null)}
            variant="full"
          />
        )}
      />
    </>
  );
}

function Empty({ t }: { t: (k: string) => string }) {
  return (
    <div className="grid min-h-[300px] place-items-center text-center">
      <div>
        <p className="text-sm font-semibold text-ink">{t("results.empty")}</p>
        <p className="mt-1 text-[13px] text-ink-3">{t("results.emptyHint")}</p>
      </div>
    </div>
  );
}
