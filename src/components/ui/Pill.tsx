import { cn } from "@/lib/cn";

type As = "button" | "a" | "div";

type PillProps = {
  as?: As;
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
};

/**
 * Pill — base rounded-full element (location, header CTAs, chips).
 * White with a border by default; pass colors via className.
 */
export function Pill({ as = "div", href, className, children, onClick, style }: PillProps) {
  const classes = cn(
    "inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-colors",
    className,
  );

  if (as === "a") {
    return (
      <a href={href} className={classes} onClick={onClick} style={style}>
        {children}
      </a>
    );
  }
  if (as === "button") {
    return (
      <button type="button" className={cn(classes, "cursor-pointer")} onClick={onClick} style={style}>
        {children}
      </button>
    );
  }
  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
