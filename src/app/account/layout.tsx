import type { Metadata } from "next";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { Footer } from "@/components/layout/Footer";
import { AccountShell } from "@/components/account/AccountShell";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("meta.tAccount"), robots: { index: false } };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountTopbar />
      <AccountShell>{children}</AccountShell>
      <Footer />
    </>
  );
}
