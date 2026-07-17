import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CapabilityDenied } from "@/components/CapabilityDenied";
import { can, requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getOfferLetter } from "@/lib/offer-letters/queries";
import { listOnboardingSteps, type OnboardingStep } from "@/lib/db/onboarding";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { remindStepAction, seedPacketAction, waiveStepAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * /studio/people/offer-letters/[id]/onboarding — Kit 30 Onboarding Packet.
 * The generic step list reshaped into the packet table (Doc · Sent ·
 * Activity · Status · row action). Per-doc states still ride the existing
 * onboarding step engine (pending · in progress · done · waived · blocked);
 * the 4-doc LIFECYCLE_PACKET template is a seed over that engine, not a new
 * one. ★ marks critical-path docs.
 */

const STATE_VARIANT: Record<OnboardingStep["step_state"], "muted" | "warning" | "success" | "error"> = {
  pending: "warning",
  in_progress: "warning",
  done: "success",
  waived: "muted",
  blocked: "muted",
};

export default async function LetterOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();

  if (!can(session, "people:manage")) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.people.offerLetters.onboarding.eyebrow", undefined, "Onboarding")}
          title={t("console.people.offerLetters.onboarding.packetTitle", undefined, "Onboarding Packet")}
        />
        <CapabilityDenied
          capability="people:manage"
          title={t("console.people.offerLetters.onboarding.deniedTitle", undefined, "No Access")}
          description={t(
            "console.people.offerLetters.onboarding.deniedDescription",
            undefined,
            "Administering onboarding packets requires the capability below. Role grants are managed in Settings · Capabilities.",
          )}
        />
      </>
    );
  }

  const letterData = await getOfferLetter(session.orgId, id);
  if (!letterData) notFound();
  const { raw, resolved } = letterData;

  const STATE_LABEL: Record<OnboardingStep["step_state"], string> = {
    pending: t("console.people.offerLetters.onboarding.state.pending", undefined, "Pending"),
    in_progress: t("console.people.offerLetters.onboarding.state.inProgress", undefined, "In Progress"),
    done: t("console.people.offerLetters.onboarding.state.done", undefined, "Done"),
    waived: t("console.people.offerLetters.onboarding.state.waived", undefined, "Waived"),
    blocked: t("console.people.offerLetters.onboarding.state.notStarted", undefined, "Not Started"),
  };

  const steps = await listOnboardingSteps(id);
  const byKey = new Map(steps.map((s) => [s.step_key, s]));

  const total = steps.length;
  const done = steps.filter((s) => s.step_state === "done" || s.step_state === "waived").length;
  const cpOpen = steps.filter((s) => s.critical_path && s.step_state !== "done" && s.step_state !== "waived").length;

  const printUrl = `/offer/${raw.public_token}/print`;
  const isOpen = (s: OnboardingStep) => s.step_state === "pending" || s.step_state === "in_progress";

  function activityLabel(s: OnboardingStep): string {
    if (s.step_state === "done" && s.completed_at)
      return t(
        "console.people.offerLetters.onboarding.activityCompleted",
        { date: formatDate(s.completed_at, "medium") },
        `Completed ${formatDate(s.completed_at, "medium")}`,
      );
    if (s.step_state === "waived" && s.completed_at)
      return t(
        "console.people.offerLetters.onboarding.activityWaived",
        { date: formatDate(s.completed_at, "medium") },
        `Waived ${formatDate(s.completed_at, "medium")}`,
      );
    if (s.step_state === "blocked") {
      const blockerKey = (s.metadata as { blocked_by?: string } | null)?.blocked_by;
      const blocker = blockerKey ? byKey.get(blockerKey) : undefined;
      if (blocker)
        return t(
          "console.people.offerLetters.onboarding.activityBlocked",
          { doc: blocker.title },
          `Unlocks After ${blocker.title}`,
        );
    }
    if (s.notes) return s.notes;
    if (s.due_at)
      return t(
        "console.people.offerLetters.onboarding.due",
        { date: formatDate(s.due_at, "medium") },
        `Due ${formatDate(s.due_at, "medium")}`,
      );
    return "—";
  }

  return (
    <>
      <ModuleHeader
        eyebrow={
          <Link href={`/studio/people/offer-letters/${id}`} className="hover:text-[var(--p-accent)]">
            {t(
              "console.people.offerLetters.onboarding.eyebrowRecipient",
              { name: resolved.recipient_name },
              `People · ${resolved.recipient_name}`,
            )}
          </Link>
        }
        title={t("console.people.offerLetters.onboarding.packetTitle", undefined, "Onboarding Packet")}
        subtitle={t(
          "console.people.offerLetters.onboarding.packetSubtitle",
          { done, total, cpOpen },
          `${done} Of ${total} Docs Complete · ${cpOpen} Critical-Path Open`,
        )}
      />
      <div className="page-content space-y-4">
        {steps.length === 0 ? (
          <EmptyState
            title={t("console.people.offerLetters.onboarding.emptyTitle", undefined, "No Packet Started")}
            description={t(
              "console.people.offerLetters.onboarding.emptyDescription",
              undefined,
              "Seed the 4-doc lifecycle packet: Job Description, Offer Letter, Know Before You Go, Pre-Arrival Confirmation.",
            )}
            action={
              <form action={seedPacketAction.bind(null, id)}>
                <Button type="submit" size="sm">
                  {t("console.people.offerLetters.onboarding.emptyCta", undefined, "Create Packet")}
                </Button>
              </form>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.people.offerLetters.onboarding.colDoc", undefined, "Doc")}</th>
                  <th>{t("console.people.offerLetters.onboarding.colSent", undefined, "Sent")}</th>
                  <th>{t("console.people.offerLetters.onboarding.colActivity", undefined, "Activity")}</th>
                  <th>{t("console.people.offerLetters.onboarding.colStatus", undefined, "Status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {steps.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">
                      {s.title}
                      {s.critical_path && (
                        <span
                          className="ms-1.5 text-[var(--p-danger)]"
                          title={t("console.people.offerLetters.onboarding.criticalPath", undefined, "Critical Path")}
                        >
                          ★
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-[var(--p-text-2)]">
                      {raw.sent_at ? formatDate(raw.sent_at, "medium") : "—"}
                    </td>
                    <td className="text-[var(--p-text-2)]">{activityLabel(s)}</td>
                    <td>
                      <Badge variant={STATE_VARIANT[s.step_state]}>{STATE_LABEL[s.step_state]}</Badge>
                    </td>
                    <td className="whitespace-nowrap text-end">
                      {s.step_state === "done" && s.step_key === "offer_letter" ? (
                        <a href={printUrl} target="_blank" rel="noreferrer" className="text-xs underline">
                          {t("console.people.offerLetters.onboarding.pdfLink", undefined, "PDF ↗")}
                        </a>
                      ) : isOpen(s) ? (
                        <span className="inline-flex items-center gap-2">
                          <form action={remindStepAction.bind(null, id, s.id)} className="inline">
                            <Button type="submit" variant="secondary" size="sm">
                              {t("console.people.offerLetters.onboarding.remind", undefined, "Remind")}
                            </Button>
                          </form>
                          <form action={waiveStepAction.bind(null, id, s.id)} className="inline">
                            <Button type="submit" variant="tertiary" size="sm">
                              {t("console.people.offerLetters.onboarding.waive", undefined, "Waive")}
                            </Button>
                          </form>
                        </span>
                      ) : s.step_state === "blocked" ? (
                        <form action={waiveStepAction.bind(null, id, s.id)} className="inline">
                          <Button type="submit" variant="tertiary" size="sm">
                            {t("console.people.offerLetters.onboarding.waive", undefined, "Waive")}
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-[var(--p-text-3)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-[var(--p-text-3)]">
          {t(
            "console.people.offerLetters.onboarding.engineNote",
            undefined,
            "Per-doc states ride the onboarding step engine (pending · in progress · done · waived · blocked). This packet is a template of four steps, not a new engine.",
          )}
        </p>
      </div>
    </>
  );
}
