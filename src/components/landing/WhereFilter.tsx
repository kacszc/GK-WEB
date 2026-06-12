"use client";

import { LocationPicker } from "@/components/search/LocationPicker";
import type { UserLocation } from "@/lib/types";

/**
 * Landing location picker — the SAME component + backend cities as the /search and /jobs filters.
 * No city selected = "Proponowane" (no anchor, no range): clicking Search shows everyone.
 */
export function WhereFilter({
  value,
  onChange,
}: {
  value: UserLocation | null;
  onChange: (v: UserLocation | null) => void;
}) {
  return <LocationPicker value={value} onLocate={onChange} onClear={() => onChange(null)} />;
}
