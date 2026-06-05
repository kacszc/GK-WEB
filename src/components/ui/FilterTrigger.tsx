import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/** Pill-style filter trigger (When/Where) — used inside Popover. */
export function FilterTrigger({
  icon,
  label,
  value,
  open,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  open: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 rounded-tile px-3.5 py-3 transition-colors",
        open ? "bg-pill ring-2 ring-ink/10" : "bg-pill hover:bg-line-2",
      )}
    >
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-semibold text-ink-3">{label}</span>
        <span className="block text-[13px] font-bold text-ink">{value}</span>
      </span>
      <ChevronDown
        className={cn("h-3.5 w-3.5 text-ink-3 transition-transform", open && "rotate-180")}
      />
    </span>
  );
}
