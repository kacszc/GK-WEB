// Client-side recent-search history. Works for everyone (anonymous included) via localStorage;
// when the user is signed in we ALSO push to the backend so the "recently viewed" section
// follows them across devices (and feeds personalization). See GET /api/landing.

import { apiPost } from "@/lib/api-client";
import { getCurrentIdToken } from "@/lib/auth-token";
import type { RecentSearch } from "@/lib/types";

const KEY = "skill.recentSearches";
const MAX = 8;

type RecentEntry = RecentSearch & { at: number };

function read(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as RecentEntry[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Most-recent distinct searches stored locally (newest first). */
export function loadRecentSearches(): RecentSearch[] {
  return read().map(({ query, location, rangeKm }) => ({ query, location, rangeKm }));
}

/**
 * Record a search the user just ran: always locally, and to the backend when signed in.
 * Dedupes by query (case-insensitive), keeping the newest occurrence.
 */
export function recordSearch(entry: RecentSearch): void {
  const query = entry.query.trim();
  if (!query) return;

  const key = query.toLowerCase();
  const next: RecentEntry[] = [
    { query, location: entry.location ?? null, rangeKm: entry.rangeKm ?? null, at: Date.now() },
    ...read().filter((e) => e.query.toLowerCase() !== key),
  ].slice(0, MAX);

  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode / quota) — local history is best-effort
  }

  // Fire-and-forget backend tracking; only meaningful when signed in (endpoint is authenticated).
  getCurrentIdToken().then((token) => {
    if (!token) return;
    apiPost("/api/search/track", {
      query,
      location: entry.location ?? null,
      lat: null,
      lng: null,
      rangeKm: entry.rangeKm ?? null,
    }).catch(() => {});
  });
}
