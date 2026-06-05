import type { LegalDoc, CookieCategory } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { mockDelay } from "./mock-data";

// Legal documents are dynamic content: the backend returns them localized via
// the Accept-Language header. Mocks below are the Polish source of truth.

const terms: LegalDoc = {
  slug: "terms",
  title: "Regulamin platformy skill.com",
  effectiveFrom: "13.05.2026",
  version: "1.0",
  updated: "13.05.2026",
  sections: [
    {
      id: "ogolne",
      number: "§1",
      title: "Postanowienia ogólne",
      paragraphs: [
        "Niniejszy Regulamin określa zasady korzystania z platformy skill.com (dalej: Platforma), prowadzonej przez Skill Sp. z o.o. z siedzibą w Warszawie, NIP: 5252999990, KRS: 0000999999.",
        "Platforma to serwis internetowy umożliwiający kontakt między Pracodawcami (osoby/firmy poszukujące specjalistów) a Pracownikami (osoby świadczące usługi).",
        "Korzystanie z Platformy wymaga rejestracji konta i akceptacji niniejszego Regulaminu oraz Polityki Prywatności.",
      ],
    },
    {
      id: "definicje",
      number: "§2",
      title: "Definicje",
      paragraphs: [
        "Platforma — serwis internetowy skill.com dostępny pod adresem www.skill.com.",
        "Użytkownik — osoba fizyczna lub prawna posiadająca konto na Platformie.",
        "Pracodawca — Użytkownik publikujący zlecenia i poszukujący Pracowników.",
        "Pracownik — Użytkownik posiadający profil specjalisty i aplikujący na zlecenia.",
        "Tokeny — wirtualna jednostka rozliczeniowa umożliwiająca kontakt z Pracownikiem.",
        "Trust Score — algorytmiczna ocena wiarygodności użytkownika w skali 0–100.",
      ],
    },
    {
      id: "rejestracja",
      number: "§3",
      title: "Rejestracja konta",
      paragraphs: [
        "Rejestracja jest dobrowolna i bezpłatna. Do założenia konta wymagany jest adres e-mail oraz akceptacja Regulaminu.",
        "Użytkownik zobowiązuje się podawać dane prawdziwe i aktualne. Pracownicy świadczący usługi powyżej progu ustawowego przechodzą weryfikację tożsamości (KYC).",
      ],
    },
    {
      id: "platnosci",
      number: "§4",
      title: "Brak pośrednictwa w płatnościach",
      paragraphs: [
        "Platforma NIE POŚREDNICZY w płatnościach między Pracodawcą a Pracownikiem. Wszelkie rozliczenia za wykonane usługi są bezpośrednio między stronami.",
        "Platforma pobiera opłaty wyłącznie za: (a) zakup pakietów Tokenów; (b) subskrypcję PRO dla Pracowników; (c) Boosty profilu i ogłoszeń.",
        "Strony są zobowiązane do samodzielnego rozliczenia z dochodów uzyskanych za pośrednictwem Platformy. Platforma nie wystawia faktur za usługi świadczone przez Pracowników.",
        "W przypadku sporów dot. płatności między stronami, Platforma może pełnić rolę mediatora, ale nie jest stroną umowy.",
      ],
    },
    {
      id: "trust",
      number: "§5",
      title: "Trust Score i weryfikacja",
      paragraphs: [
        "Trust Score jest algorytmiczną oceną wiarygodności użytkownika w skali 0–100 punktów.",
        "Na Trust Score wpływają: weryfikacja KYC, oceny po zleceniach, punktualność, doświadczenie, jakość profilu i aktywność.",
        "Platforma zastrzega prawo do modyfikacji algorytmu Trust Score w celu poprawy jego trafności.",
        "Weryfikacja tożsamości (KYC) jest obowiązkowa dla Pracowników świadczących usługi za ponad 5000 zł miesięcznie.",
      ],
    },
    {
      id: "odpowiedzialnosc",
      number: "§6",
      title: "Odpowiedzialność platformy",
      paragraphs: [
        "Platforma nie ponosi odpowiedzialności za jakość, terminowość lub zgodność z opisem usług świadczonych przez Pracowników.",
        "Platforma nie weryfikuje zawartości umów zawieranych między Użytkownikami.",
        "Platforma dokłada starań w weryfikacji tożsamości użytkowników (KYC, GUS), ale nie gwarantuje 100% trafności.",
        "Maksymalna odpowiedzialność Platformy ograniczona jest do wartości opłat poniesionych przez Użytkownika w ciągu ostatnich 12 miesięcy.",
      ],
    },
    {
      id: "reklamacje",
      number: "§7",
      title: "Reklamacje i spory",
      paragraphs: [
        "Reklamacje dotyczące działania Platformy można zgłaszać na adres support@skill.com. Rozpatrujemy je w terminie 14 dni roboczych.",
        "Spory między Pracodawcą a Pracownikiem rozstrzygane są w pierwszej kolejności poprzez wewnętrzny proces mediacji dostępny w panelu zlecenia.",
      ],
    },
    {
      id: "koncowe",
      number: "§8",
      title: "Postanowienia końcowe",
      paragraphs: [
        "Platforma zastrzega prawo do zmiany Regulaminu. O zmianach Użytkownicy informowani są z 14-dniowym wyprzedzeniem.",
        "W sprawach nieuregulowanych zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o świadczeniu usług drogą elektroniczną.",
      ],
    },
  ],
};

