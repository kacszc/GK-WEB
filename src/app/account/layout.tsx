import type { Metadata } from "next";
import { SearchTopbar } from "@/components/search/SearchTopbar";
import { Footer } from "@/components/layout/Footer";
import { AccountShell } from "@/components/account/AccountShell";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("meta.tAccount"), robots: { index: false } };
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <>
      <SearchTopbar category={t("account.navOverview")} />
      <AccountShell>{children}</AccountShell>
      <Footer />
    </>
  );
}
