import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skill.com";

// Public, indexable routes (account/onboarding/auth are excluded — see robots.ts).
const routes = [
  "",
  "/search",
  "/jobs",
  "/post-job",
  "/pricing",
  "/help",
  "/contact",
  "/about",
  "/terms",
  "/privacy",
  "/cookies",
  "/community",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({
    url: `${base}${r}`,
    changeFrequency: "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
