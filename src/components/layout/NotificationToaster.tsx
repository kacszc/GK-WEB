"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { notificationsService } from "@/services";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import { useNotificationSocket } from "@/lib/useNotificationSocket";
import type { Notification } from "@/lib/types";

/**
 * Surfaces new notifications as in-app snackbars. Primary path is the live STOMP push on the user's
 * personal topic (instant); a slow poll is kept as a fallback when the socket is unavailable.
 * A shared "seen" set de-dupes the two so a notification toasts at most once.
 */
export function NotificationToaster() {
  const { user } = useAuth();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const seen = useRef<Set<string>>(new Set());
  const seeded = useRef(false);

  // Resolve the backend user id (needed for the personal WS topic).
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<{ id: string }>("/api/me"),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const surface = useCallback(
    (n: Notification, live: boolean) => {
      if (seen.current.has(n.id)) return;
      seen.current.add(n.id);
      if (!n.read) show({ title: n.title, body: n.body ?? undefined, href: n.link ?? undefined });
      if (live) queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    [show, queryClient],
  );

  // Instant: live push on the personal topic.
  useNotificationSocket(me?.id ?? null, (n) => surface(n, true));

  // Fallback: slow poll, diffed against the seen set (first load only seeds, no toast spam).
  const { data: items = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsService.list(),
    enabled: !!user,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!seeded.current) {
      items.forEach((n) => seen.current.add(n.id));
      seeded.current = true;
      return;
    }
    for (const n of items) surface(n, false);
  }, [items, surface]);

  return null;
}
