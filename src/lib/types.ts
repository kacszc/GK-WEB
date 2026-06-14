// Domain models — the contract between the frontend and backend (Spring Boot).
// These types should mirror the DTOs returned by the API.

export type Profession = {
  code?: string; // stable English slug submitted in forms/filters (backend-provided)
  label: string; // localized display name
  count: number;
  live?: boolean; // green "NOW" chip
};

export type Specialization = {
  code?: string; // profession code — lets picking a suggestion pre-select the filter
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
  code?: string; // stable profession slug for code-based search links
  label: string;
  delta: number; // zmiana %
  added: number;
};

export type LiveStat = {
  value: string;
  desc: string;
  accent?: boolean; // zielona liczba
};

/** Raw live counters from the backend; the UI builds localized rows from these. */
export type LandingLiveStats = {
  onlineNow: number;
  jobsToday: number;
  avgResponseMin: number;
};

/** A recently-performed search (query + where + range) — a landing quick action. */
export type RecentSearch = {
  query: string;
  location?: string | null;
  rangeKm?: number | null;
};

/** The whole landing page in one payload, composed by the backend (GET /api/landing). */
export type Landing = {
  popular: Profession[]; // "one-click" chips
  searchKeys: Specialization[]; // seed search suggestions (shown on focus)
  trending: Trend[];
  liveStats: LandingLiveStats;
  recent: RecentSearch[]; // signed-in only; empty otherwise
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
export type MyJobStatus = "active" | "filled" | "completed" | "expired";
export type MyJob = {
  id: string;
  title: string;
  profession: string;
  /** Catalog specialization code (empty for "Other"/custom roles) — used to confirm the hired skill. */
  professionCode?: string;
  district: string;
  status: MyJobStatus;
  applicants: number;
  rate: number;
  rateDisclosed: boolean;
  currency: string;
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
  /** Optional job this conversation is about (shown as a small tile). */
  jobId?: string;
  jobTitle?: string;
};

/** A single chat message in a conversation thread. */
export type ChatMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
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

/** Application status as returned by the backend. */
export type ApplicationStatus = "APPLIED" | "SELECTED" | "REJECTED";

/** An applicant for a posted job. */
export type Applicant = {
  /** Backend application id (used for select). Absent in mock data. */
  applicationId?: string;
  /** Backend application status. Absent in mock data (treated as APPLIED). */
  status?: ApplicationStatus;
  id: string;
  name: string;
  avatarIndex: number;
  role: string;
  trustScore: number;
  rating: number;
  reviews: number;
  rate: number;
  district: string;
  distanceKm: number;
  appliedAgo: string;
  message: string;
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
  /** Whether the account's email has been verified (Firebase email-link flow). */
  emailVerified: boolean;
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
  reliabilityScore?: number; // 0–100 behavioural track record (distinct from Trust Score)
  noShowCount?: number; // public counter: no-shows without notice
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
/** How long the engagement runs ("Kiedy"). */
export type JobDuration = "one_day" | "few_days" | "few_weeks" | "long_term";
/** Workload type. hours_per_day uses an explicit hours value; full/part-time auto-fill hours. */
export type JobEngagement = "full_time" | "part_time" | "hours_per_day";

export type JobDraft = {
  industry: string; // branża code (always set)
  profession: string; // specialization code; "" when "Inne" (custom) is chosen
  customProfession: string; // required free-text role when "Inne" is chosen
  title: string;
  description: string;
  duration: JobDuration | ""; // job length — required
  date: Date | null; // optional concrete start date (toggle)
  dateTo: Date | null; // optional end date (range); null = single day / open
  cityCode: string; // backend geo.city code (drives the district list)
  district: string;
  lat: number | null; // city/zone centre or a precise map-picked point
  lng: number | null;
  radiusKm: number;
  people: number;
  rate: number | null; // hourly rate "od"
  rateTo: number | null; // hourly rate "do" (optional → "od X w górę")
  rateUndisclosed: boolean; // "do ustalenia" — hide the figure
  currency: string; // ISO 4217 (PLN/EUR/USD…)
  engagement: JobEngagement; // pełny / pół etatu / godziny dziennie
  hours: number | null; // hours per day (auto for full/part time)
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
  promoted?: boolean; // paid promotion (boost) — sorts to the top
  lat?: number;
  lng?: number;
  rateDisclosed?: boolean; // false → "to be agreed" (no figure)
  currency?: string; // ISO 4217 (default PLN)
};

/** A token package available for purchase. */
export type TokenPackage = {
  id: string;
  tokens: number;
  pricePerToken: number; // in major units of `currency`
  currency?: string; // ISO 4217, defaults to PLN
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
  price: number; // in major units of `currency`, per period
  currency?: string; // ISO 4217, defaults to PLN
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
  code?: string; // backend city code (geo.city) — selects which zones the map loads
  label: string;
};

/** A single review on a specialist profile. */
export type Review = {
  id?: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  /** Per-category scores (1–5), only those that apply to the review's direction. */
  punctuality?: number | null;
  quality?: number | null;
  communication?: number | null;
  payment?: number | null;
  conditions?: number | null;
  /** Incident flag codes, e.g. "NO_SHOW", "LATE_PAYMENT". */
  flags?: string[];
  /** Single public reply from the reviewed party. */
  reply?: string | null;
};

/** A notification in the bell inbox (backend DTO). */
export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  /** In-app route to open when the notification is clicked (nullable). */
  link: string | null;
  read: boolean;
  createdAt: string;
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
  /** Days in the requested "when" range (null when none) — for the partial-availability warning. */
  rangeDays?: number | null;
  /** specialistId → how many days in the range they're NOT free (0/missing = fully available). */
  rangeUnavailable?: Record<string, number>;
};

/** Search (autocomplete) response. */
export type SearchSuggestions = {
  query: string;
  specializations: Specialization[];
  people: Person[];
  totalCount: number;
};

/** "When" filter — a preset or a date range [from, to] (single day = from === to). Label is derived. */
export type WhenPreset = "today" | "tomorrow" | "weekend";
export type WhenValue = {
  preset: WhenPreset | null;
  from: Date | null;
  to: Date | null;
};

/** "Where" filter — location + radius (km). */
export type WhereValue = {
  /** Chosen search-origin city (backend geo). null = "Proponowane" — no anchor, no range. */
  city: UserLocation | null;
  /** Radius (km) applied only when a city is chosen; default 25. */
  distanceKm: number;
};

// --- Onboarding -----------------------------------------------------------

/** An industry option used in onboarding (branża). */
export type IndustryOption = {
  id: string;
  label: string;
};

/** Company data resolved from the GUS registry by NIP. */
export type GusCompany = {
  name: string;
  nip: string;
  regon: string;
  address: string;
  status: string; // e.g. "Aktywna · od 1989"
};

/** Payload collected by the specialist onboarding wizard. */
export type WorkerOnboardingData = {
  name: string;
  email: string;
  phone: string;
  industry: string;
  baseLocation: string;
  lat?: number;
  lng?: number;
  radiusKm: number;
  specializations: string[]; // labels (compose the free-text headline)
  specializationCodes: string[]; // stable codes → specialist's specialization relation
  customSpecializations: { industryCode: string; label: string }[]; // "Inne" — custom role(s), no catalog code
  languages: string[];
};

/** Result of completing specialist onboarding. */
export type WorkerOnboardingResult = {
  trustScore: number;
  firstName: string;
};

/** Payload collected by the employer onboarding wizard. */
export type EmployerOnboardingData = {
  company: GusCompany;
  email: string;
  industries: string[];
  teamSize: string;
  location: string;
};

/** Result of completing employer onboarding. */
export type EmployerOnboardingResult = {
  bonusTokens: number;
  companyName: string;
};

// --- Portfolio ------------------------------------------------------------

/** Provenance of a portfolio item: self-added by the specialist, or employer-confirmed. */
export type PortfolioStatus = "self" | "verified";

/** A portfolio entry (gallery of a completed job). */
export type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  status: PortfolioStatus;
  photoCount: number;
  /** Background colors used for placeholder thumbnails. */
  colors: string[];
  /** Employer who can confirm this realisation (when linked to a job). */
  linkedJob?: string;
};

