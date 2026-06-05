import { Header } from "@/components/layout/Header";
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