const privacy: LegalDoc = {
  slug: "privacy",
  title: "Polityka prywatności",
  effectiveFrom: "13.05.2026",
  version: "1.0",
  updated: "13.05.2026",
  sections: [
    {
      id: "administrator",
      number: "§1",
      title: "Administrator danych",
      paragraphs: [
        "Administratorem danych osobowych jest Skill Sp. z o.o. z siedzibą w Warszawie (ul. Marszałkowska 1, 00-001 Warszawa), NIP: 5252999990.",
        "W sprawach dotyczących ochrony danych można kontaktować się z Inspektorem Ochrony Danych pod adresem iod@skill.com.",
      ],
    },
    {
      id: "zakres",
      number: "§2",
      title: "Zakres przetwarzanych danych",
      paragraphs: [
        "Przetwarzamy dane podane przy rejestracji (imię, e-mail, telefon), dane profilu zawodowego, dane weryfikacji tożsamości (KYC) oraz dane techniczne (adres IP, pliki cookies).",
        "Dane KYC (dokument tożsamości, selfie) są szyfrowane i przechowywane przez certyfikowanego dostawcę weryfikacji.",
      ],
    },
    {
      id: "cele",
      number: "§3",
      title: "Cele i podstawy przetwarzania",
      paragraphs: [
        "Świadczenie usług Platformy — na podstawie umowy (art. 6 ust. 1 lit. b RODO).",
        "Weryfikacja tożsamości i przeciwdziałanie nadużyciom — prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).",
        "Marketing — wyłącznie za zgodą Użytkownika (art. 6 ust. 1 lit. a RODO).",
      ],
    },
    {
      id: "prawa",
      number: "§4",
      title: "Twoje prawa (RODO art. 15–20)",
      paragraphs: [
        "Masz prawo do: dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu.",
        "Możesz w każdej chwili wyeksportować swoje dane w formacie JSON lub CSV z poziomu Ustawień konta → Prywatność & GDPR.",
        "Przysługuje Ci prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.",
      ],
    },
    {
      id: "przechowywanie",
      number: "§5",
      title: "Okres przechowywania",
      paragraphs: [
        "Dane konta przechowujemy przez czas trwania umowy oraz 30 dni po jego usunięciu (okres karencji na przywrócenie).",
        "Dane rozliczeniowe przechowujemy przez okres wymagany przepisami podatkowymi (5 lat).",
      ],
    },
  ],
};

const cookiesDoc: LegalDoc = {
  slug: "cookies",
  title: "Polityka cookies",
  effectiveFrom: "13.05.2026",
  version: "1.0",
  updated: "13.05.2026",
  sections: [
    {
      id: "co-to",
      number: "§1",
      title: "Czym są pliki cookies",
      paragraphs: [
        "Cookies to małe pliki tekstowe zapisywane na Twoim urządzeniu. Używamy ich do działania serwisu, analityki i — za Twoją zgodą — marketingu.",
        "Możesz w każdej chwili zmienić swoje preferencje korzystając z przycisku „Zmień preferencje cookies”.",
      ],
    },
    {
      id: "rodzaje",
      number: "§2",
      title: "Rodzaje wykorzystywanych cookies",
      paragraphs: [
        "Szczegółowy wykaz kategorii (niezbędne, wydajnościowe, funkcjonalne, marketingowe) wraz z czasem przechowywania znajduje się w panelu preferencji poniżej.",
        "Cookies niezbędne są konieczne do działania serwisu i nie można ich wyłączyć.",
      ],
    },
  ],
};

