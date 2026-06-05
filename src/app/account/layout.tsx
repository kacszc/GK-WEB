import { SearchTopbar } from "@/components/search/SearchTopbar";
import { Footer } from "@/components/layout/Footer";
import { AccountShell } from "@/components/account/AccountShell";
import { getI18n } from "@/i18n/server";

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
