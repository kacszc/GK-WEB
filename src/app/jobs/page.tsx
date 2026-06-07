import { JobsScreen } from "@/components/jobs/JobsScreen";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; profession?: string }>;
}) {
  const { q, profession } = await searchParams;
  return (
    <>
      <JobsScreen initialQuery={q ?? ""} initialProfession={profession} />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tJobs");
