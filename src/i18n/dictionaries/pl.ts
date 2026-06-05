// Polish dictionary — source of truth for the Dictionary shape.
const pl = {
  nav: {
    pricing: "Cennik",
    howItWorks: "Jak działa",
    addJob: "Dodaj zlecenie",
    login: "Zaloguj",
    register: "Zarejestruj się",
  },
  hero: {
    toggleWorker: "Szukam pracownika",
    toggleJob: "Szukam pracy",
  },
  search: {
    placeholder: "Wpisz zawód, specjalizację lub umiejętność…",
    examples: ["Barman", "Kelner", "Elektryk SEP", "Kierowca C+E", "Sprzątanie"],
    cta: "Szukaj",
  },
  filters: {
    when: "KIEDY",
    today: "Dziś",
    tomorrow: "Jutro",
    weekend: "Weekend",
    where: "GDZIE",
    location: "LOKALIZACJA",
    locationPlaceholder: "Miasto lub dzielnica",
    radius: "PROMIEŃ",
    upTo: "do {km} km",
  },
  dropdown: {
    suggested: "SUGEROWANE SPECJALIZACJE",
    openMap: "Otwórz na mapie",
    searching: "SZUKAM…",
    noResults: "Brak wyników dla „{query}”",
    noResultsHint: "Spróbuj innego zawodu lub specjalizacji.",
  },
  mode: {
    worker: {
      title: "Kogo dziś potrzebujesz?",
      subtitleLoading: "Szukam dostępnych specjalistów…",
      subtitleEmpty: "Wpisz, by zobaczyć dostępnych specjalistów",
      subtitleResults: "Live · {count} dostępnych specjalistów TERAZ",
      availableNow: "{count} dostępnych TERAZ",
      itemsCount: "{count} dostępnych specjalistów",
      nearby: "AKTUALNIE NAJBLIŻEJ CIEBIE",
      showAll: "Pokaż wszystkie {count} wyniki",
    },
    job: {
      title: "Jakiej pracy dziś szukasz?",
      subtitleLoading: "Szukam dostępnych ofert…",
      subtitleEmpty: "Wpisz, by zobaczyć dostępne oferty",
      subtitleResults: "Live · {count} ofert dostępnych TERAZ",
      availableNow: "{count} ofert TERAZ",
      itemsCount: "{count} dostępnych ofert",
      nearby: "OFERTY NAJBLIŻEJ CIEBIE",
      showAll: "Pokaż wszystkie {count} oferty",
    },
  },
  chips: {
    heading: "JEDNYM KLIKNIĘCIEM · POPULARNE",
    now: "TERAZ",
  },
  actions: {
    heading: "Akcja jednym kliknięciem",
    liveBadge: "{count} OSÓB DOSTĘPNYCH TERAZ",
    searchTitle: "Wyszukaj specjalistę",
    searchDesc:
      "247 osób TERAZ w Warszawie. Trust Score, oceny, certyfikaty — wszystko w 1 widoku.",
    searchCta: "Otwórz wyszukiwarkę",
    mapTitle: "Zobacz na mapie",
    mapDesc:
      "Just-in-Eat-style: pinezki na mapie, hover = podgląd, kliknięcie = profil. Tryb 47 osób.",
    mapCta: "Otwórz mapę",
    jobTitle: "Dodaj zlecenie",
    jobDesc:
      "2 minuty. Twoje zlecenie zobaczy 247 dostępnych specjalistów — pierwsze odpowiedzi w kilka minut.",
    jobCta: "Stwórz zlecenie",
  },
  popular: {
    label: "POPULARNE OSTATNIO",
    sublabel: "Najczęściej szukane specjalizacje w Warszawie · ostatnie 24h",
    trendingTitle: "Najczęściej szukane",
    last24h: "ostatnie 24h",
    liveTitle: "Teraz w skill.com",
    live: "live",
  },
  trust: {
    using: "Korzystają już:",
    employers: "{n}+ pracodawców",
    specialists: "{n}+ zweryfikowanych specjalistów",
    ratings: "{n}% pozytywnych ocen",
    badges: ["GUS API", "KYC weryfikacja", "Trust Score", "Polskie firmy", "Bez prowizji od zleceń"],
  },
  footer: {
    description:
      "Zaufana platforma łącząca pracodawców ze zweryfikowanymi specjalistami w Polsce.",
    columns: [
      { title: "PLATFORMA", links: ["Jak działa", "Cennik", "Trust Score", "Bezpieczeństwo", "API"] },
      { title: "DLA PRACODAWCÓW", links: ["Dodaj zlecenie", "Szukaj specjalisty", "Boosty zleceń", "Pakiety enterprise"] },
      { title: "DLA SPECJALISTÓW", links: ["Załóż profil", "Subskrypcja PRO", "Boosty profilu", "Weryfikacja KYC"] },
      { title: "FIRMA", links: ["O nas", "Kontakt", "Praca w skill.com", "Blog", "Pomoc"] },
    ],
    legal: ["Regulamin", "Polityka prywatności", "Pliki cookies", "RODO"],
    copyright: "© 2026 skill.com sp. z o.o. · NIP 5252999999 · ul. Marszałkowska 1, Warszawa",
  },
  language: {
    label: "Język",
  },
  meta: {
    title: "skill.com — Kogo dziś potrzebujesz?",
    description:
      "Marketplace łączący pracodawców ze zweryfikowanymi specjalistami. Znajdź fachowca dostępnego teraz w Twojej okolicy.",
  },
};

export type Dictionary = typeof pl;
export default pl;