/** A completed job a worker can attach a portfolio entry to. */
export type LinkableJob = {
  id: string;
  title: string;
  employer: string;
  date: string;
};

// --- Legal & support ------------------------------------------------------

/** A numbered section inside a legal document. */
export type LegalSection = {
  id: string;
  number: string; // "§1", "§2", …
  title: string;
  paragraphs: string[];
};

/** A full legal document (terms, privacy, cookies, community). */
export type LegalDoc = {
  slug: string;
  title: string;
  effectiveFrom: string;
  version: string;
  updated: string;
  sections: LegalSection[];
};

/** Cookie category shown in the consent UI. */
export type CookieCategory = {
  id: "essential" | "performance" | "functional" | "marketing";
  name: string;
  description: string;
  duration: string;
  examples: string;
  required: boolean;
};

/** A help-center category card. */
export type HelpCategory = {
  id: string;
  name: string;
  articleCount: number;
  color: string;
};

/** A popular help article. */
export type HelpArticle = {
  id: string;
  question: string;
  answer: string;
  views: number;
};

/** A way to reach support. */
export type ContactMethod = {
  id: string;
  label: string;
  value: string;
  hint: string;
  color: string;
};

/** Company registry data shown in the contact footer card. */
export type CompanyInfo = {
  legalName: string;
  address: string[];
  registry: string;
};

