import { cn } from "@/lib/cn";

/** Keyboard key chip (⌘, K, ↵, →). */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-key border border-line-4 bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-key",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
