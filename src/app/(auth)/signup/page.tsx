import { SignupForm } from "./SignupForm";

import type { Metadata } from "next";
import { getRequestT } from "@/lib/i18n/request";

// E-14: every auth page carries its own title instead of the root default.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("auth.signup.pageTitle", undefined, "Create Account") };
}

const PLANS = ["free", "crew", "production", "festival"] as const;
export type PlanIntent = (typeof PLANS)[number];

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const sp = await searchParams;
  // E-17: `?plan=` arrives from the pricing tier CTAs and is carried through
  // signup into org creation as recorded intent (no billing is wired here —
  // every workspace still starts on the free Access tier).
  const plan = PLANS.includes(sp.plan as PlanIntent) ? (sp.plan as PlanIntent) : undefined;
  return <SignupForm plan={plan} />;
}
