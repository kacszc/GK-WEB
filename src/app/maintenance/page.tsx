import { MaintenanceScreen } from "@/components/legal/MaintenanceScreen";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata() {
  const meta = await pageMetadata("meta.tMaintenance");
  return { ...meta, robots: { index: false } };
}

export default function Page() {
  return <MaintenanceScreen />;
}
