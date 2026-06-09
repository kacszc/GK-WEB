import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HowItWorksScreen } from "@/components/howitworks/HowItWorksScreen";
import { pageMetadata } from "@/i18n/metadata";

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <HowItWorksScreen />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tHowItWorks");
