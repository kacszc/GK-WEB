import Link from "next/link";
import { Briefcase, UserPlus, Gauge, ShieldCheck, Building2, ArrowRight } from "lucide-react";
import { getI18n } from "@/i18n/server";

type Step = { title: string; desc: string };
type IconType = React.ComponentType<{ className?: string }>;

/** Static "How it works" page: two step-tracks (employer / specialist) + trust pillars + CTA. */
export async function HowItWorksScreen() {
  const { dict } = await getI18n();
  const hiw = dict.howItWorks;
  const trustIcons: IconType[] = [Gauge, ShieldCheck, Building2];

  return (
    <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-24 pt-12 sm:px-8">
      {/* Hero */}
      <header className="mx-auto max-w-[680px] text-center">
        <h1 className="text-3xl font-bold tracking-[-0.5px] text-ink sm:text-4xl">{hiw.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{hiw.subtitle}</p>
      </header>

      {/* Two tracks */}
      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        <Track icon={Briefcase} title={hiw.employerTitle} steps={hiw.employerSteps} />
        <Track icon={UserPlus} title={hiw.specialistTitle} steps={hiw.specialistSteps} />
      </div>

      {/* Trust pillars */}
      <section className="mt-16 text-center">
        <h2 className="text-2xl font-bold tracking-[-0.5px] text-ink">{hiw.trustTitle}</h2>
        <p className="mx-auto mt-2 max-w-[560px] text-[14px] text-ink-2">{hiw.trustSubtitle}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {hiw.trust.map((it, i) => {
            const Icon = trustIcons[i] ?? Gauge;
            return (
              <div key={it.title} className="rounded-panel border border-line-3 bg-surface p-6 text-left">
                <span className="grid h-11 w-11 place-items-center rounded-tile bg-pill text-brand-violet">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{it.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{it.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-card bg-gradient-to-r from-brand-violet to-brand-blue px-6 py-14 text-center text-on-dark sm:px-10">
        <h2 className="text-2xl font-bold tracking-[-0.5px]">{hiw.ctaTitle}</h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/post-job"
            className="inline-flex items-center justify-center gap-1.5 rounded-tile bg-on-dark px-5 py-3 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5"
          >
            {hiw.ctaEmployer}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-1.5 rounded-tile border border-on-dark/40 px-5 py-3 text-sm font-bold text-on-dark transition-colors hover:bg-on-dark/10"
          >
            {hiw.ctaSpecialist}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Track({ icon: Icon, title, steps }: { icon: IconType; title: string; steps: Step[] }) {
  return (
    <div className="rounded-panel border border-line-3 bg-surface p-6 sm:p-7">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-tile bg-pill text-brand-violet">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
      </div>
      <ol className="flex flex-col gap-5">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-4">
            {/* Connector line between the numbered nodes (timeline / flow). */}
            {i < steps.length - 1 && (
              <span className="absolute left-4 top-9 h-[calc(100%-12px)] w-px -translate-x-1/2 bg-line-2" aria-hidden />
            )}
            <span className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-bold text-on-dark">
              {i + 1}
            </span>
            <div className="pb-0.5">
              <h3 className="text-[15px] font-semibold text-ink">{s.title}</h3>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
