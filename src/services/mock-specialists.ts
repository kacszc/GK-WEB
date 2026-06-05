// Mock specialists for the search-results screen. Replaced by the backend later.
import type { Specialist } from "@/lib/types";
import { warsawDistricts } from "./warsaw-districts";

const centerOf = (name: string): [number, number] =>
  warsawDistricts.find((d) => d.name === name)?.center ?? [21.0122, 52.2297];

// Deterministic jitter so map pins spread within a district (no Math.random →
// stable across server/client renders).
function jitter(i: number): [number, number] {
  return [(((i * 53) % 17) - 8) / 240, (((i * 97) % 19) - 9) / 240];
}

type Raw = Omit<Specialist, "id" | "avatarIndex" | "lng" | "lat">;

const raw: Raw[] = [
  { name: "Anna K.", role: "Barmanka, kelner", trustScore: 92, availability: "now", kyc: true, topRated: true, district: "Mokotów", distanceKm: 2, rateFrom: 45, rating: 4.9, reviews: 47, specialties: [{ label: "Barman", count: 9 }, { label: "Kelner", count: 14 }, { label: "Kasa fiskalna", count: 0 }], languages: ["pl", "en"], experienceYears: 6 },
  { name: "Tomasz P.", role: "Kucharz, sushi", trustScore: 89, availability: "now", kyc: true, topRated: true, district: "Wola", distanceKm: 4, rateFrom: 65, rating: 4.8, reviews: 63, specialties: [{ label: "Kucharz", count: 18 }, { label: "Sushi", count: 7 }, { label: "Język EN", count: 0 }], languages: ["pl", "en"], experienceYears: 9 },
  { name: "Marta L.", role: "Kelner, barista", trustScore: 84, availability: "week", kyc: true, topRated: false, district: "Praga Północ", distanceKm: 5, rateFrom: 38, rating: 4.7, reviews: 39, specialties: [{ label: "Kelner", count: 11 }, { label: "Barista", count: 5 }], languages: ["pl"], experienceYears: 4 },
  { name: "Paweł R.", role: "Pomoc kuchenna", trustScore: 78, availability: "now", kyc: false, topRated: false, district: "Ursynów", distanceKm: 8, rateFrom: 32, rating: 4.5, reviews: 8, specialties: [{ label: "Pomoc kuchenna", count: 4 }, { label: "Język UA", count: 0 }], languages: ["pl", "uk"], experienceYears: 2 },
  { name: "Iryna S.", role: "Kelnerka", trustScore: 81, availability: "week", kyc: false, topRated: false, district: "Bemowo", distanceKm: 11, rateFrom: 35, rating: 4.6, reviews: 16, specialties: [{ label: "Kelner", count: 7 }, { label: "Język UA", count: 0 }, { label: "Język EN", count: 0 }], languages: ["uk", "en", "pl"], experienceYears: 3 },
  { name: "Krzysztof W.", role: "Barman, mixolog", trustScore: 87, availability: "now", kyc: false, topRated: true, district: "Pruszków", distanceKm: 14, rateFrom: 55, rating: 4.8, reviews: 53, specialties: [{ label: "Barman", count: 21 }, { label: "Mixolog", count: 6 }], languages: ["pl", "en"], experienceYears: 8 },
  { name: "Joanna M.", role: "Kelnerka, hostessa", trustScore: 75, availability: "now", kyc: true, topRated: false, district: "Bielany", distanceKm: 18, rateFrom: 40, rating: 4.4, reviews: 11, specialties: [{ label: "Kelner", count: 5 }, { label: "Hostessa", count: 3 }], languages: ["pl", "en"], experienceYears: 3 },
  { name: "Robert F.", role: "Kucharz", trustScore: 72, availability: "date", availableFrom: "12 maja", kyc: false, topRated: false, district: "Wawer", distanceKm: 18, rateFrom: 58, rating: 4.5, reviews: 23, specialties: [{ label: "Kucharz", count: 9 }], languages: ["pl"], experienceYears: 5 },
  { name: "Aleksandra D.", role: "Barista, kelnerka", trustScore: 68, availability: "week", kyc: false, topRated: false, district: "Wilanów", distanceKm: 20, rateFrom: 42, rating: 4.3, reviews: 14, specialties: [{ label: "Barista", count: 4 }, { label: "Kelner", count: 6 }], languages: ["pl", "en"], experienceYears: 2 },
  { name: "Michał B.", role: "Barman", trustScore: 90, availability: "now", kyc: true, topRated: true, district: "Śródmieście", distanceKm: 1, rateFrom: 50, rating: 4.9, reviews: 71, specialties: [{ label: "Barman", count: 24 }, { label: "Mixolog", count: 8 }], languages: ["pl", "en"], experienceYears: 10 },
  { name: "Natalia Z.", role: "Hostessa, kelner", trustScore: 83, availability: "week", kyc: true, topRated: false, district: "Ochota", distanceKm: 3, rateFrom: 37, rating: 4.6, reviews: 22, specialties: [{ label: "Hostessa", count: 6 }, { label: "Kelner", count: 9 }], languages: ["pl", "en"], experienceYears: 4 },
  { name: "Dmytro H.", role: "Kucharz, pomoc kuchenna", trustScore: 79, availability: "now", kyc: false, topRated: false, district: "Targówek", distanceKm: 7, rateFrom: 44, rating: 4.5, reviews: 19, specialties: [{ label: "Kucharz", count: 12 }, { label: "Pomoc kuchenna", count: 5 }], languages: ["uk", "pl"], experienceYears: 6 },
  { name: "Karolina N.", role: "Kelnerka", trustScore: 86, availability: "now", kyc: true, topRated: true, district: "Żoliborz", distanceKm: 5, rateFrom: 39, rating: 4.8, reviews: 41, specialties: [{ label: "Kelner", count: 13 }], languages: ["pl", "en", "de"], experienceYears: 5 },
  { name: "Bartosz K.", role: "Barman, barista", trustScore: 74, availability: "week", kyc: false, topRated: false, district: "Włochy", distanceKm: 9, rateFrom: 41, rating: 4.4, reviews: 12, specialties: [{ label: "Barman", count: 7 }, { label: "Barista", count: 4 }], languages: ["pl"], experienceYears: 3 },
  { name: "Olena P.", role: "Pomoc kuchenna, sprzątanie", trustScore: 70, availability: "now", kyc: false, topRated: false, district: "Praga Południe", distanceKm: 6, rateFrom: 33, rating: 4.3, reviews: 9, specialties: [{ label: "Pomoc kuchenna", count: 6 }, { label: "Sprzątanie", count: 3 }], languages: ["uk", "ru", "pl"], experienceYears: 2 },
  { name: "Jakub S.", role: "Kucharz", trustScore: 88, availability: "week", kyc: true, topRated: true, district: "Mokotów", distanceKm: 3, rateFrom: 62, rating: 4.8, reviews: 58, specialties: [{ label: "Kucharz", count: 20 }, { label: "Język EN", count: 0 }], languages: ["pl", "en"], experienceYears: 11 },
  { name: "Wiktoria A.", role: "Barista", trustScore: 80, availability: "now", kyc: true, topRated: false, district: "Wola", distanceKm: 4, rateFrom: 36, rating: 4.6, reviews: 27, specialties: [{ label: "Barista", count: 9 }], languages: ["pl", "en"], experienceYears: 4 },
  { name: "Sergiy M.", role: "Barman, kelner", trustScore: 76, availability: "date", availableFrom: "20 maja", kyc: false, topRated: false, district: "Ursus", distanceKm: 12, rateFrom: 43, rating: 4.4, reviews: 15, specialties: [{ label: "Barman", count: 8 }, { label: "Kelner", count: 10 }], languages: ["uk", "pl", "en"], experienceYears: 5 },
];

export const specialists: Specialist[] = raw.map((s, i) => {
  const [clng, clat] = centerOf(s.district);
  const [dx, dy] = jitter(i);
  return {
    ...s,
    id: `s${i + 1}`,
    avatarIndex: i,
    lng: Math.round((clng + dx) * 1e5) / 1e5,
    lat: Math.round((clat + dy) * 1e5) / 1e5,
  };
});
