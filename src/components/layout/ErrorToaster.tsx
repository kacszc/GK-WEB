"use client";

import { useEffect } from "react";
import { useToast } from "@/lib/ToastProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { setErrorToastHandler, requestErrorToast } from "@/lib/errorToast";

/** Registers the request-error toast with the React Query caches (429-aware). Renders nothing. */
export function ErrorToaster() {
  const { show } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    setErrorToastHandler((error) => show(requestErrorToast(error, t)));
    return () => setErrorToastHandler(null);
  }, [show, t]);

  return null;
}
