// HTTP wrapper for services. Once the Spring Boot backend is ready, services
// switch from mocks to these calls. The `locale` is forwarded as Accept-Language
// so the backend can return localized dynamic data (e.g. profession names), and
// the Firebase ID token (when signed in) is attached as a Bearer token.

import { getCurrentIdToken } from "@/lib/auth-token";

// Base URL of the Spring Boot backend. Routes live under `/api/...`.
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type ApiOptions = RequestInit & { locale?: string };

/** Thrown on non-2xx responses. `status` lets callers branch (e.g. 422 token gate, 429 rate limit). */
export class ApiError extends Error {
  readonly status: number;
  /** Seconds to back off, parsed from the `Retry-After` header (set on 429 responses). */
  readonly retryAfter?: number;
  constructor(status: number, message: string, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function request<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { locale, headers, ...init } = opts;
  const build = (token: string | null) => ({
    "Content-Type": "application/json",
    ...(locale ? { "Accept-Language": locale } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  });

  let token = await getCurrentIdToken();
  let res = await fetch(`${BASE_URL}${path}`, { headers: build(token), ...init });

  // Stale-claim recovery: when signed in but unauthorized/forbidden, the ID token may carry
  // outdated claims (e.g. email_verified or role just changed). Force-refresh it once and retry.
  if (token && (res.status === 401 || res.status === 403)) {
    token = await getCurrentIdToken(true);
    res = await fetch(`${BASE_URL}${path}`, { headers: build(token), ...init });
  }

  if (!res.ok) {
    const retryAfter = Number(res.headers.get("Retry-After"));
    throw new ApiError(
      res.status,
      `API ${res.status} ${res.statusText} — ${path}`,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }
  // 204 / empty body — return undefined cast to T.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function apiGet<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  return request<T>(path, { ...opts, method: "GET" });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  opts: ApiOptions = {},
): Promise<T> {
  return request<T>(path, {
    ...opts,
    method: "POST",
    body: body == null ? undefined : JSON.stringify(body),
  });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  opts: ApiOptions = {},
): Promise<T> {
  return request<T>(path, {
    ...opts,
    method: "PUT",
    body: body == null ? undefined : JSON.stringify(body),
  });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  opts: ApiOptions = {},
): Promise<T> {
  return request<T>(path, {
    ...opts,
    method: "PATCH",
    body: body == null ? undefined : JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  return request<T>(path, { ...opts, method: "DELETE" });
}

/** True when a real backend URL is configured (used to decide mock vs HTTP). */
export const apiConfigured = Boolean(process.env.NEXT_PUBLIC_API_URL);
