import { cn } from "@/lib/cn";

/** Loading placeholder (shimmer). */
export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("skeleton block rounded-md", className)} />;
}

/** Panel-shaped loading placeholder matching the bordered card surfaces. */
export function SkeletonCard({ className }: { className?: string }) {
  return <span className={cn("skeleton block rounded-panel", className)} />;
}

/** Dropdown suggestion skeleton row (icon + two lines). */
export function SuggestionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <Skeleton className="h-9 w-9 rounded-tile" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}
