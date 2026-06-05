import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skill.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account/", "/onboarding/", "/login", "/register", "/maintenance"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
