import type { Dispute, DisputeReason, DisputeEvent, DisputeEventType, DisputeSummary } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

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

// --- Enum mapping: UI reason ↔ backend UPPER_SNAKE. -----------------------

const REASON_TO_ENUM: Record<DisputeReason, string> = {
  no_payment: "NO_PAYMENT",
  conditions: "CONDITIONS",
  other: "OTHER",
};
function reasonFromEnum(s: string): DisputeReason {
  switch (s?.toUpperCase()) {
    case "NO_PAYMENT":
      return "no_payment";
    case "CONDITIONS":
      return "conditions";
    default:
      return "other";
  }
}

// --- Backend DTO ----------------------------------------------------------

type DisputeEventDto = { kind: string; text: string; at: string };
type DisputeView = {
  id: string;
  jobId: string;
  openedByUserId: string;
  counterpartyId: string;
  reason: string;
  description: string;
  status: "OPEN" | "RESOLVED";
  mediator: string | null;
  resolution: string | null;
  events: DisputeEventDto[];
  createdAt: string;
};

/** Map a backend event `kind` to a timeline event type (best-effort). */
function eventType(kind: string): DisputeEventType {
  const k = (kind ?? "").toUpperCase();
  if (k.includes("OPEN")) return "opened";
  if (k.includes("MEDIATOR")) return "mediator";
  if (k.includes("RESPONSE") || k.includes("REPLY")) return "response";
  if (k.includes("CLOSE") || k.includes("RESOLVE")) return "closed";
  return "system";
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Title derived from event type, since the backend only sends `kind`/`text`. */
function eventTitle(type: DisputeEventType): string {
  switch (type) {
    case "opened":
      return "Spór otwarty";
    case "mediator":
      return "Mediator dołączył do sprawy";
    case "response":
      return "Druga strona odpowiedziała";
    case "closed":
      return "Spór zamknięty";
    default:
      return "Aktualizacja systemowa";
  }
}

function toDispute(v: DisputeView): Dispute {
  const events: DisputeEvent[] = (v.events ?? []).map((e, i) => {
    const type = eventType(e.kind);
    return { id: `e${i}`, type, title: eventTitle(type), text: e.text, time: fmtDateTime(e.at) };
  });
  return {
    id: v.id,
    counterparty: v.counterpartyId,
    reasonLabel: reasonLabels[reasonFromEnum(v.reason)],
    openedAt: fmtDateTime(v.createdAt),
    mediator: v.mediator ?? "skill.com",
    remaining: "24h",
    events,
  };
}

type DisputeSummaryDto = {
  id: string;
  jobId: string;
  counterpartyId: string;
  reason: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
};

export const disputesService = {
  /** Current user's disputes (as opener or counterparty). */
  async getMyDisputes(): Promise<DisputeSummary[]> {
    const dtos = await apiGet<DisputeSummaryDto[]>("/api/disputes");
    return dtos.map((d) => ({
      id: d.id,
      counterpartyId: d.counterpartyId,
      reasonLabel: reasonLabels[reasonFromEnum(d.reason)],
      status: d.status === "RESOLVED" ? "resolved" : "open",
      openedAt: fmtDateTime(d.createdAt),
    }));
  },

  /** Open a new dispute and return the created mediation case. */
  async open(draft: OpenDisputeDraft): Promise<Dispute> {
    const view = await apiPost<DisputeView>("/api/disputes", {
      jobId: draft.jobId,
      counterparty: draft.counterparty,
      reason: REASON_TO_ENUM[draft.reason],
      description: draft.description,
    });
    return toDispute(view);
  },

  /** Fetch an existing dispute by id. */
  async get(id: string): Promise<Dispute> {
    return toDispute(await apiGet<DisputeView>(`/api/disputes/${encodeURIComponent(id)}`));
  },

  /** Resolve a dispute (status → RESOLVED). */
  async resolve(id: string, resolution?: string): Promise<{ ok: true }> {
    await apiPost(`/api/disputes/${encodeURIComponent(id)}/resolve`, resolution ? { resolution } : {});
    return { ok: true };
  },
};
