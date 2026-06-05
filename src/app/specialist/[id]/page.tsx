import type { Metadata } from "next";
import { SpecialistProfileScreen } from "@/components/profile/SpecialistProfileScreen";
import { Footer } from "@/components/layout/Footer";
import { specialistsService } from "@/services";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = await specialistsService.getById(id);
  return { title: s?.name ?? "skill.com", description: s?.bio };
}

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
