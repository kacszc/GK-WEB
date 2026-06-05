import type { Dispute, DisputeReason } from "@/lib/types";
// import { apiGet, apiPost } from "@/lib/api-client";
import { mockDelay } from "./mock-data";

export type OpenDisputeDraft = {
  jobId: string;
  counterparty: string;
  reason: DisputeReason;
  description: string;
  evidence: string[];
};

const reasonLabels: Record<DisputeReason, string> = {
  no_payment: "Nie zapłacił w terminie",
  conditions: "Warunki pracy inne niż ustalone",
  other: "Inny powód",
};

export const disputesService = {
  /** Open a new dispute and return the created mediation case. */
  async open(draft: OpenDisputeDraft): Promise<Dispute> {
    // TODO(backend): return apiPost("/disputes", draft);
    await mockDelay(700, 1200);
    return {
      id: "2891",
      counterparty: draft.counterparty,
      reasonLabel: reasonLabels[draft.reason],
      openedAt: "25.05.2026 14:32",
      mediator: "Marek B.",
      remaining: "16h",
      events: [
        { id: "e1", type: "opened", title: "Spór otwarty", text: `Powód: ${reasonLabels[draft.reason]}. ${draft.description}`.trim(), time: "25.05 14:32" },
        { id: "e2", type: "mediator", title: "Mediator dołączył do sprawy · Marek B.", text: "Witam. Skontaktuję się z obiema stronami w ciągu 24h na zebranie szczegółów. Proszę o cierpliwość.", time: "25.05 16:08" },
      ],
    };
  },

  /** Fetch an existing dispute by id. */
  async get(id: string): Promise<Dispute> {
    // TODO(backend): return apiGet(`/disputes/${id}`);
    await mockDelay();
    return {
      id,
      counterparty: "Hotel Marriott Warszawa",
      reasonLabel: "Nie zapłacił w terminie",
      openedAt: "25.05.2026 14:32",
      mediator: "Marek B.",
      remaining: "16h",
      events: [
        { id: "e1", type: "opened", title: "Spór otwarty · Anna K. (pracownik)", text: "Materiał miał zapłacić 330 zł do końca tygodnia. Minęło 8 dni, brak płatności mimo 2 wiadomości. Załączono 2 screenshoty.", time: "25.05 14:32" },
        { id: "e2", type: "mediator", title: "Mediator dołączył do sprawy · Marek B.", text: "Witam. Skontaktuję się z obiema stronami w ciągu 24h. W razie braku odpowiedzi sprawa pójdzie do osądu publicznego rozstrzygnięcia.", time: "25.05 16:08" },
        { id: "e3", type: "response", title: "Pracodawca odpowiedział · Hotel Marriott", text: "Przepraszamy — była awaria systemu księgowego. Płatność zlecona dziś rano, dotrze do 2 dni. Załączamy potwierdzenie z banku.", time: "26.05 09:14" },
        { id: "e4", type: "system", title: "Wpłata zarejestrowana · System", text: "skill.com potwierdza wpłatę 330 zł od Hotel Marriott na konto Anna K. Status sporu można teraz zamknąć.", time: "28.05 11:02" },
      ],
    };
  },

  async resolve(id: string): Promise<{ ok: true }> {
    // TODO(backend): return apiPost(`/disputes/${id}/resolve`, {});
    void id;
    await mockDelay(500, 900);
    return { ok: true };
  },
};
