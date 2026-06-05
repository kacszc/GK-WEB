import { Header } from "@/components/layout/Header";
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
