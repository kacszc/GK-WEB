"use client";

import { useQuery } from "@tanstack/react-query";
import { supportService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function MaintenanceScreen() {
  const { t } = useI18n();
  const { data: status } = useQuery({ queryKey: ["maintenance"], queryFn: supportService.getMaintenanceStatus });

  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4 py-16 text-on-dark">
      <div className="w-full max-w-[560px] text-center">
        <span className="mx-auto block h-20 w-20 rounded-full bg-gradient-to-br from-[#ff8a3d] to-[#ff5470]" aria-hidden />
        <p className="mt-6 text-[12px] font-bold uppercase tracking-[1.5px] text-[#ffb067]">{t("maintenance.eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.5px] sm:text-4xl">{t("maintenance.title")}</h1>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-on-dark/70">{t("maintenance.desc")}</p>

        {status && (
          <>
            <div className="mt-8 grid grid-cols-3 divide-x divide-on-dark/10 rounded-panel bg-on-dark/5 p-4 text-left">
              <Stat label={t("maintenance.etaLabel")} value={status.etaTime} />
              <Stat label={t("maintenance.remainingLabel")} value={status.remaining} className="pl-4 text-success" />
              <Stat label={t("maintenance.statusLabel")} value={status.state} className="pl-4" dot />
            </div>

            <div className="mt-4 rounded-panel bg-on-dark/5 p-5 text-left">
              <p className="text-[11px] font-bold uppercase tracking-[1px] text-brand-violet">{t("maintenance.logLabel")}</p>
              <ul className="mt-3 space-y-2.5">
                {status.log.map((l, i) => (
                  <li key={i} className="flex items-center gap-3 text-[13px]">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", l.done ? "bg-success" : "bg-[#e0a400]")} />
                    <span className="w-12 shrink-0 text-on-dark/50">{l.time}</span>
                    <span className="text-on-dark/85">{l.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <a
          href="https://status.skill.com"
          className="mt-6 inline-flex items-center rounded-tile border border-on-dark/20 px-5 py-2.5 text-sm font-medium text-on-dark hover:bg-on-dark/10"
        >
          {t("maintenance.statusButton")}
        </a>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  className,
  dot = false,
}: {
  label: string;
  value: string;
  className?: string;
  dot?: boolean;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-on-dark/45">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">
        {dot && <span className="h-2 w-2 rounded-full bg-[#e0a400]" />}
        {value}
      </p>
    </div>
  );
}
