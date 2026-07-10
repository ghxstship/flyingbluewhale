import { ForgotPasswordForm } from "./ForgotPasswordForm";

import type { Metadata } from "next";
import { getRequestT } from "@/lib/i18n/request";

// E-14: every auth page carries its own title instead of the root default.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("auth.forgotPassword.pageTitle", undefined, "Reset Password") };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
