import { JobDetailPublic } from "@/components/jobs/JobDetailPublic";
import { Footer } from "@/components/layout/Footer";
import { pageMetadata } from "@/i18n/metadata";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <JobDetailPublic id={id} />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tJobs");
