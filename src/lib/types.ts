// Domain models — the contract between the frontend and backend (Spring Boot).
// These types should mirror the DTOs returned by the API.

export type Profession = {
  label: string;
  count: number;
  live?: boolean; // green "NOW" chip
};

export type Specialization = {
  title: string;
  count: number;
  hint: "enter" | "arrow";
};

export type Person = {
  name: string;
  score: number; // Trust Score
  meta: string;
};

export type Trend = {
  rank: string;
  label: string;
  delta: number; // zmiana %
  added: number;
};

export type LiveStat = {
  value: string;
  desc: string;
  accent?: boolean; // zielona liczba
};

export type FooterColumn = {
  title: string;
  links: string[];
};

/** Search mode: hiring a worker vs looking for a job. */
export type SearchMode = "worker" | "job";

/** Search (autocomplete) response. */
export type SearchSuggestions = {
  query: string;
  specializations: Specialization[];
  people: Person[];
  totalCount: number;
};

/** "When" filter — a preset or a specific date. The display label is derived. */
export type WhenPreset = "today" | "tomorrow" | "weekend";
export type WhenValue = {
  date: Date | null;
  preset: WhenPreset | null;
};

/** "Where" filter — location + radius (km). */
export type WhereValue = {
  location: string;
  distanceKm: number;
};
