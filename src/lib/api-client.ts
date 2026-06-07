// HTTP wrapper for services. Once the Spring Boot backend is ready, services
// switch from mocks to these calls. The `locale` is forwarded as Accept-Language
// so the backend can return localized dynamic data (e.g. profession names), and
// the Firebase ID token (when signed in) is attached as a Bearer token.

import { getCurrentIdToken } from "@/lib/auth-token";

// Base URL of the Spring Boot backend. Routes live under `/api/...`.
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type ApiOptions = RequestInit & { locale?: string };

/** Thrown on non-2xx responses. `status` lets callers branch (e.g. 422 token gate). */
export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getCurrentIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { locale, headers, ...init } = opts;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(locale ? { "Accept-Language": locale } : {}),
      ...(await authHeaders()),
      ...headers,
    },
    ...init,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status} ${res.statusText} — ${path}`);
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
