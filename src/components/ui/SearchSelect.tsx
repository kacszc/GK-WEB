"use client";

import { useState } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string };

/**
 * Searchable select (combobox): a text-field-like trigger that opens a list with a search box on
 * top; typing filters the options. Generic — reuse for city, currency, etc.
 * Pass `onClear` to make the selection optional: a ✕ appears on the trigger when a value is set.
 */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  triggerClassName,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  triggerClassName?: string;
  /** Renders a clear (✕) affordance on the trigger when a value is selected. */
  onClear?: () => void;
}) {
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  return (
    <Popover
      align="start"
      triggerClassName="w-full"
      panelClassName="w-full min-w-[200px] p-1.5"
      trigger={({ open }) => (
        <span
          className={cn(
            "flex w-full items-center gap-2 rounded-tile border bg-surface px-3 py-2.5 text-sm transition-colors",
            open ? "border-ink" : "border-line-2",
            triggerClassName,
          )}
        >
          <span className={cn("flex-1 truncate text-left", selected ? "text-ink" : "text-ink-4")}>
            {selected?.label ?? placeholder ?? ""}
          </span>
          {onClear && selected ? (
            // Not a <button> — the whole trigger already is one (invalid nesting); stop the
            // propagation so clearing doesn't toggle the dropdown.
            <span
              role="button"
              aria-label="Clear"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onClear();
                }
              }}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-ink-4 transition-colors hover:bg-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : (
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-4 transition-transform", open && "rotate-180")} />
          )}
        </span>
      )}
    >
      {({ close }) => (
        <div className="w-full">
          <div className="mb-1.5 flex items-center gap-2 rounded-tile border border-line-2 px-2.5">
            <Search className="h-4 w-4 shrink-0 text-ink-4" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-4"
            />
          </div>
          <ul className="max-h-[240px] overflow-y-auto">
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setQuery("");
                    close();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-tile px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                    o.value === value ? "font-semibold text-ink" : "text-ink-2",
                  )}
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.value === value && <Check className="h-3.5 w-3.5 shrink-0 text-brand-violet" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Popover>
  );
}
