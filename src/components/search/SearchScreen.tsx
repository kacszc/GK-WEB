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
const MAP_BATCH = 200; // map views fetch a single larger batch so most pins render at once
const CITY = "Warszawa";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Local "yyyy-mm-dd" for `n` days from today. */
function isoFromToday(addDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + addDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The date window used to flag partial availability (badge only — never excludes). An explicit
 * date range wins; otherwise "this week" → next 7 days, "now" → today. No availability → no window.
 */
function effectiveRange(f: SpecialistFilters): { from: string; to: string } | null {
  if (f.fromDate && f.toDate) return { from: f.fromDate, to: f.toDate };
  // Open-ended term ("from X onward") has no bounded window → no "X of Y days" badge.
  if (f.fromDate) return null;
  const av = f.availability ?? [];
  if (av.includes("week")) return { from: isoFromToday(0), to: isoFromToday(6) };
  if (av.includes("now")) return { from: isoFromToday(0), to: isoFromToday(0) };
  return null;
}

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
  initialLocation = null,
}: {
  initialFilters: SpecialistFilters;
  initialView?: ResultsView;
  initialLocation?: UserLocation | null;
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
  const [userLocation, setUserLocation] = useState<UserLocation | null>(initialLocation);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile filters toggle

  const activeCount =
    (filters.professions?.length ?? 0) +
    (filters.industries?.length ?? 0) +
    (filters.customIndustries?.length ?? 0) +
    (filters.availability?.length ?? 0) +
    (filters.attributes?.length ?? 0) +
    (filters.kyc ? 1 : 0) +
    (filters.minTrust ? 1 : 0) +
    (filters.maxDistanceKm != null ? 1 : 0);

  // Effective "when" window for the availability badge — NEVER filters specialists out (the backend
  // only uses it to count busy days). An explicit date range wins; otherwise the availability filter
  // implies one (today for "now", the next 7 days for "this week") so blocked specialists get badged.
  const range = effectiveRange(filters);

  // Server-side pagination: the list view fetches one page; the map views fetch a larger single
  // batch so all pins show (the side list just scrolls). Backend sorts (promoted first) + paginates.
  const isListView = effectiveView === "list";
  const queryFilters: SpecialistFilters = {
    ...filters,
    fromDate: range?.from,
    toDate: range?.to,
    near: userLocation ? { lng: userLocation.lng, lat: userLocation.lat } : undefined,
    page: isListView ? page - 1 : 0,
    size: isListView ? PAGE_SIZE : MAP_BATCH,
  };
  const { data, isLoading, isFetching } = useSpecialistSearch(queryFilters);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // List view: the backend already returned this page. Map views render `items` directly.
  const pageItems = items;

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

        <ActiveFilters filters={filters} onPatch={patch} city={city} />

        {/* List view (map views stay on the map and show an empty overlay instead of falling back). */}
        {effectiveView === "list" && (
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
                      <SpecialistCard
                        key={s.id}
                        s={s}
                        href={`/specialist/${s.id}`}
                        unavailableDays={data?.rangeUnavailable?.[s.id] ?? 0}
                        rangeDays={data?.rangeDays}
                      />
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

        {/* Map + List view (desktop only — coerced to list on mobile). No results → drop the map and
            show the plain empty state (like the list view), since an empty map is pointless. */}
        {effectiveView === "mapList" && total === 0 && !isLoading && (
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            {sidebar}
            <Empty t={t} />
          </div>
        )}
        {effectiveView === "mapList" && !(total === 0 && !isLoading) && (
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
                      unavailableDays={data?.rangeUnavailable?.[s.id] ?? 0}
                      rangeDays={data?.rangeDays}
                    />
                  ))}
            </div>
            <div className="relative h-full">
              <MapView
                specialists={items}
                activeId={activeId}
                onSelect={setActiveId}
                cityCode={userLocation?.code ?? "warszawa"}
                center={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
              />
              {(isLoading || total === 0) && <MapEmptyOverlay t={t} loading={isLoading} />}
            </div>
          </div>
        )}

        {/* Map only view. Empty → overlay on the map (no fallback to the list). */}
        {effectiveView === "map" && (
          <div className="grid gap-4 lg:h-[calc(100vh-220px)] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[200px_1fr]">
            {sidebar}
            <div className="relative h-full">
              <MapView
                specialists={items}
                activeId={activeId}
                onSelect={setActiveId}
                cityCode={userLocation?.code ?? "warszawa"}
                center={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
              />
              {(isLoading || total === 0) && <MapEmptyOverlay t={t} loading={isLoading} />}
            </div>
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

/** Overlay on top of the map while loading or when there are no results. Captures pointer events so
 *  the empty/loading map can't be panned underneath; removed once results exist (map interactive). */
function MapEmptyOverlay({ t, loading = false }: { t: (k: string) => string; loading?: boolean }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-card bg-surface/70 px-4 text-center backdrop-blur-[2px]">
      <div className="rounded-panel border border-line-3 bg-surface/95 px-5 py-4 shadow-search">
        {loading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-violet" />
        ) : (
          <>
            <p className="text-sm font-semibold text-ink">{t("results.empty")}</p>
            <p className="mt-1 text-[13px] text-ink-3">{t("results.emptyHint")}</p>
          </>
        )}
      </div>
    </div>
  );
}
