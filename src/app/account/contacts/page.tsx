import { ContactsList } from "@/components/account/ContactsList";
import { EmployerOnly } from "@/components/account/EmployerOnly";

export default function Page() {
  return (
    <EmployerOnly>
      <ContactsList />
    </EmployerOnly>
  );
}
