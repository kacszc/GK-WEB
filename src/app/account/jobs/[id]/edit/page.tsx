import { PostJobScreen } from "@/components/post-job/PostJobScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostJobScreen jobId={id} />;
}
