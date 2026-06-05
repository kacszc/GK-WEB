import { ChatView } from "@/components/account/ChatView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatView id={id} />;
}
