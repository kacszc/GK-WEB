"use client";

import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { BASE_URL } from "@/lib/api-client";
import { useAuth } from "@/lib/AuthProvider";
import { toChatMessage, type MessageView } from "@/services/messages.service";
import type { ChatMessage } from "@/lib/types";

/** http(s):// → ws(s):// for the SockJS raw-websocket transport endpoint. */
function brokerUrl(): string {
  const base = BASE_URL.replace(/^http/, "ws").replace(/\/$/, "");
  return `${base}/ws/websocket`;
}

/**
 * Subscribe to live messages for a single chat thread over STOMP.
 *
 * Connects a `@stomp/stompjs` Client to the backend's SockJS raw-websocket
 * transport, authenticates with the Firebase Bearer token, and subscribes to
 * `/topic/threads/{threadId}`. Each received {@link MessageView} is mapped to
 * the UI's {@link ChatMessage} and handed to `onMessage`. The client is
 * deactivated on unmount or when the thread changes.
 *
 * Outbound sends go through the REST API (POST /api/messages), not STOMP.
 * No-ops when signed out / no thread (mock mode keeps working without live).
 */
export function useThreadSocket(
  threadId: string | null,
  onMessage: (m: ChatMessage) => void,
): void {
  const { getIdToken } = useAuth();

  useEffect(() => {
    if (!threadId) return;
    let client: Client | null = null;
    let cancelled = false;

    (async () => {
      const token = await getIdToken();
      // No token → not signed in / Firebase unavailable: stay on mock mode.
      if (!token || cancelled) return;

      client = new Client({
        brokerURL: brokerUrl(),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          client?.subscribe(`/topic/threads/${threadId}`, (frame) => {
            try {
              const view = JSON.parse(frame.body) as MessageView;
              onMessage(toChatMessage(view));
            } catch {
              // Ignore malformed frames.
            }
          });
        },
        // Swallow STOMP/socket errors — the thread still works over REST.
        onStompError: () => {},
        onWebSocketError: () => {},
      });
      client.activate();
    })();

    return () => {
      cancelled = true;
      void client?.deactivate();
    };
    // `onMessage` is intentionally excluded; callers pass a stable callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, getIdToken]);
}
