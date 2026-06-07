/* global importScripts, firebase, self */
// Firebase Cloud Messaging service worker — handles web-push while the app/tab is closed.
// Uses the compat SDK (service workers can't import the modular ESM build).
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Public Firebase web config (same values as src/lib/firebase.ts; not secret).
firebase.initializeApp({
  apiKey: "AIzaSyAnmI30PMVu9brfnAxA7uyiuPj5dHzwiJw",
  authDomain: "ugkr-c5184.firebaseapp.com",
  projectId: "ugkr-c5184",
  storageBucket: "ugkr-c5184.firebasestorage.app",
  messagingSenderId: "954537640375",
  appId: "1:954537640375:web:14b2489bf35b3466336832",
});

const messaging = firebase.messaging();

// Background messages → show an OS notification; click focuses/opens the linked page.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "skill.com";
  const body = payload.notification?.body || payload.data?.body || "";
  const link = payload.fcmOptions?.link || payload.data?.link || "/account/notifications";
  self.registration.showNotification(title, {
    body,
    icon: "/icon.png",
    data: { link },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) {
          c.navigate(link);
          return c.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
