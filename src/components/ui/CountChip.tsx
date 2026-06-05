import { cn } from "@/lib/cn";

/**
 * Small count chip: "live" (green, e.g. "38 NOW") or "neutral".
 */
export function CountChip({
  children,
  live = false,
  className,
}: {
  children: React.ReactNode;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none",
        live
          ? "bg-success-chip text-success-chip-text"
          : "bg-pill text-ink-2",
        className,
      )}
    >
      {children}
    </span>
  );
}
