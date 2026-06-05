// HTTP wrapper for services. Once the Spring Boot backend is ready, services
// switch from mocks to these calls. The `locale` is forwarded as Accept-Language
// so the backend can return localized dynamic data (e.g. profession names).

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

type ApiOptions = RequestInit & { locale?: string };

export async function apiGet<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { locale, headers, ...init } = opts;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(locale ? { "Accept-Language": locale } : {}),
      ...headers,
    },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} — ${path}`);
  }
  return (await res.json()) as T;
}
