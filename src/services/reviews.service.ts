import type { Review } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

/** Backend review DTO. */
type ReviewDto = {
  id: string;
  jobId: string;
  authorId: string;
  authorName: string | null;
  subjectId: string;
  rating: number;
  comment: string;
  punctuality: number | null;
  quality: number | null;
  communication: number | null;
  payment: number | null;
  conditions: number | null;
  flags: string[];
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

/** Per-category 1–5 scores + incident flags submitted with a review (direction-dependent). */
export type ReviewExtras = {
  punctuality?: number;
  quality?: number;
  communication?: number;
  payment?: number;
  conditions?: number;
  flags?: string[];
};

/** Adapt a backend review DTO to the profile's display shape. */
function toReview(d: ReviewDto): Review {
  const date = new Date(d.createdAt);
  return {
    id: d.id,
    // Prefer the resolved display name; fall back to a short handle (never the raw UUID).
    author: d.authorName?.trim() || (d.authorId ? `Użytkownik #${d.authorId.slice(0, 8)}` : "Użytkownik"),
    rating: d.rating,
    text: d.comment,
    punctuality: d.punctuality,
    quality: d.quality,
    communication: d.communication,
    payment: d.payment,
    conditions: d.conditions,
    flags: d.flags ?? [],
    reply: d.reply,
    date: Number.isNaN(date.getTime())
      ? d.createdAt
      : date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }),
  };
}

export const reviewsService = {
  /** Submit a review for a completed job (overall rating + optional categories/flags). */
  async submit(
    jobId: string,
    subjectId: string,
    rating: number,
    comment: string,
    extras: ReviewExtras = {},
  ): Promise<{ ok: true }> {
    await apiPost("/api/reviews", { jobId, subjectId, rating, comment, ...extras });
    return { ok: true };
  },

  /** Reviewed party posts their single public reply to a review. */
  async reply(reviewId: string, text: string): Promise<Review> {
    const dto = await apiPost<ReviewDto>(`/api/reviews/${encodeURIComponent(reviewId)}/reply`, { text });
    return toReview(dto);
  },

  /** Public list of revealed reviews for a subject (specialist/employer). Empty on failure. */
  async listForSubject(subjectId: string): Promise<Review[]> {
    try {
      const dtos = await apiGet<ReviewDto[]>(`/api/reviews?subjectId=${encodeURIComponent(subjectId)}`);
      return dtos.map(toReview);
    } catch {
      return [];
    }
  },

  /** Reviews involving the signed-in user. Empty on failure / signed out. */
  async mine(): Promise<{ received: Review[]; given: Review[]; pendingReceived: number }> {
    try {
      const dto = await apiGet<{ received: ReviewDto[]; given: ReviewDto[]; pendingReceived: number }>(
        "/api/me/reviews",
      );
      return {
        received: dto.received.map(toReview),
        given: dto.given.map(toReview),
        pendingReceived: dto.pendingReceived ?? 0,
      };
    } catch {
      return { received: [], given: [], pendingReceived: 0 };
    }
  },
};
