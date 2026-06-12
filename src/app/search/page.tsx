import { SearchScreen } from "@/components/search/SearchScreen";
import { parseSearchFilters, parseLocation } from "@/components/search/searchParams";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The whole filter set lives in the URL (shareable + restored on reload); lat/lng carry the
  // search-origin city from the landing search (absent → "Proponowane": no anchor, everyone).
  const sp = await searchParams;
  const { filters, view } = parseSearchFilters(sp);
  return (
    <>
      <SearchScreen initialFilters={filters} initialView={view} initialLocation={parseLocation(sp)} />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tSearch");
