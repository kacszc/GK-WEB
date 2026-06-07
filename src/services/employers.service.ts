import type { EmployerProfile, EmployerRating, EmployerReview } from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { mockDelay } from "./mock-data";

/** Backend employer profile DTO (subset of the frontend EmployerProfile). */
type EmployerDto = {
  id: string;
  name: string;
  initial: string;
  verified: boolean;
  industries: string[];
  city: string;
  rating: number | null;
  completedJobs: number;
  memberSince: string;
  description: string;
  avgHireDays: number | null;
  onTimePayment: number;
  hiredRoles: { role: string; count: number }[];
  ratings: EmployerRating[];
  flags: number;
  reviews: EmployerReview[];
  seekingCount: number;
  seekingRoles: string;
};

/** Adapt the backend DTO to the richer frontend EmployerProfile. */
function toEmployerProfile(d: EmployerDto): EmployerProfile {
  return {
    id: d.id,
    name: d.name,
    initial: d.initial,
    verified: d.verified,
    industries: d.industries,
    location: d.city,
    website: "",
    email: "",
    rating: d.rating ?? 0,
    completedJobs: d.completedJobs,
    memberSince: d.memberSince,
    description: d.description,
    avgHireDays: d.avgHireDays ?? 0,
    onTimePayment: d.onTimePayment,
    hiredRoles: d.hiredRoles,
    ratings: d.ratings,
    flags: d.flags,
    reviews: d.reviews,
    activeJobs: [],
    eventColors: ["#5b4636", "#c47b35", "#4f6b58", "#7a5a6b"],
    seekingCount: d.seekingCount,
    seekingRoles: d.seekingRoles,
  };
}

const marriott: EmployerProfile = {
  id: "marriott",
  name: "Hotel Marriott Warszawa",
  initial: "M",
  verified: true,
  industries: ["Hotelarstwo", "Gastronomia", "Eventy"],
  location: "Warszawa, Aleja Jana Pawła II 22",
  website: "marriott.pl",
  email: "hr@marriott.pl",
  rating: 4.8,
  completedJobs: 47,
  memberSince: "Wrz 2024",
  description:
    "Jeden z największych hoteli biznesowych w Warszawie. Organizujemy 200+ eventów rocznie — konferencje, gale, wesela. Zatrudniamy stałą obsługę plus pracowników z platformy do obsadzenia szpic eventowych.",
  avgHireDays: 1.8,
  onTimePayment: 100,
  hiredRoles: [
    { role: "Barman", count: 18 },
    { role: "Kelner", count: 14 },
    { role: "Kucharz", count: 8 },
    { role: "Hostessa", count: 5 },
    { role: "Pomoc kuchenna", count: 2 },
  ],
  ratings: [
    { label: "Terminowość płatności", score: 5.0 },
    { label: "Warunki pracy zgodne z opisem", score: 4.9 },
    { label: "Komunikacja", score: 4.7 },
    { label: "Traktowanie", score: 4.8 },
  ],
  flags: 0,
  reviews: [
    {
      id: "er1",
      author: "Tomasz P.",
      avatarIndex: 1,
      rating: 5,
      trustScore: 89,
      role: "Kucharz · event firmowy 12.05.2026",
      text: "Profesjonalny event coordinator, brief był jasny, wszystko zgodnie z planem. Płatność tego samego wieczoru.",
      time: "1 tydz. temu",
    },
    {
      id: "er2",
      author: "Marta L.",
      avatarIndex: 2,
      rating: 5,
      trustScore: 84,
      role: "Barman · gala 22.04.2026",
      text: "Drugi event z Marriott, znów bardzo dobrze. Dali ciepły posiłek dla obsługi i wcześniej wysłali plan godzinowy. Polecam.",
      time: "3 tyg. temu",
    },
    {
      id: "er3",
      author: "Krzysztof W.",
      avatarIndex: 5,
      rating: 4,
      trustScore: 87,
      role: "Barman · event firmowy 02.04.2026",
      text: "Generalnie OK. Jedna rzecz — zaczęliśmy 30 min później niż było ustalone, bez wcześniejszej informacji. Reszta bez zastrzeżeń.",
      time: "5 tyg. temu",
    },
  ],
  activeJobs: [
    { id: "ej1", title: "Barman event 150 osób", meta: "Sob. 16:00 · 55 zł/h" },
    { id: "ej2", title: "Kelner — śniadania weekend", meta: "Sob–Nd 10–17:00 · 42 zł/h" },
    { id: "ej3", title: "Kucharz na otwarcie restauracji", meta: "Pt. 23:00 · 85 zł/h" },
  ],
  eventColors: ["#5b4636", "#c47b35", "#4f6b58", "#7a5a6b"],
  seekingCount: 3,
  seekingRoles: "Barman, kelner, kucharz — eventy maj 2026.",
};

const employers: Record<string, EmployerProfile> = { marriott };

export const employersService = {
  async getProfile(id: string): Promise<EmployerProfile | null> {
    try {
      const dto = await apiGet<EmployerDto>(`/api/employers/${encodeURIComponent(id)}`);
      return toEmployerProfile(dto);
    } catch {
      // Backend unavailable — fall back to the showcase profile.
      await mockDelay();
      return employers[id] ?? marriott;
    }
  },
};
