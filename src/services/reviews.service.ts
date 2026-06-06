import type { Review } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

/** Backend review DTO. */
type ReviewDto = {
  id: string;
  jobId: string;
  authorId: string;
  subjectId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

/** Adapt a backend review DTO to the profile's display shape. */
function toReview(d: ReviewDto): Review {
  const date = new Date(d.createdAt);
  return {
    author: d.authorId,
    rating: d.rating,
    text: d.comment,
    date: Number.isNaN(date.getTime())
      ? d.createdAt
      : date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }),
  };
}

export const reviewsService = {
  /** Submit a review for a completed job. */
  async submit(jobId: string, subjectId: string, rating: number, comment: string): Promise<{ ok: true }> {
    await apiPost("/api/reviews", { jobId, subjectId, rating, comment });
    return { ok: true };
  },

  /** Public list of reviews for a subject (specialist/employer). Empty on failure. */
  async listForSubject(subjectId: string): Promise<Review[]> {
    try {
      const dtos = await apiGet<ReviewDto[]>(`/api/reviews?subjectId=${encodeURIComponent(subjectId)}`);
      return dtos.map(toReview);
    } catch {
      return [];
    }
  },

  /** Reviews involving the signed-in user. Empty on failure / signed out. */
  async mine(): Promise<{ received: Review[]; given: Review[] }> {
    try {
      const dto = await apiGet<{ received: ReviewDto[]; given: ReviewDto[] }>("/api/me/reviews");
      return { received: dto.received.map(toReview), given: dto.given.map(toReview) };
    } catch {
      return { received: [], given: [] };
    }
  },
};
