import { avatarColors, initials } from "@/lib/avatar";
import { cn } from "@/lib/cn";

/** Avatar placeholder: colored circle with initials (deterministic color). */
export function Avatar({
  name,
  index = 0,
  size = 36,
  className,
}: {
  name: string;
  index?: number;
  size?: number;
  className?: string;
}) {
  const color = avatarColors[index % avatarColors.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink/80",
        className,
      )}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}
