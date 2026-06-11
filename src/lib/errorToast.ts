// Bridge between the (non-React) React Query cache callbacks and the toast UI. A component inside
// the providers registers the actual show function; the query/mutation caches call report() on any
// failed request. Deduped so a burst of failing requests shows a single toast.

import { ApiError } from "@/lib/api-client";

type T = (key: string, params?: Record<string, string | number>) => string;

let handler: ((error?: unknown) => void) | null = null;
let lastShownAt = 0;
const DEDUPE_MS = 3000;

export function setErrorToastHandler(fn: ((error?: unknown) => void) | null): void {
  handler = fn;
}

/** Show the request-error toast (deduped). Passes the error through so the toast can specialize. */
export function reportRequestError(error?: unknown): void {
  if (!handler) return;
  const now = Date.now();
  if (now - lastShownAt < DEDUPE_MS) return;
  lastShownAt = now;
  handler(error);
}

/**
 * Pick the right toast for a failed request: a "slow down" message for HTTP 429 (with the
 * Retry-After seconds when known), otherwise the generic "try again". Shared by the global
 * React Query handler and direct service calls so the messaging is consistent.
 */
export function requestErrorToast(error: unknown, t: T): { title: string; body: string } {
  if (error instanceof ApiError && error.status === 429) {
    const seconds = error.retryAfter ?? 0;
    return {
      title: t("error.rateLimitTitle"),
      body: seconds > 0 ? t("error.rateLimitBodySecs", { seconds }) : t("error.rateLimitBody"),
    };
  }
  return { title: t("error.title"), body: t("error.body") };
}
