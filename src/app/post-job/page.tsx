import { PostJobScreen } from "@/components/post-job/PostJobScreen";
import { pageMetadata } from "@/i18n/metadata";
import { Footer } from "@/components/layout/Footer";

export default function PostJobPage() {
  return (
    <>
      <PostJobScreen />
      <Footer />
    </>
  );
}

export const generateMetadata = () => pageMetadata("meta.tPostJob");