const community: LegalDoc = {
  slug: "community",
  title: "Zasady społeczności",
  effectiveFrom: "13.05.2026",
  version: "1.0",
  updated: "13.05.2026",
  sections: [
    {
      id: "wartosci",
      number: "§1",
      title: "Nasze wartości",
      paragraphs: [
        "skill.com opiera się na zaufaniu. Oczekujemy od wszystkich Użytkowników szacunku, uczciwości i profesjonalizmu.",
        "Profil i oceny budują Twoją reputację — traktuj każdą współpracę poważnie.",
      ],
    },
    {
      id: "zakazane",
      number: "§2",
      title: "Czego nie tolerujemy",
      paragraphs: [
        "Mowy nienawiści, dyskryminacji, nękania i gróźb wobec innych Użytkowników.",
        "Fałszywych profili, podszywania się, manipulowania ocenami i Trust Score.",
        "Prób obejścia płatności za kontakt oraz wyłudzania danych poza Platformą.",
        "Publikowania treści niezgodnych z prawem lub naruszających prawa osób trzecich.",
      ],
    },
    {
      id: "zglaszanie",
      number: "§3",
      title: "Zgłaszanie naruszeń",
      paragraphs: [
        "Każdy profil i wiadomość możesz zgłosić przyciskiem „Zgłoś”. Zgłoszenia rozpatrujemy w ciągu 48 godzin.",
        "Pilne sprawy (bezpieczeństwo, oszustwo) zgłaszaj na abuse@skill.com — odpowiadamy w ciągu 4 godzin.",
      ],
    },
    {
      id: "konsekwencje",
      number: "§4",
      title: "Konsekwencje",
      paragraphs: [
        "W zależności od wagi naruszenia stosujemy: ostrzeżenie, obniżenie Trust Score, czasowe zawieszenie lub trwałą blokadę konta.",
      ],
    },
  ],
};

const docs: Record<string, LegalDoc> = {
  terms: terms,
  privacy: privacy,
  cookies: cookiesDoc,
  community: community,
};

const cookieCategories: CookieCategory[] = [
  {
    id: "essential",
    name: "Niezbędne",
    description: "Konieczne do działania serwisu (logowanie, koszyk tokenów, sesja). Nie można ich wyłączyć.",
    duration: "Sesja",
    examples: "session_id, csrf_token, auth_token",
    required: true,
  },
  {
    id: "performance",
    name: "Wydajnościowe",
    description: "Pomagają nam zrozumieć jak korzystasz z serwisu (Google Analytics, statystyki błędów).",
    duration: "12 miesięcy",
    examples: "_ga, _gid, sentry_session",
    required: false,
  },
  {
    id: "functional",
    name: "Funkcjonalne",
    description: "Zapamiętują Twoje preferencje (język, motyw, zapisane wyszukiwania).",
    duration: "12 miesięcy",
    examples: "lang_pref, theme, saved_filters",
    required: false,
  },
  {
    id: "marketing",
    name: "Marketingowe",
    description: "Pokazujemy spersonalizowane reklamy w Google Ads, Facebook (tylko za zgodą).",
    duration: "90 dni",
    examples: "_fbp, _gcl_au, mp_*",
    required: false,
  },
];

export const legalService = {
  /** A single legal document by slug. */
  async getDocument(slug: string): Promise<LegalDoc | null> {
    // TODO(backend): return apiGet(`/legal/${slug}`); // localized via Accept-Language
    await mockDelay();
    return docs[slug] ?? null;
  },

  /** Cookie categories shown in the consent banner and policy page. */
  async getCookieCategories(): Promise<CookieCategory[]> {
    // TODO(backend): return apiGet("/legal/cookie-categories");
    await mockDelay(150, 350);
    return cookieCategories;
  },
};
