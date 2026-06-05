import { WorkerOnboarding } from "@/components/onboarding/WorkerOnboarding";

export const metadata = { robots: { index: false } };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; email?: string }>;
}) {
  const { name, email } = await searchParams;
  return <WorkerOnboarding initialName={name ?? ""} initialEmail={email ?? ""} />;
}
