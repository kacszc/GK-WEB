"use client";

import { useEffect } from "react";
import { useToast } from "@/lib/ToastProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { setErrorToastHandler } from "@/lib/errorToast";

/** Registers the generic request-error toast with the React Query caches. Renders nothing. */
export function ErrorToaster() {
  const { show } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    setErrorToastHandler(() => show({ title: t("error.title"), body: t("error.body") }));
    return () => setErrorToastHandler(null);
  }, [show, t]);

  return null;
}
