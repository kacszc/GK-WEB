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

/** Availability of a specialist. */
export type Availability = "now" | "week" | "date";

/** A specialist shown on the search-results screen and the map. */
export type Specialist = {
  id: string;
  name: string;
  avatarIndex: number;
  role: string; // e.g. "Barmanka, kelner"
  trustScore: number; // 0–100
  availability: Availability;
  availableFrom?: string; // for availability === "date"
  kyc: boolean;
  topRated: boolean;
  district: string; // Warsaw district name
  distanceKm: number;
  rateFrom: number; // zł/h
  rating: number; // 0–5
  reviews: number;
  specialties: { label: string; count: number }[];
  languages: string[]; // locale-ish codes: pl, en, uk, de, ru
  experienceYears: number;
  lng: number;
  lat: number;
};

/** A job posting draft (employer side). */
export type JobDraft = {
  profession: string;
  title: string;
  description: string;
  date: Date | null;
  preset: WhenPreset | null;
  district: string;
  radiusKm: number;
  people: number;
  rate: number | null;
  hours: number | null;
  contactMethod: "app" | "phone";
  phone: string;
};

/** Result of publishing a job. */
export type JobResult = {
  id: string;
  notifiedCount: number;
};

/** Detected user location (from geolocation → district/city mapping). */
export type UserLocation = {
  lng: number;
  lat: number;
  district?: string;
  city?: string;
  label: string;
};

/** A single review on a specialist profile. */
export type Review = {
  author: string;
  rating: number;
  date: string;
  text: string;
};

/** Full specialist profile (search card data + detail). */
export type SpecialistProfile = Specialist & {
  bio: string;
  completedJobs: number;
  responseTimeMin: number;
  memberSince: string;
  repeatClientsPct: number;
  certifications: string[];
  reviewList: Review[];
};

/** Result of a specialist search (paginated + facet counts). */
export type SpecialistSearch = {
  items: Specialist[];
  total: number;
  availableNow: number;
  availableWeek: number;
};

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
