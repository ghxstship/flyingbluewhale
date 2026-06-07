import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOnboardingSteps, type OnboardingStep } from "@/lib/db/onboarding";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const STATE_VARIANT: Record<OnboardingStep["step_state"], "muted" | "warning" | "success" | "error"> = {
  pending: "muted",
  in_progress: "warning",
  done: "success",
  waived: "muted",
  blocked: "error",
};

export default async function LetterOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  await requireSession();
  const { t } = await getRequestT();

  const STATE_LABEL: Record<OnboardingStep["step_state"], string> = {
    pending: t("console.people.offerLetters.onboarding.state.pending", undefined, "Pending"),
    in_progress: t("console.people.offerLetters.onboarding.state.inProgress", undefined, "In Progress"),
    done: t("console.people.offerLetters.onboarding.state.done", undefined, "Done"),
    waived: t("console.people.offerLetters.onboarding.state.waived", undefined, "Waived"),
    blocked: t("console.people.offerLetters.onboarding.state.blocked", undefined, "Blocked"),
  };

  const steps = await listOnboardingSteps(id);
  if (steps.length === 0) notFound();

  const total = steps.length;
  const done = steps.filter((s) => s.step_state === "done" || s.step_state === "waived").length;
  const cpOpen = steps.filter((s) => s.critical_path && s.step_state !== "done" && s.step_state !== "waived").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.offerLetters.onboarding.eyebrow", undefined, "Onboarding")}
        title={t("console.people.offerLetters.onboarding.title", undefined, "Engagement Onboarding")}
        subtitle={t(
          "console.people.offerLetters.onboarding.subtitle",
          { done, total, pct, cpOpen },
          `${done}/${total} steps complete (${pct}%) · ${cpOpen} critical-path open`,
        )}
      />
      <div className="page-content space-y-4">
        <ul className="space-y-2">
          {steps.map((s) => (
            <li key={s.id} className="surface flex items-start gap-3 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {s.critical_path ? <span className="font-bold text-[var(--p-danger)]">★</span> : null}
                  <span className="font-medium">{s.title}</span>
                  <Badge variant={STATE_VARIANT[s.step_state]}>{STATE_LABEL[s.step_state]}</Badge>
                  {s.category ? <span className="text-xs text-[var(--p-text-3)] uppercase">{s.category}</span> : null}
                </div>
                {s.description ? <p className="mt-1 text-sm text-[var(--p-text-3)]">{s.description}</p> : null}
                <div className="mt-2 flex gap-3 text-xs text-[var(--p-text-3)]">
                  {s.due_at ? (
                    <span>
                      {t(
                        "console.people.offerLetters.onboarding.due",
                        { date: formatDate(s.due_at, "medium") },
                        `Due ${formatDate(s.due_at, "medium")}`,
                      )}
                    </span>
                  ) : null}
                  {s.completed_at ? (
                    <span>
                      {t(
                        "console.people.offerLetters.onboarding.completed",
                        { date: formatDate(s.completed_at, "medium") },
                        `· Completed ${formatDate(s.completed_at, "medium")}`,
                      )}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="surface p-4 text-xs text-[var(--p-text-3)]">
          <Link href="/console/people/offer-letters" className="underline">
            {t("console.people.offerLetters.onboarding.backLink", undefined, "← Back to offer letters")}
          </Link>
        </div>
      </div>
    </>
  );
}
