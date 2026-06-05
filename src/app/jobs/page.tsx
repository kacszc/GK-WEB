import { JobsScreen } from "@/components/jobs/JobsScreen";
import { Footer } from "@/components/layout/Footer";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <>
      <JobsScreen initialQuery={q ?? ""} />
      <Footer />
    </>
  );
}
