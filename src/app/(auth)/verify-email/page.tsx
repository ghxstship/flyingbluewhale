import { VerifyEmailScreen } from "./VerifyEmailScreen";

/**
 * Landing page shown to a user right after signup when email confirmation
 * is required. Supabase's signUp returns a null session in that case (the
 * user can't do anything until they click the confirmation link).
 *
 * The email query param is informational only — used to personalize the
 * copy and preseed the resend action. It's user-supplied so we don't treat
 * it as authoritative; the actual resend runs under whatever session state
 * exists (or none).
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <VerifyEmailScreen email={email} />;
}
