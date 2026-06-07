import { SearchScreen } from "@/components/search/SearchScreen";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; profession?: string; view?: string }>;
}) {
  const { q, profession, view } = await searchParams;
  const initialView =
    view === "map" || view === "mapList" || view === "list" ? view : undefined;
  return (
    <>
      <SearchScreen initialQuery={q ?? ""} initialProfession={profession} initialView={initialView} />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tSearch");
