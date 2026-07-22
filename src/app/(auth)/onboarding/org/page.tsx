import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";
import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingOrgForm } from "./OnboardingOrgForm";
import { isCompvssChannel, ORG_CREATE_CHANNEL_MESSAGE } from "./channel";

type Search = { name?: string };

/**
 * Join-only screen for COMPVSS-channel arrivals (plan §10: organizations are
 * born in LEG3ND on the web; COMPVSS is login/join-only). No create form is
 * rendered — the visitor can sign in, accept an invite from their email, join
 * with an access code inside the COMPVSS app, or follow the outbound link to
 * the LEG3ND web onboarding to create an organization.
 */
async function JoinOnlyScreen() {
  const { t } = await getRequestT();
  return (
    <AuthShell
      title={t("auth.onboarding.joinOnly.title", undefined, "Sign in or join your organization")}
      subtitle={t("auth.onboarding.joinOnly.subtitle", undefined, ORG_CREATE_CHANNEL_MESSAGE)}
      footer={
        <a
          href={urlFor("legend", "/start")}
          className="text-[var(--p-accent)] underline underline-offset-4"
        >
          {t("auth.onboarding.joinOnly.legendCta", undefined, "Create your organization in LEG3ND")}
        </a>
      }
    >
      <div className="space-y-4">
        <Link href="/login" className="ps-btn ps-btn--cta w-full justify-center">
          {t("auth.onboarding.joinOnly.signIn", undefined, "Sign in")}
        </Link>
        <p className="text-sm text-[var(--p-text-2)]">
          {t(
            "auth.onboarding.joinOnly.invite",
            undefined,
            "Have an invite? Open the link from your email to accept it, or enter your access code on the Join Your Org step in the COMPVSS app.",
          )}
        </p>
        <a href={urlFor("mobile", "/")} className="ps-btn w-full justify-center">
          {t("auth.onboarding.joinOnly.openCompvss", undefined, "Open COMPVSS")}
        </a>
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "auth.onboarding.joinOnly.desktopHint",
            undefined,
            "Creating an organization requires a desktop browser.",
          )}
        </p>
      </div>
    </AuthShell>
  );
}

export default async function OnboardingOrgPage({ searchParams }: { searchParams: Promise<Search> }) {
  // Channel guard first (plan §10, decision 4): reached from the COMPVSS
  // shell, this page is join-only — even before the session gate, so an
  // anonymous field visitor gets the guidance instead of a login bounce.
  if (await isCompvssChannel()) {
    return <JoinOnlyScreen />;
  }

  if (!hasSupabase) redirect("/login");

  // Server-side gate. Anon users get bounced to /login with this as the
  // post-auth `next`. Users who *already* have a real org skip the screen
  // and go straight to their shell.
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/onboarding/org");
  }
  if (session.orgId && session.persona !== "guest") {
    redirect("/auth/resolve");
  }

  // Surface the email so the user knows which account they're naming an org for.
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email ?? "";

  // Pull the name suggestion from either ?name= or the user's signup metadata
  // (Supabase carries it through email confirmation).
  const params = await searchParams;
  const fromQuery = params.name?.trim() ?? "";
  const fromMetadata = (userData.user?.user_metadata?.pending_org_name as string | undefined)?.trim() ?? "";
  const initialName = fromQuery || fromMetadata || "";

  return <OnboardingOrgForm initialName={initialName} email={email} />;
}
