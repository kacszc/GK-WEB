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

/** Account role. */
export type UserRole = "employer" | "specialist";

/** A job the user posted (employer dashboard). */
export type MyJobStatus = "active" | "filled" | "expired";
export type MyJob = {
  id: string;
  title: string;
  profession: string;
  district: string;
  status: MyJobStatus;
  applicants: number;
  rate: number;
  postedAgo: string;
};

/** A conversation in the messages inbox. */
export type Conversation = {
  id: string;
  name: string;
  avatarIndex: number;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
};

/** A saved specialist contact. */
export type SavedContact = {
  id: string;
  name: string;
  avatarIndex: number;
  role: string;
  district: string;
  rating: number;
  trustScore: number;
};

/** An activity-history entry. */
export type ActivityType = "job_posted" | "contacted" | "hired" | "applied" | "review";
export type ActivityItem = {
  id: string;
  type: ActivityType;
  text: string;
  time: string;
};

/** Authenticated user (mock). */
export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
};

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

/** A public job posting (job-seeker side). */
export type JobPosting = {
  id: string;
  title: string;
  profession: string;
  district: string;
  distanceKm: number;
  rate: number; // zł/h
  hours: number;
  when: Availability;
  whenDate?: string;
  employer: string;
  employerVerified: boolean;
  postedAgo: string;
  description: string;
};

/** A token package available for purchase. */
export type TokenPackage = {
  id: string;
  tokens: number;
  pricePerToken: number; // zł
  popular?: boolean;
};

/** A wallet transaction (purchase / spend / bonus). */
export type WalletTxType = "purchase" | "spend" | "bonus";
export type WalletTx = {
  id: string;
  type: WalletTxType;
  amount: number; // +/- tokens
  label: string;
  date: string;
  invoice?: string;
};

/** A subscription / boost plan (cennik). */
export type Plan = {
  id: string;
  name: string;
  price: number; // zł / period
  period: "mies." | "jednorazowo";
  perks: string[];
  highlight?: boolean;
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
