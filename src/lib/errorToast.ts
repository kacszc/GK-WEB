// Bridge between the (non-React) React Query cache callbacks and the toast UI. A component inside
// the providers registers the actual show function; the query/mutation caches call report() on any
// failed request. Deduped so a burst of failing requests shows a single "try again" toast.

let handler: (() => void) | null = null;
let lastShownAt = 0;
const DEDUPE_MS = 3000;

export function setErrorToastHandler(fn: (() => void) | null): void {
  handler = fn;
}

/** Show the generic "something failed, try again" toast (deduped). */
export function reportRequestError(): void {
  if (!handler) return;
  const now = Date.now();
  if (now - lastShownAt < DEDUPE_MS) return;
  lastShownAt = now;
  handler();
}
