import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type CardTheme = "light" | "gradient" | "dark";

/** Presentational landing action card (shared by the server section + the role-aware primary card). */
export function ActionCard({
  theme,
  icon,
  title,
  desc,
  cta,
  href,
}: {
  theme: CardTheme;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href?: string;
}) {
  const container = cn(
    "flex flex-col gap-5 rounded-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
    theme === "light" && "border border-line bg-surface",
    theme === "gradient" && "bg-map-card",
    theme === "dark" && "bg-ink",
  );
  const titleColor = theme === "light" ? "text-ink" : "text-on-dark";
  const descColor = theme === "light" ? "text-ink-2" : "text-on-dark-2";
  const iconTile = cn(
    "grid h-12 w-12 place-items-center rounded-tile",
    theme === "light" ? "bg-pill" : "bg-white/16",
  );

  return (
    <div className={container}>
      <span className={iconTile}>{icon}</span>
      <div className="space-y-2">
        <h3 className={cn("text-[22px] font-bold leading-[1.2] tracking-[-0.5px]", titleColor)}>
          {title}
        </h3>
        <p className={cn("text-[13px] leading-[1.5]", descColor)}>{desc}</p>
      </div>
      {href ? (
        <Link
          href={href}
          className={cn(
            "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-cta px-4 py-3 text-[13px] font-bold transition-colors",
            theme === "light" ? "bg-ink text-on-dark hover:bg-ink/90" : "bg-surface text-ink hover:bg-surface/90",
          )}
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <Button
          variant={theme === "light" ? "dark" : "white"}
          className="mt-auto w-full rounded-cta px-4 py-3 text-[13px]"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
