import { MessagesScreen } from "@/components/account/MessagesScreen";

// Deep-link form (e.g. right after starting a conversation). MessagesScreen preselects this
// thread and then strips the UUID from the URL so it never lingers in the address bar.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MessagesScreen initialThreadId={id} />;
}
