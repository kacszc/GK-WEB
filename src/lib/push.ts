import { apiPost } from "@/lib/api-client";
import { firebaseApp, firebaseVapidKey } from "@/lib/firebase";

/**
 * Enable Web Push for the signed-in user: request permission, register the FCM service worker,
 * obtain a token and register it with the backend (POST /api/me/devices). Best-effort and idempotent
 * — safe to call on every sign-in. No-ops on the server, unsupported browsers, or denied permission.
 * In-app live notifications (STOMP) work without this; FCM only adds OS-level push when the tab is closed.
 */
export async function enablePush(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) return;
  try {
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return;

    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(getMessaging(firebaseApp), {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return;

    await apiPost("/api/me/devices", { token, platform: "web" });
  } catch {
    // Push is best-effort — never break the app if it fails.
  }
}
