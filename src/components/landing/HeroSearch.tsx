"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import { presetDate } from "./WhenFilter";
import { searchService } from "@/services";
import type { SearchSuggestions, WhenValue, WhereValue, SearchMode } from "@/lib/types";

const EMPTY: SearchSuggestions = {
  query: "",
  specializations: [],
  people: [],
  totalCount: 0,
};

export function HeroSearch({ mode }: { mode: SearchMode }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SearchSuggestions>(EMPTY);
  const [when, setWhen] = useState<WhenValue>(() => ({
    preset: "today",
    date: presetDate("today"),
  }));
  const [where, setWhere] = useState<WhereValue>({
    location: "Warszawa",
    distanceKm: 25,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstRun = useRef(true);
  const router = useRouter();

  function goToResults(value: string) {
    const q = value.trim();
    router.push(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  // Fetch suggestions from the service (debounce + random mock delay).
  useEffect(() => {
    let active = true;
    const delay = firstRun.current ? 0 : 180;
    firstRun.current = false;

    const timer = setTimeout(() => {
      setLoading(true);
      searchService.suggest(query).then((res) => {
        if (!active) return;
        setResults(res);
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

  function handlePick(value: string) {
    setOpen(false);
    inputRef.current?.blur();
    goToResults(value);
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
        loading={loading}
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
            loading={loading}
            mode={mode}
            onPick={handlePick}
          />
        </div>
      )}
    </div>
  );
}
