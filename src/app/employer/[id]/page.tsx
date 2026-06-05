import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmployerProfileScreen } from "@/components/employer/EmployerProfileScreen";
import { employersService } from "@/services";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = await employersService.getProfile(id);
  return { title: e?.name ?? "skill.com", description: e?.description };
}

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
