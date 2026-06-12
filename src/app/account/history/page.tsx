import { HistoryList } from "@/components/account/HistoryList";
import { EmployerOnly } from "@/components/account/EmployerOnly";

export default function Page() {
  return (
    <EmployerOnly>
      <HistoryList />
    </EmployerOnly>
  );
}
