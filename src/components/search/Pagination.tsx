"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Compact pagination: first, current neighbours, last, with prev/next. */
export function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  if (pageCount <= 1) return null;

  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);

  return (
    <nav className="flex items-center justify-center gap-1.5">
      <PageBtn disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="prev">
        <ChevronLeft className="h-4 w-4" />
      </PageBtn>
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - list[i - 1] > 1 && <span className="px-1 text-ink-4">…</span>}
          <PageBtn active={p === page} onClick={() => onPage(p)}>
            {p}
          </PageBtn>
        </span>
      ))}
      <PageBtn disabled={page === pageCount} onClick={() => onPage(page + 1)} aria-label="next">
        <ChevronRight className="h-4 w-4" />
      </PageBtn>
    </nav>
  );
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-9 min-w-9 place-items-center rounded-tile px-2 text-[13px] font-medium transition-colors",
        active ? "bg-ink text-on-dark" : "text-ink-2 hover:bg-muted",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
        !disabled && "cursor-pointer",
      )}
      {...props}
    >
      {children}
    </button>
  );
}
