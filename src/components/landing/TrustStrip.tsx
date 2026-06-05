import { getI18n } from "@/i18n/server";

export async function TrustStrip() {
  const { t, dict } = await getI18n();

  return (
    <section className="bg-surface">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-8 lg:px-24">
        <p className="text-center text-[13px] font-medium tracking-[0.3px] text-ink-2 sm:text-left">
          {t("trust.using")}{" "}
          <span className="text-ink">{t("trust.employers", { n: "4 200" })}</span> ·{" "}
          <span className="text-ink">{t("trust.specialists", { n: "18 700" })}</span> ·{" "}
          <span className="text-ink">{t("trust.ratings", { n: 92 })}</span>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4 sm:justify-start sm:gap-8">
          {dict.trust.badges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-3 bg-subtle px-3.5 py-2 text-xs font-medium text-ink-key"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
