import { Header } from "@/components/layout/Header";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";
import { PricingScreen } from "@/components/tokens/PricingScreen";

export default function CennikPage() {
  return (
    <>
      <Header />
      <PricingScreen />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tPricing", "meta.dPricing");
