"use client";

import { useI18n } from "@/i18n/I18nProvider";

/** Shown when the service is unavailable (e.g. backend unreachable). Intentionally minimal —
 *  no ETA/progress log, since this also fronts unplanned outages, not just planned windows. */
export function MaintenanceScreen() {
  const { t } = useI18n();

  // fixed inset-0 spans the whole screen incl. notch/home-indicator (viewport-fit=cover), so the
  // dark bg covers the safe areas — there's no header/footer here to paint them.
  return (
    <main className="fixed inset-0 grid place-items-center overflow-y-auto bg-ink px-4 py-16 text-on-dark">
      <div className="w-full max-w-[560px] text-center">
        <span className="mx-auto block h-20 w-20 rounded-full bg-gradient-to-br from-[#ff8a3d] to-[#ff5470]" aria-hidden />
        <p className="mt-6 text-[12px] font-bold uppercase tracking-[1.5px] text-[#ffb067]">{t("maintenance.eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.5px] sm:text-4xl">{t("maintenance.title")}</h1>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-on-dark/70">{t("maintenance.desc")}</p>
      </div>
    </main>
  );
}
