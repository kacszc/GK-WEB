import { cn } from "@/lib/cn";

/** skill.com logo — gradient tile + wordmark. */
export function Logo({
  className,
  dark = false,
}: {
  className?: string;
  dark?: boolean; // variant for dark background (white wordmark)
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-soft bg-gradient-to-br from-brand-violet to-brand-blue text-on-dark">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M3 9.5C3 9.5 4 11 7 11C9.5 11 11 9.8 11 8C11 4.5 4 6 4 3.8C4 2.4 5.2 1.5 7 1.5C9.2 1.5 10 3 10 3"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className={cn("text-lg font-bold", dark ? "text-on-dark" : "text-ink")}>
        skill.com
      </span>
    </span>
  );
}
