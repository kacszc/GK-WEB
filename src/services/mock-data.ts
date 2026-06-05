// Mock data — the ONLY place with hardcoded data.
// To be replaced by API responses (Spring Boot). See the services next to this file.

import type {
  Profession,
  Specialization,
  Person,
  Trend,
  LiveStat,
} from "@/lib/types";

/** Simulates network latency (random ms) so the UI behaves like with a real backend. */
export function mockDelay(min = 180, max = 620): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const professions: Profession[] = [
  { label: "Barman", count: 38, live: true },
  { label: "Kelner", count: 67, live: true },
  { label: "Kucharz", count: 19 },
  { label: "Pomoc kuchenna", count: 44 },
  { label: "Sprzątanie", count: 76 },
  { label: "Elektryk SEP", count: 24 },
  { label: "Kierowca C+E", count: 18 },
  { label: "Magazynier", count: 51 },
  { label: "Hostessa", count: 12 },
  { label: "Barista", count: 9 },
  { label: "Mixolog", count: 8 },
  { label: "Glazurnik", count: 15 },
  { label: "Murarz", count: 22 },
  { label: "Recepcja", count: 6 },
];

export const suggestedSpecializations: Specialization[] = [
  { title: "Barman", count: 38, hint: "enter" },
  { title: "Barman + Kelner", count: 24, hint: "arrow" },
  { title: "Barman + Mixolog", count: 12, hint: "arrow" },
  { title: "Barista (też nazywany barmanem)", count: 18, hint: "arrow" },
];

export const peopleNearby: Person[] = [
  { name: "Anna K.", score: 9.7, meta: "Barmanka, kelnerka · Mokotów · 2 km" },
  { name: "Krzysztof W.", score: 9.4, meta: "Barman, mixolog · Praga-Płd. · 4 km" },
  { name: "Tomasz P.", score: 9.1, meta: "Kucharz, barman · Wola · 6 km" },
];

export const trending: Trend[] = [
  { rank: "01", label: "Barman / Bartender", delta: 18, added: 312 },
  { rank: "02", label: "Sprzątanie biur", delta: 24, added: 287 },
  { rank: "03", label: "Kierowca C+E", delta: 9, added: 156 },
  { rank: "04", label: "Elektryk SEP", delta: 31, added: 134 },
  { rank: "05", label: "Hostessa", delta: 12, added: 98 },
];

export const liveStats: LiveStat[] = [
  { value: "247", desc: "specjalistów online TERAZ", accent: true },
  { value: "1 248", desc: "zleceń aktywnych w Warszawie" },
  { value: "3 min", desc: "średni czas pierwszej odpowiedzi" },
];
