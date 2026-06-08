import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";
import { pageMetadata } from "@/i18n/metadata";

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}

export const generateMetadata = () => pageMetadata("meta.tForgot");
