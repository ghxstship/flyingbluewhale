import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";
import { getOfferLetterByToken } from "@/lib/offer-letters/queries";
import { listOnboardingSteps, type OnboardingStep } from "@/lib/db/onboarding";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

const STATE_VARIANT: Record<OnboardingStep["step_state"], "muted" | "warning" | "success" | "error"> = {
  pending: "muted",
  in_progress: "warning",
  done: "success",
  waived: "muted",
  blocked: "error",
};
const STATE_LABEL: Record<OnboardingStep["step_state"], string> = {
  pending: "Not started",
  in_progress: "In progress",
  done: "Done",
  waived: "Waived",
  blocked: "Blocked",
};

export default async function OnboardingPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();
  const c = await cookies();
  const code = c.get(`offer_${token}`)?.value;
  if (!code) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Onboarding</h1>
        <p>
          Open your engagement letter first to unlock onboarding —{" "}
          <Link href={`/offer/${token}`} className="underline">
            return to letter
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
      <header className="flex items-baseline justify-between border-b border-(--border-default) pb-4">
        <div>
          <div className="text-xs tracking-widest text-(--text-muted) uppercase">Onboarding</div>
          <h1 className="text-2xl font-semibold">Welcome, {letter.recipient_name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-(--text-secondary)">
            {letter.project_name} · {letter.role_title}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-(--text-muted) uppercase">Progress</div>
          <div className="font-mono text-3xl">
            {done}/{total}
          </div>
          <div className="text-xs text-(--text-muted)">{pct}%</div>
        </div>
      </header>

      {cpOpen > 0 ? (
        <div className="border-l-warning bg-warning-soft border-l-4 p-4">
          <p className="text-sm font-medium">
            {cpOpen} critical-path step{cpOpen === 1 ? "" : "s"} open
          </p>
          <p className="text-xs text-(--text-secondary)">
            Critical-path steps gate your credentials and first-call. Items marked ★ below.
          </p>
        </div>
      ) : null}

      <ol className="space-y-2">
        {steps.map((s) => (
          <li key={s.id} className="surface flex flex-col gap-1 p-4">
            <div className="flex items-center gap-2">
              {s.critical_path ? <span className="font-bold text-(--color-error)">★</span> : null}
              <span className="font-medium">{s.title}</span>
              <Badge variant={STATE_VARIANT[s.step_state]}>{STATE_LABEL[s.step_state]}</Badge>
              {s.category ? <span className="text-xs text-(--text-muted) uppercase">{s.category}</span> : null}
            </div>
            {s.description ? <p className="text-sm text-(--text-secondary)">{s.description}</p> : null}
            <div className="mt-1 flex gap-3 text-xs text-(--text-muted)">
              {s.due_at ? <span>Due {formatDate(s.due_at, "medium")}</span> : null}
              {s.completed_at ? <span>· Completed {formatDate(s.completed_at, "medium")}</span> : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="text-xs text-(--text-muted)">
        <Link href={`/offer/${token}`} className="underline">
          ← Back to engagement letter
        </Link>
      </div>
    </div>
  );
}
