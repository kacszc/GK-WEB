import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { AdminShell } from "@/components/admin/AdminShell";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.title"), robots: { index: false } };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminShell>{children}</AdminShell>
      <Footer />
    </>
  );
}
