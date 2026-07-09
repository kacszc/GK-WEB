import { Utensils, PartyPopper, ConciergeBell, Zap, Hammer, Truck, Sparkles, Package, HeartHandshake, type LucideIcon } from "lucide-react";
import { avatarColors, initials } from "@/lib/avatar";
import { cn } from "@/lib/cn";

/** Industry (branża) code → icon for the themed avatar placeholder. Codes = catalog.industry. */
const industryIcons: Record<string, LucideIcon> = {
  gastronomy: Utensils,
  events: PartyPopper,
  hospitality: ConciergeBell,
  electrical: Zap,
  construction: Hammer,
  transport: Truck,
  cleaning: Sparkles,
  warehouse: Package,
  care: HeartHandshake,
};

/**
 * Avatar placeholder (no photo upload yet): colored circle with either an
 * industry-themed icon (when the industry code is known) or the name initials.
 */
export function Avatar({
  name,
  index = 0,
  size = 36,
  industry,
  className,
}: {
  name: string;
  index?: number;
  size?: number;
  /** Primary branża code (catalog.industry) — renders a themed icon instead of initials. */
  industry?: string;
  className?: string;
}) {
  const color = avatarColors[index % avatarColors.length];
  const Icon = industry ? industryIcons[industry] : undefined;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink/80",
        className,
      )}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {Icon ? <Icon style={{ width: size * 0.5, height: size * 0.5 }} /> : initials(name)}
    </span>
  );
}
