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
  const md = Number(first(sp.maxDistanceKm));
  // lat/lng (+ maxDistanceKm) carry the search-origin city/radius from the landing
  // (absent → "Proponowane": no anchor, no cap).
  return (
    <>
      <JobsScreen
        initialQuery={first(sp.q) ?? ""}
        initialProfession={first(sp.profession)}
        initialLocation={parseLocation(sp)}
        initialMaxDistanceKm={Number.isFinite(md) ? md : undefined}
        initialFromDate={first(sp.from)}
        initialToDate={first(sp.to)}
      />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tJobs");
