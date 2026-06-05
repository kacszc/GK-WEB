import type { Dictionary } from "./dictionaries/pl";

export type TParams = Record<string, string | number>;

/** Resolve a dotted key against the dictionary and interpolate {param} placeholders. */
export function translate(dict: Dictionary, key: string, params?: TParams): string {
  const value = key
    .split(".")
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], dict);

  if (typeof value !== "string") return key;
  if (!params) return value;

  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

export type TFunction = (key: string, params?: TParams) => string;
