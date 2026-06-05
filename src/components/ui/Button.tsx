import { cn } from "@/lib/cn";

type Variant = "dark" | "white" | "gradient" | "outline";

const variants: Record<Variant, string> = {
  dark: "bg-ink text-on-dark hover:bg-ink/90",
  white: "bg-surface text-ink hover:bg-surface/90",
  gradient:
    "bg-gradient-to-r from-brand-violet to-brand-blue text-on-dark hover:opacity-95",
  outline: "bg-surface text-ink border border-line-4 hover:bg-muted",
};

export function Button({
  variant = "dark",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
