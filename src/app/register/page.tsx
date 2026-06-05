import { AuthScreen } from "@/components/auth/AuthScreen";
import { pageMetadata } from "@/i18n/metadata";

export default function RegisterPage() {
  return <AuthScreen mode="register" />;
}

export const generateMetadata = () => pageMetadata("meta.tRegister");
