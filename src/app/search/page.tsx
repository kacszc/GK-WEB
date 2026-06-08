import { SearchScreen } from "@/components/search/SearchScreen";
import { parseSearchFilters } from "@/components/search/searchParams";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The whole filter set lives in the URL (shareable + restored on reload).
  const { filters, view } = parseSearchFilters(await searchParams);
  return (
    <>
      <SearchScreen initialFilters={filters} initialView={view} />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tSearch");
