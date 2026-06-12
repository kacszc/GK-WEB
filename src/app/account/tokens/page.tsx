import { WalletScreen } from "@/components/account/WalletScreen";
import { EmployerOnly } from "@/components/account/EmployerOnly";

export default function Page() {
  return (
    <EmployerOnly>
      <WalletScreen />
    </EmployerOnly>
  );
}
