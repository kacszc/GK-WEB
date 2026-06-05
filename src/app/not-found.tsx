import Link from "next/link";
import { Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-8">
        <p className="bg-gradient-to-r from-brand-violet to-brand-blue bg-clip-text text-7xl font-bold tracking-tight text-transparent">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-[-0.5px] text-ink">
          {t("notFoundPage.title")}
        </h1>
        <p className="mt-2 max-w-md text-sm text-ink-2">{t("notFoundPage.desc")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
          >
            {t("notFoundPage.home")}
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface px-5 py-2.5 text-sm font-medium text-ink hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            {t("notFoundPage.search")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
