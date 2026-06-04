import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { OnboardingOrgForm } from "./OnboardingOrgForm";

type Search = { name?: string };

export default async function OnboardingOrgPage({ searchParams }: { searchParams: Promise<Search> }) {
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
