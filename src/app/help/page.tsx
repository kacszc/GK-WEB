import { Header } from "@/components/layout/Header";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";
import { HelpScreen } from "@/components/help/HelpScreen";

export default function Page() {
  return (
    <>
      <Header />
      <HelpScreen />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tHelp", "meta.dHelp");
