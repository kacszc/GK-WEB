import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getI18n } from "@/i18n/server";
import { I18nProvider } from "@/i18n/I18nProvider";
import { QueryProvider } from "@/lib/QueryProvider";
import { AuthProvider } from "@/lib/AuthProvider";
import { WalletProvider } from "@/lib/WalletProvider";
import { ContactProvider } from "@/lib/ContactProvider";
import { CookieConsentProvider } from "@/lib/CookieConsentProvider";
import { CookieConsent } from "@/components/legal/CookieConsent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"], // latin-ext: PL, cyrillic: UK
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, dict } = await getI18n();

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-page text-ink">
        <I18nProvider locale={locale} dict={dict}>
          <QueryProvider>
            <AuthProvider>
              <WalletProvider>
                <ContactProvider>
                  <CookieConsentProvider>
                    {children}
                    <CookieConsent />
                  </CookieConsentProvider>
                </ContactProvider>
              </WalletProvider>
            </AuthProvider>
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
