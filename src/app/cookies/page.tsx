import { Header } from "@/components/layout/Header";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";
import { CookiePolicyScreen } from "@/components/legal/CookiePolicyScreen";

export default function Page() {
  return (
    <>
      <Header />
      <CookiePolicyScreen />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tCookies");
