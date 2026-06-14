"use client";

import { MessagesBell } from "@/components/layout/MessagesBell";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/lib/AuthProvider";

/**
 * Messages + notifications shortcuts for the mobile header. Shown only when signed in (the bell
 * components render their icon unconditionally, so they need this gate). Keeps the mobile landing
 * header consistent with the account/search top bars, where these controls are always visible.
 */
export function HeaderMobileAuth() {
  const { user, ready } = useAuth();
  if (!ready || !user) return null;
  return (
    <>
      <MessagesBell />
      <NotificationBell />
    </>
  );
}
