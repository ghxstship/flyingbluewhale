import { LoginForm } from "./LoginForm";

import type { Metadata } from "next";
import { getRequestT } from "@/lib/i18n/request";

// E-14: every auth page carries its own title instead of the root default.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("auth.login.pageTitle", undefined, "Sign In") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redirect?: string }>;
}) {
  const sp = await searchParams;
  // Deep links through auth carry their destination as ?next= (legacy
  // callers used ?redirect=). Validated again server-side in loginAction
  // and /auth/resolve — this is just plumbing it into the form.
  const next = sp.next ?? sp.redirect ?? null;
  return <LoginForm next={next} />;
}
