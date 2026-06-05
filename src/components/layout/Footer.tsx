import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getI18n } from "@/i18n/server";

// Link targets keyed by column/link position — identical order across locales.
const columnHrefs: Record<string, string> = {
  "0:1": "/cennik", // PLATFORMA · Cennik
  "1:0": "/post-job", // DLA PRACODAWCÓW · Dodaj zlecenie
  "1:1": "/search", // DLA PRACODAWCÓW · Szukaj specjalisty
  "2:0": "/register", // DLA SPECJALISTÓW · Załóż profil
  "3:0": "/o-nas", // FIRMA · O nas
  "3:1": "/kontakt", // FIRMA · Kontakt
  "3:4": "/pomoc", // FIRMA · Pomoc
};
const legalHrefs = ["/regulamin", "/polityka-prywatnosci", "/polityka-cookies", "/polityka-prywatnosci"];

export async function Footer() {
  const { t, dict } = await getI18n();

  return (
    <footer className="mt-auto bg-ink text-on-dark">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-12 sm:px-8 lg:px-24">
        {/* Top */}
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          <div className="lg:w-[280px]">
            <Logo dark />
            <p className="mt-4 text-sm leading-6 text-on-dark-4">{t("footer.description")}</p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
            {dict.footer.columns.map((col, ci) => (
              <div key={col.title}>
                <h3 className="text-[13px] font-semibold tracking-[1px] text-on-dark">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link, li) => (
                    <li key={link}>
                      <Link
                        href={columnHrefs[`${ci}:${li}`] ?? "#"}
                        className="text-[13px] text-on-dark-4 transition-colors hover:text-on-dark"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-8 border-line-dark" />

        {/* Bottom */}
        <div className="flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-on-dark-5">{t("footer.copyright")}</p>
          <ul className="flex flex-wrap gap-4">
            {dict.footer.legal.map((link, i) => (
              <li key={link}>
                <Link href={legalHrefs[i] ?? "#"} className="text-on-dark-6 hover:text-on-dark">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
