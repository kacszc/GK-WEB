import { AuthScreen } from "@/components/auth/AuthScreen";
import { pageMetadata } from "@/i18n/metadata";

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}

export const generateMetadata = () => pageMetadata("meta.tLogin");
