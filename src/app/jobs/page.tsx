import { JobsScreen } from "@/components/jobs/JobsScreen";
import { parseLocation } from "@/components/search/searchParams";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  // lat/lng carry the search-origin city from the landing (absent → "Proponowane": no anchor).
  return (
    <>
      <JobsScreen
        initialQuery={first(sp.q) ?? ""}
        initialProfession={first(sp.profession)}
        initialLocation={parseLocation(sp)}
      />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tJobs");
