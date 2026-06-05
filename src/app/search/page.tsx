import { SearchScreen } from "@/components/search/SearchScreen";
import { Footer } from "@/components/layout/Footer";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <>
      <SearchScreen initialQuery={q ?? ""} />
      <Footer />
    </>
  );
}
