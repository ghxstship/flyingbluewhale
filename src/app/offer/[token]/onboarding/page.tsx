import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { getOfferLetterByToken } from "@/lib/offer-letters/queries";
import { listOnboardingSteps, type OnboardingStep } from "@/lib/db/onboarding";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

const STATE_VARIANT: Record<OnboardingStep["step_state"], "muted" | "warning" | "success" | "error"> = {
  pending: "muted",
  in_progress: "warning",
  done: "success",
  waived: "muted",
  blocked: "error",
};
function stateLabel(t: Translator, state: OnboardingStep["step_state"]): string {
  switch (state) {
    case "pending":
      return t("legal.offerOnboarding.stateNotStarted", undefined, "Not started");
    case "in_progress":
      return t("legal.offerOnboarding.stateInProgress", undefined, "In progress");
    case "done":
      return t("legal.offerOnboarding.stateDone", undefined, "Done");
    case "waived":
      return t("legal.offerOnboarding.stateWaived", undefined, "Waived");
    case "blocked":
      return t("legal.offerOnboarding.stateBlocked", undefined, "Blocked");
  }
}

export default async function OnboardingPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();
  const { t } = await getRequestT();
  const c = await cookies();
  const code = c.get(`offer_${token}`)?.value;
  if (!code) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">{t("legal.offerOnboarding.title", undefined, "Onboarding")}</h1>
        <p>
          {t(
            "legal.offerOnboarding.lockedPrefix",
            undefined,
            "Open your engagement letter first to unlock onboarding —",
          )}{" "}
          <Link href={`/offer/${token}`} className="underline">
            {t("legal.offerOnboarding.returnToLetter", undefined, "return to letter")}
          </Link>
          .
        </p>
      </div>
    );
  }
  const letter = await getOfferLetterByToken(token, code);
  if (!letter) notFound();

  const steps = await listOnboardingSteps(letter.id);
  const total = steps.length;
  const done = steps.filter((s) => s.step_state === "done" || s.step_state === "waived").length;
  const cpOpen = steps.filter((s) => s.critical_path && s.step_state !== "done" && s.step_state !== "waived").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between border-b border-(--p-border) pb-4">
        <div>
          <div className="text-xs tracking-widest text-(--p-text-2) uppercase">
            {t("legal.offerOnboarding.eyebrow", undefined, "Onboarding")}
          </div>
          <h1 className="text-2xl font-semibold">
            {t(
              "legal.offerOnboarding.welcome",
              { name: letter.recipient_name.split(" ")[0]! },
              `Welcome, ${letter.recipient_name.split(" ")[0]}`,
            )}
          </h1>
          <p className="mt-1 text-sm text-(--p-text-2)">
            {letter.project_name} · {letter.role_title}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-(--p-text-2) uppercase">
            {t("legal.offerOnboarding.progress", undefined, "Progress")}
          </div>
          <div className="font-mono text-3xl">
            {done}/{total}
          </div>
          <div className="text-xs text-(--p-text-2)">{pct}%</div>
        </div>
      </header>

      {cpOpen > 0 ? (
        <div className="border-s-warning bg-warning-soft border-s-4 p-4">
          <p className="text-sm font-medium">
            {cpOpen === 1
              ? t("legal.offerOnboarding.criticalOpenOne", { count: cpOpen }, `${cpOpen} critical-path step open`)
              : t("legal.offerOnboarding.criticalOpenOther", { count: cpOpen }, `${cpOpen} critical-path steps open`)}
          </p>
          <p className="text-xs text-(--p-text-2)">
            {t(
              "legal.offerOnboarding.criticalBody",
              undefined,
              "Critical-path steps gate your credentials and first-call. Items marked ★ below.",
            )}
          </p>
        </div>
      ) : null}

      <ol className="space-y-2">
        {steps.map((s) => (
          <li key={s.id} className="surface flex flex-col gap-1 p-4">
            <div className="flex items-center gap-2">
              {s.critical_path ? <span className="font-bold text-[var(--p-danger)]">★</span> : null}
              <span className="font-medium">{s.title}</span>
              <Badge variant={STATE_VARIANT[s.step_state]}>{stateLabel(t, s.step_state)}</Badge>
            </div>
            {s.description ? <p className="text-sm text-(--p-text-2)">{s.description}</p> : null}
            <div className="mt-1 flex gap-3 text-xs text-(--p-text-2)">
              {s.due_at ? (
                <span>
                  {t(
                    "legal.offerOnboarding.due",
                    { date: formatDate(s.due_at, "medium") },
                    `Due ${formatDate(s.due_at, "medium")}`,
                  )}
                </span>
              ) : null}
              {s.completed_at ? (
                <span>
                  {t(
                    "legal.offerOnboarding.completed",
                    { date: formatDate(s.completed_at, "medium") },
                    `· Completed ${formatDate(s.completed_at, "medium")}`,
                  )}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="text-xs text-(--p-text-2)">
        <Link href={`/offer/${token}`} className="underline">
          {t("legal.offerOnboarding.backToLetter", undefined, "← Back to engagement letter")}
        </Link>
      </div>
    </div>
  );
}
