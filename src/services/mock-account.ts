// Mock data for the account dashboard. Replaced by the backend later.
import type { MyJob, Conversation, SavedContact, ActivityItem, ChatMessage } from "@/lib/types";

export const myJobs: MyJob[] = [
  { id: "mj1", title: "Barman na wesele", profession: "Barman", district: "Mokotów", status: "active", applicants: 7, rate: 50, postedAgo: "2 godz. temu" },
  { id: "mj2", title: "Kelner — event firmowy", profession: "Kelner", district: "Śródmieście", status: "active", applicants: 3, rate: 42, postedAgo: "wczoraj" },
  { id: "mj3", title: "Kucharz na sezon", profession: "Kucharz", district: "Wola", status: "filled", applicants: 12, rate: 60, postedAgo: "5 dni temu" },
  { id: "mj4", title: "Pomoc kuchenna", profession: "Pomoc kuchenna", district: "Praga Południe", status: "expired", applicants: 2, rate: 33, postedAgo: "3 tyg. temu" },
];

export const conversations: Conversation[] = [
  { id: "c1", name: "Anna K.", avatarIndex: 0, role: "Barmanka, kelner", lastMessage: "Jasne, mogę być w sobotę od 17:00.", time: "12 min", unread: 2 },
  { id: "c2", name: "Tomasz P.", avatarIndex: 1, role: "Kucharz, sushi", lastMessage: "Dziękuję za wiadomość, sprawdzę termin.", time: "1 godz.", unread: 0 },
  { id: "c3", name: "Krzysztof W.", avatarIndex: 5, role: "Barman, mixolog", lastMessage: "Czy stawka jest do negocjacji?", time: "wczoraj", unread: 1 },
  { id: "c4", name: "Karolina N.", avatarIndex: 12, role: "Kelnerka", lastMessage: "Super, do zobaczenia!", time: "2 dni", unread: 0 },
];

export const savedContacts: SavedContact[] = [
  { id: "s1", name: "Anna K.", avatarIndex: 0, role: "Barmanka, kelner", district: "Mokotów", rating: 4.9, trustScore: 92 },
  { id: "s10", name: "Michał B.", avatarIndex: 9, role: "Barman", district: "Śródmieście", rating: 4.9, trustScore: 90 },
  { id: "s6", name: "Krzysztof W.", avatarIndex: 5, role: "Barman, mixolog", district: "Pruszków", rating: 4.8, trustScore: 87 },
];

export const threads: Record<string, ChatMessage[]> = {
  c1: [
    { id: "m1", fromMe: true, text: "Cześć! Szukam barmanki na wesele w sobotę, ~120 gości. Dasz radę?", time: "10:02" },
    { id: "m2", fromMe: false, text: "Cześć! Tak, mam wolny termin w sobotę.", time: "10:05" },
    { id: "m3", fromMe: false, text: "Jasne, mogę być od 17:00. Jaki jest adres lokalu?", time: "10:06" },
    { id: "m4", fromMe: true, text: "Super! Sala w Mokotowie, prześlę szczegóły. Stawka 50 zł/h pasuje?", time: "10:09" },
  ],
  c2: [
    { id: "m1", fromMe: true, text: "Dzień dobry, czy jest Pan dostępny na event firmowy w przyszłym tygodniu?", time: "wczoraj" },
    { id: "m2", fromMe: false, text: "Dziękuję za wiadomość, sprawdzę termin i odezwę się do końca dnia.", time: "wczoraj" },
  ],
  c3: [
    { id: "m1", fromMe: false, text: "Dzień dobry, widziałem ogłoszenie. Czy stawka jest do negocjacji?", time: "wczoraj" },
  ],
  c4: [
    { id: "m1", fromMe: true, text: "Dziękuję za świetną pracę na evencie!", time: "2 dni" },
    { id: "m2", fromMe: false, text: "Super, do zobaczenia!", time: "2 dni" },
  ],
};

export const activity: ActivityItem[] = [
  { id: "a1", type: "job_posted", text: "Dodałeś zlecenie „Barman na wesele”", time: "2 godz. temu" },
  { id: "a2", type: "contacted", text: "Skontaktowałeś się z Anna K.", time: "3 godz. temu" },
  { id: "a3", type: "hired", text: "Zatrudniłeś Tomasz P. do „Kucharz na sezon”", time: "5 dni temu" },
  { id: "a4", type: "review", text: "Wystawiłeś opinię (★ 5.0) dla Karolina N.", time: "1 tydz. temu" },
  { id: "a5", type: "job_posted", text: "Dodałeś zlecenie „Kelner — event firmowy”", time: "wczoraj" },
];
