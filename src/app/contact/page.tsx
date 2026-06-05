import { Header } from "@/components/layout/Header";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";
import { ContactScreen } from "@/components/contact/ContactScreen";

export default function Page() {
  return (
    <>
      <Header />
      <ContactScreen />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tContact", "meta.dContact");
