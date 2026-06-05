import { SpecialistProfileScreen } from "@/components/profile/SpecialistProfileScreen";
import { Footer } from "@/components/layout/Footer";

export default async function SpecialistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <SpecialistProfileScreen id={id} />
      <Footer />
    </>
  );
}
