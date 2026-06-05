import { Header } from "@/components/layout/Header";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";
import { AboutScreen } from "@/components/about/AboutScreen";

export default function Page() {
  return (
    <>
      <Header />
      <AboutScreen />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tAbout", "meta.dAbout");
