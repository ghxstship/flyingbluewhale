import { ResetPasswordForm } from "./ResetPasswordForm";

import type { Metadata } from "next";
import { getRequestT } from "@/lib/i18n/request";

// E-14: every auth page carries its own title instead of the root default.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("auth.resetPassword.pageTitle", undefined, "Set a New Password") };
}

/**
 * User lands here after Supabase verifies the password-reset token from the
 * email. The verification flow goes:
 *
 *   1. User clicks reset link → Supabase /auth/v1/verify
 *   2. Supabase sets a recovery session cookie, redirects to our
 *      /auth/callback?next=/reset-password
 *   3. /auth/callback exchanges the code + forwards here
 *   4. The form below updates the password via supabase.auth.updateUser
 *      which reads the recovery session from the cookie
 */
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
