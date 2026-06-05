import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmployerProfileScreen } from "@/components/employer/EmployerProfileScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <EmployerProfileScreen id={id} />
      <Footer />
    </>
  );
}
