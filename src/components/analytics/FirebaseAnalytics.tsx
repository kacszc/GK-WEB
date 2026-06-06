"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics } from "@/lib/firebase";

/**
 * Mounts Firebase Analytics in the browser and logs a `page_view` event on
 * every route change. Renders nothing. Mounted once in the root layout.
 */
export function FirebaseAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    initAnalytics().then((analytics) => {
      if (cancelled || !analytics) return;
      // Lazy import keeps the analytics SDK out of the server bundle.
      import("firebase/analytics").then(({ logEvent }) => {
        logEvent(analytics, "page_view", {
          page_path: path,
          page_location: typeof window !== "undefined" ? window.location.href : undefined,
          page_title: typeof document !== "undefined" ? document.title : undefined,
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  return null;
}
