import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Direct magic-link landing. Supabase normally bounces magic-link clicks
 * through /auth/callback?code=... — this route is a fallback for older
 * email templates that point straight here with the token in the URL.
 *
 * The token is exchanged via verifyOtp(type: 'magiclink'), which sets the
 * session cookie. On success we forward to /auth/resolve so the persona
 * dispatcher routes the user to their correct shell.
 */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "magiclink",
  });

  if (!error) {
    redirect("/auth/resolve");
  }

  const { t } = await getRequestT();
  return (
    <AuthShell
      title={t("auth.magicLink.expiredTitle", undefined, "Link expired or invalid")}
      subtitle={t("auth.magicLink.expiredSubtitle", undefined, "We couldn't sign you in with that link.")}
    >
      <Alert kind="error">{error.message}</Alert>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        {t(
          "auth.magicLink.expiredBody",
          undefined,
          "Magic links expire after a short window. Request a fresh one and try again.",
        )}
      </p>
      <Link href="/magic-link" className="btn btn-primary mt-4 w-full">
        {t("auth.magicLink.sendAnother", undefined, "Send another magic link")}
      </Link>
    </AuthShell>
  );
}
