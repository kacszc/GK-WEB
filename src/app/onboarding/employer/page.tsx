import { EmployerOnboarding } from "@/components/onboarding/EmployerOnboarding";

export const metadata = { robots: { index: false } };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <EmployerOnboarding initialEmail={email ?? ""} />;
}
