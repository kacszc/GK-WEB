"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import { presetDate } from "./WhenFilter";
import { searchService } from "@/services";
import { recordSearch } from "@/lib/searchHistory";
import type { SearchSuggestions, WhenValue, UserLocation, SearchMode, Specialization } from "@/lib/types";

export function HeroSearch({ mode, seedKeys = [] }: { mode: SearchMode; seedKeys?: Specialization[] }) {
  // Seed dropdown state from the landing payload so focus shows suggestions with no extra fetch.
  const seedState: SearchSuggestions = useMemo(
    () => ({
      query: "",
      specializations: seedKeys,
      people: [],
      totalCount: seedKeys.reduce((sum, s) => sum + s.count, 0),
    }),
    [seedKeys],
  );

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState<SearchSuggestions>(seedState);

  // While the box is empty we show the seed keys; once typing, the fetched results.
  const typing = query.trim().length > 0;
  const results = typing ? fetched : seedState;
  const isLoading = typing ? loading : false;
  const [when, setWhen] = useState<WhenValue>(() => ({
    preset: "today",
    date: presetDate("today"),
  }));
  // Default: no city = "Proponowane" (no anchor, no range) — clicking Search shows everyone.
  const [where, setWhere] = useState<UserLocation | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstRun = useRef(true);
  const router = useRouter();

  function goToResults(value: string, opts?: { view?: "map"; professionCode?: string }) {
    const q = value.trim();
    const base = mode === "job" ? "/jobs" : "/search";
    // Remember the search for the "recently viewed" landing section.
    if (q) recordSearch({ query: q, location: where?.city ?? where?.label });
    const params = new URLSearchParams();
    // A picked profession goes by code (pre-selects the filter); free text goes by q.
    if (opts?.professionCode) params.set("profession", opts.professionCode);
    else if (q) params.set("q", q);
    if (opts?.view) params.set("view", opts.view);
    // Carry the picked city to results (lat/lng anchor). No city → "Proponowane" (everyone).
    if (where) {
      params.set("lat", String(where.lat));
      params.set("lng", String(where.lng));
      if (where.city) params.set("city", where.city);
      if (where.code) params.set("code", where.code);
    }
    const qs = params.toString();
    router.push(`${base}${qs ? `?${qs}` : ""}`);
  }

  // Fetch suggestions while typing. When the box is empty we show the seed keys from the
  // landing payload (derived above — no request, no state write here).
  useEffect(() => {
    if (!query.trim()) {
      firstRun.current = false;
      return;
    }
    let active = true;
    const delay = firstRun.current ? 0 : 180;
    firstRun.current = false;

    const timer = setTimeout(() => {
      setLoading(true);
      searchService.suggest(query).then((res) => {
        if (!active) return;
        setFetched(res);
        setLoading(false);
      });
    }, delay);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Close on outside click / Escape
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function handlePick(value: string, code?: string) {
    setOpen(false);
    inputRef.current?.blur();
    goToResults(value, code ? { professionCode: code } : undefined);
  }

  function handleOpenMap() {
    setOpen(false);
    inputRef.current?.blur();
    goToResults(query, { view: "map" });
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[900px]">
      <SearchBar
        value={query}
        onChange={(v) => {
          setQuery(v);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        resultCount={results.totalCount}
        loading={isLoading}
        inputRef={inputRef}
        onSubmit={() => goToResults(query)}
        mode={mode}
        when={when}
        onWhenChange={setWhen}
        where={where}
        onWhereChange={setWhere}
      />
      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-2">
          <AutocompleteDropdown
            query={query}
            specializations={results.specializations}
            people={results.people}
            totalCount={results.totalCount}
            loading={isLoading}
            mode={mode}
            onPick={handlePick}
            onOpenMap={handleOpenMap}
          />
        </div>
      )}
    </div>
  );
}
