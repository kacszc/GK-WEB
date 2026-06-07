"use client";

import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { BASE_URL } from "@/lib/api-client";
import { useAuth } from "@/lib/AuthProvider";
import type { Notification } from "@/lib/types";

/** http(s):// → ws(s):// for the SockJS raw-websocket transport endpoint. */
function brokerUrl(): string {
  const base = BASE_URL.replace(/^http/, "ws").replace(/\/$/, "");
  return `${base}/ws/websocket`;
}

/**
 * Subscribe to the signed-in user's personal notification topic over STOMP, so new notifications
 * (messages, applications, expiries…) arrive instantly. No-ops until {@code userId} is known.
 */
export function useNotificationSocket(
  userId: string | null,
  onNotification: (n: Notification) => void,
): void {
  const { getIdToken } = useAuth();

  useEffect(() => {
    if (!userId) return;
    let client: Client | null = null;
    let cancelled = false;

    (async () => {
      const token = await getIdToken();
      if (!token || cancelled) return;
      client = new Client({
        brokerURL: brokerUrl(),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          client?.subscribe(`/topic/users/${userId}/notifications`, (frame) => {
            try {
              onNotification(JSON.parse(frame.body) as Notification);
            } catch {
              /* ignore malformed frames */
            }
          });
        },
        onStompError: () => {},
        onWebSocketError: () => {},
      });
      client.activate();
    })();

    return () => {
      cancelled = true;
      void client?.deactivate();
    };
    // onNotification is a stable callback; userId/token drive (re)subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, getIdToken]);
}
