import type {
  HelpCategory,
  HelpArticle,
  ContactMethod,
  CompanyInfo,
  AboutStat,
  TeamMember,
  MaintenanceStatus,
} from "@/lib/types";

// Help/about/contact/maintenance are static content authored here; there is no backend endpoint yet.

const helpCategories: HelpCategory[] = [
  { id: "account", name: "Konto", articleCount: 12, color: "#7c3aed" },
  { id: "tokens", name: "Tokeny & Płatności", articleCount: 18, color: "#16a34a" },
  { id: "jobs", name: "Zlecenia", articleCount: 24, color: "#2563eb" },
  { id: "disputes", name: "Spory", articleCount: 8, color: "#e0a400" },
  { id: "security", name: "Bezpieczeństwo", articleCount: 9, color: "#dc2626" },
];

const popularArticles: HelpArticle[] = [
  { id: "a1", question: "Jak doładować konto tokenami?", answer: "Tokeny kupujesz w sekcji „Tokeny” lub przy próbie kontaktu z pracownikiem. Akceptujemy BLIK, kartę, przelew, Apple/Google Pay.", views: 2134 },
  { id: "a2", question: "Co to jest Trust Score i jak go podnieść?", answer: "Trust Score to ocena wiarygodności (0–100). Podnoszą go: ukończone zlecenia, oceny 5/5, certyfikaty, szybkie odpowiedzi.", views: 1876 },
  { id: "a3", question: "Jak anulować zlecenie?", answer: "Możesz anulować w „Moje zlecenia” > klik na zlecenie > „Anuluj”. Skutki zależne od czasu: >72h bez kary, <24h −20 pkt Trust + zwrot 20% workerowi.", views: 1542 },
  { id: "a4", question: "Co to KYC i czy muszę go zrobić?", answer: "KYC to weryfikacja tożsamości (dowód + selfie). Obowiązkowa dla pracowników zarabiających >5000 zł/mies. Polepsza Trust Score i widoczność.", views: 1388 },
  { id: "a5", question: "Jak zgłosić nieuczciwego użytkownika?", answer: "Kliknij „Zgłoś użytkownika” na jego profilu. Moderator sprawdza w 48h. Możesz też napisać na abuse@skill.com.", views: 987 },
  { id: "a6", question: "Reset hasła nie działa", answer: "Sprawdź spam. Link ważny 1h. Jeśli OAuth (Google/Apple) — reset nie zadziała, zaloguj się przez OAuth.", views: 754 },
];

const contactMethods: ContactMethod[] = [
  { id: "email", label: "Email", value: "support@skill.com", hint: "Odpowiedź w max 24h roboczych", color: "#7c3aed" },
  { id: "phone", label: "Telefon", value: "+48 22 100 200", hint: "Pn–Pt 9:00–17:00", color: "#16a34a" },
  { id: "chat", label: "Live chat", value: "Aktualnie dostępny", hint: "Śr. czas odpowiedzi: 4 min", color: "#2563eb" },
  { id: "abuse", label: "Zgłoś abuse", value: "abuse@skill.com", hint: "Pilne sprawy — response 4h", color: "#dc2626" },
];

const companyInfo: CompanyInfo = {
  legalName: "Skill Sp. z o.o.",
  address: ["ul. Marszałkowska 1", "00-001 Warszawa, Polska"],
  registry: "NIP 5252999990 · KRS 0000999999",
};

const aboutStats: AboutStat[] = [
  { value: "4 200+", label: "Pracodawców", sub: "Aktywne firmy" },
  { value: "18 700+", label: "Specjalistów", sub: "Zweryfikowani KYC" },
  { value: "247", label: "Zleceń dziennie", sub: "Średni wolumen" },
  { value: "92%", label: "Pozytywnych ocen", sub: "Po pierwszym zleceniu" },
];

const team: TeamMember[] = [
  { name: "Kacper Sz.", role: "Founder & CEO", avatarIndex: 3 },
  { name: "Anna K.", role: "Co-Founder, CPO", avatarIndex: 0 },
  { name: "Tomasz M.", role: "Head of Trust & Safety", avatarIndex: 8 },
  { name: "Magda W.", role: "CTO", avatarIndex: 12 },
];

const maintenance: MaintenanceStatus = {
  etaTime: "14:30 dzisiaj",
  remaining: "~22 minut",
  state: "deploy w toku",
  log: [
    { time: "14:08", text: "Migracja bazy danych ukończona", done: true },
    { time: "14:12", text: "Restart aplikacji w toku", done: true },
    { time: "14:18", text: "Weryfikacja deploymentu", done: false },
    { time: "~14:30", text: "Powrót do działania", done: false },
  ],
};

export const supportService = {
  async getHelpCategories(): Promise<HelpCategory[]> {
    return helpCategories;
  },
  async getPopularArticles(): Promise<HelpArticle[]> {
    return popularArticles;
  },
  async getContactMethods(): Promise<ContactMethod[]> {
    return contactMethods;
  },
  async getCompanyInfo(): Promise<CompanyInfo> {
    return companyInfo;
  },
  async getAboutStats(): Promise<AboutStat[]> {
    return aboutStats;
  },
  async getTeam(): Promise<TeamMember[]> {
    return team;
  },
  async getMaintenanceStatus(): Promise<MaintenanceStatus> {
    return maintenance;
  },
  async sendContactMessage(payload: { name: string; email: string; topic: string; message: string }): Promise<{ ok: true }> {
    // TODO(backend): return apiPost("/support/contact", payload);
    void payload;
    return { ok: true };
  },
};
