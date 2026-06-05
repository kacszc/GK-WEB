import { Header } from "@/components/layout/Header";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";
import { LegalDocPage } from "@/components/legal/LegalDocPage";

export default function Page() {
  return (
    <>
      <Header />
      <LegalDocPage slug="community" />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tCommunity");