/** A headline metric on the About page. */
export type AboutStat = {
  value: string;
  label: string;
  sub: string;
};

/** A team member on the About page. */
export type TeamMember = {
  name: string;
  role: string;
  avatarIndex: number;
};

/** Live maintenance status for the maintenance screen. */
export type MaintenanceStatus = {
  etaTime: string;
  remaining: string;
  state: string;
  log: { time: string; text: string; done: boolean }[];
};

// --- Availability calendar -----------------------------------------------

/** State of a single day in the availability calendar. */
export type DayState = "free" | "booked" | "blocked";

/** Availability of one calendar day (date is ISO yyyy-mm-dd). */
export type AvailabilityDay = {
  date: string;
  state: DayState;
};

/** A recurring availability rule (e.g. "Mon–Fri 16:00–23:00"). */
export type RecurringRule = {
  id: string;
  label: string;
  detail: string;
  available: boolean;
};

/** Month summary shown alongside the calendar. */
export type AvailabilitySummary = {
  free: number;
  booked: number;
  blocked: number;
  jobsDone: number;
  estimatedEarnings: number;
};

/** A job-driven booking on the calendar (several may share one day). */
export type AvailabilityBooking = {
  date: string;
  title: string;
};

/** Full month of availability data. */
export type AvailabilityMonth = {
  days: AvailabilityDay[];
  rules: RecurringRule[];
  bookings: AvailabilityBooking[];
  summary: AvailabilitySummary;
};

// --- Public employer profile ---------------------------------------------

/** Reverse-trust rating dimension on the employer profile. */
export type EmployerRating = { label: string; score: number };

/** A worker's review of an employer (reverse trust). */
export type EmployerReview = {
  id: string;
  author: string;
  avatarIndex: number;
  rating: number;
  trustScore: number;
  role: string;
  text: string;
  time: string;
};

/** A public employer profile (Screen I). */
export type EmployerProfile = {
  id: string;
  name: string;
  initial: string;
  verified: boolean;
  industries: string[];
  location: string;
  website: string;
  email: string;
  rating: number;
  completedJobs: number;
  memberSince: string;
  description: string;
  avgHireDays: number;
  onTimePayment: number;
  hiredRoles: { role: string; count: number }[];
  ratings: EmployerRating[];
  flags: number;
  reviews: EmployerReview[];
  activeJobs: { id: string; title: string; meta: string }[];
  eventColors: string[];
  seekingCount: number;
  seekingRoles: string;
};

// --- Reports & analytics --------------------------------------------------

export type ReportKpi = { id: string; value: string; label: string; delta?: string };
export type HireBar = { label: string; value: number };
export type FunnelStep = { label: string; value: number; pct: number };
export type HireRow = {
  id: string;
  name: string;
  avatarIndex: number;
  trustScore: number;
  job: string;
  date: string;
  rate: number;
  rating: number;
};
export type ReportsData = {
  kpis: ReportKpi[];
  hiresOverTime: HireBar[];
  history: HireRow[];
  funnel: FunnelStep[];
  repeatHireRate: number;
  disputesOpened: number;
};

// --- Disputes -------------------------------------------------------------

export type DisputeReason = "no_payment" | "conditions" | "other";

export type DisputeEventType = "opened" | "mediator" | "response" | "system" | "closed";
export type DisputeEvent = {
  id: string;
  type: DisputeEventType;
  title: string;
  text: string;
  time: string;
};

export type Dispute = {
  id: string;
  counterparty: string;
  reasonLabel: string;
  openedAt: string;
  mediator: string;
  remaining: string;
  events: DisputeEvent[];
};

/** Row in the current user's dispute list. */
export type DisputeSummary = {
  id: string;
  counterpartyId: string;
  reasonLabel: string;
  status: "open" | "resolved";
  openedAt: string;
};
