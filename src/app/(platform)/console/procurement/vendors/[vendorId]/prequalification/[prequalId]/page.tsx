import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  approved: "success",
  approved_conditional: "success",
  rejected: "error",
  expired: "error",
  invited: "info",
  in_progress: "info",
  submitted: "info",
};

const CATEGORY_TONE: Record<string, BadgeVariant> = {
  insurance: "info",
  safety: "warning",
  financial: "info",
  references: "muted",
  licenses: "muted",
  experience: "info",
  other: "muted",
};

type Prequal = {
  id: string;
  status: string;
  score: number | null;
  submitted_at: string | null;
  approved_at: string | null;
  expires_at: string | null;
  notes: string | null;
  questionnaire_id: string;
  questionnaire: { name: string | null; description: string | null } | null;
  vendor: { name: string | null } | null;
};

type Question = {
  id: string;
  position: number;
  category: string;
  prompt: string;
  required: boolean;
  scoring_weight: number;
};

type Answer = {
  id: string;
  question_id: string;
  answer: string | null;
  attachment_path: string | null;
  score: number | null;
  created_at: string;
};

export default async function Page({ params }: { params: Promise<{ vendorId: string; prequalId: string }> }) {
  const { vendorId, prequalId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase)
    return <div className="page-content">{t("console.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: prequalData } = await supabase
    .from("vendor_prequalifications")
    .select(
      "id, status:prequalification_state, score, submitted_at, approved_at, expires_at, notes, questionnaire_id, questionnaire:questionnaire_id(name, description), vendor:vendor_id(name)",
    )
    .eq("id", prequalId)
    .eq("vendor_id", vendorId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const prequal = prequalData as unknown as Prequal | null;
  if (!prequal) notFound();

  // vendor_prequalification_answers was orphaned — the parent table
  // showed status + score but the reviewer had no way to see the
  // actual responses behind that score. Fetch questions + answers
  // separately and stitch by question_id so missing answers render
  // explicitly as gaps rather than dropping silently.
  const [{ data: questionsData }, { data: answersData }] = await Promise.all([
    supabase
      .from("prequalification_questions")
      .select("id, position, category, prompt, required, scoring_weight")
      .eq("questionnaire_id", prequal.questionnaire_id)
      .eq("org_id", session.orgId)
      .order("position", { ascending: true }),
    supabase
      .from("vendor_prequalification_answers")
      .select("id, question_id, answer, attachment_path, score, created_at")
      .eq("vendor_prequalification_id", prequalId)
      .eq("org_id", session.orgId),
  ]);
  const questions = (questionsData ?? []) as Question[];
  const answers = (answersData ?? []) as Answer[];
  const answerByQ = new Map(answers.map((a) => [a.question_id, a]));

  const requiredCount = questions.filter((q) => q.required).length;
  const answeredRequired = questions.filter((q) => q.required && answerByQ.has(q.id)).length;
  const completion = questions.length > 0 ? Math.round((answers.length / questions.length) * 100) : 0;

  // Attachments live in the procore-parity bucket per the storage
  // policy allowlist. Sign them just-in-time so the reviewer can click
  // through without expiring credentials sticking around in HTML.
  const service = createServiceClient();
  const attachmentPaths = answers.map((a) => a.attachment_path).filter((p): p is string => !!p && p.length > 0);
  const signedAttachments = new Map<string, string>();
  await Promise.all(
    attachmentPaths.map(async (path) => {
      const { data: signed } = await service.storage.from("procore-parity").createSignedUrl(path, 600);
      if (signed?.signedUrl) signedAttachments.set(path, signed.signedUrl);
    }),
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t(
          "console.procurement.vendors.prequalification.detail.eyebrow",
          undefined,
          "Vendor · Prequalification",
        )}
        title={
          prequal.questionnaire?.name ??
          t("console.procurement.vendors.prequalification.detail.fallbackTitle", undefined, "Questionnaire")
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[prequal.status] ?? "default"}>{toTitle(prequal.status)}</Badge>
            {prequal.vendor?.name && <Badge variant="muted">{prequal.vendor.name}</Badge>}
            {prequal.submitted_at && (
              <span className="font-mono text-xs">
                {t(
                  "console.procurement.vendors.prequalification.detail.submittedAt",
                  { date: formatDate(prequal.submitted_at) },
                  `submitted ${formatDate(prequal.submitted_at)}`,
                )}
              </span>
            )}
            {prequal.expires_at && (
              <span className="font-mono text-xs">
                {t(
                  "console.procurement.vendors.prequalification.detail.expiresAt",
                  { date: formatDate(prequal.expires_at) },
                  `expires ${formatDate(prequal.expires_at)}`,
                )}
              </span>
            )}
          </span>
        }
        breadcrumbs={[
          { label: t("console.procurement.title", undefined, "Procurement"), href: "/console/procurement" },
          { label: t("console.procurement.vendors.title", undefined, "Vendors"), href: "/console/procurement/vendors" },
          {
            label: prequal.vendor?.name ?? t("console.procurement.vendors.detail.fallbackLabel", undefined, "Vendor"),
            href: `/console/procurement/vendors/${vendorId}`,
          },
          {
            label: t("console.procurement.vendors.prequalification.title", undefined, "Prequalification"),
            href: `/console/procurement/vendors/${vendorId}/prequalification`,
          },
          {
            label:
              prequal.questionnaire?.name ??
              t("console.procurement.vendors.prequalification.detail.fallbackBreadcrumb", undefined, "Detail"),
          },
        ]}
        action={
          <Button href={`/console/procurement/vendors/${vendorId}/prequalification`} variant="ghost" size="sm">
            {t("common.back", undefined, "Back")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.vendors.prequalification.detail.scoreLabel", undefined, "Score")}
            value={prequal.score != null ? prequal.score.toFixed(1) : "—"}
          />
          <MetricCard
            label={t(
              "console.procurement.vendors.prequalification.detail.requiredAnsweredLabel",
              undefined,
              "Required Answered",
            )}
            value={`${answeredRequired}/${requiredCount}`}
            accent={requiredCount > 0 && answeredRequired < requiredCount}
          />
          <MetricCard
            label={t("console.procurement.vendors.prequalification.detail.completionLabel", undefined, "Completion")}
            value={`${completion}%`}
          />
        </div>

        {prequal.notes && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">
              {t(
                "console.procurement.vendors.prequalification.detail.reviewerNotesHeading",
                undefined,
                "Reviewer Notes",
              )}
            </h2>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{prequal.notes}</p>
          </section>
        )}

        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.procurement.vendors.prequalification.detail.responsesHeading", undefined, "Responses")}
            </h2>
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {answers.length}/{questions.length}
            </span>
          </div>
          {questions.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.procurement.vendors.prequalification.detail.noQuestions",
                undefined,
                "No questions in this questionnaire — nothing to render.",
              )}
            </p>
          ) : (
            <ol className="mt-3 space-y-3">
              {questions.map((q) => {
                const a = answerByQ.get(q.id);
                const missing = !a;
                const signedAttachment = a?.attachment_path ? (signedAttachments.get(a.attachment_path) ?? null) : null;
                return (
                  <li
                    key={q.id}
                    className={`surface-inset rounded-md p-3 ${missing && q.required ? "border border-[var(--p-warning)]" : ""}`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-mono text-xs text-[var(--p-text-2)]">
                          {t(
                            "console.procurement.vendors.prequalification.detail.questionNumber",
                            { n: q.position },
                            `Q${q.position}`,
                          )}
                        </span>
                        <Badge variant={CATEGORY_TONE[q.category] ?? "muted"}>{toTitle(q.category)}</Badge>
                        {q.required && (
                          <Badge variant="muted">
                            {t(
                              "console.procurement.vendors.prequalification.detail.requiredBadge",
                              undefined,
                              "Required",
                            )}
                          </Badge>
                        )}
                      </div>
                      {a?.score != null && (
                        <span className="font-mono text-xs">
                          {t(
                            "console.procurement.vendors.prequalification.detail.scoreWeight",
                            { score: a.score.toFixed(1), weight: q.scoring_weight.toFixed(2) },
                            `score ${a.score.toFixed(1)} · weight ${q.scoring_weight.toFixed(2)}`,
                          )}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-semibold">{q.prompt}</p>
                    {missing ? (
                      <p className="mt-2 text-xs text-[var(--p-text-2)] italic">
                        {q.required
                          ? t(
                              "console.procurement.vendors.prequalification.detail.requiredMissing",
                              undefined,
                              "No response — required answer missing.",
                            )
                          : t(
                              "console.procurement.vendors.prequalification.detail.notAnswered",
                              undefined,
                              "Not answered.",
                            )}
                      </p>
                    ) : (
                      <>
                        <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">
                          {a.answer ?? (
                            <span className="text-[var(--p-text-2)] italic">
                              {t("console.procurement.vendors.prequalification.detail.noText", undefined, "(no text)")}
                            </span>
                          )}
                        </p>
                        {a.attachment_path && (
                          <div className="mt-2 text-xs">
                            {signedAttachment ? (
                              <a
                                href={signedAttachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[var(--p-accent)] hover:underline"
                              >
                                ↗ {a.attachment_path.split("/").pop()}
                              </a>
                            ) : (
                              <span className="font-mono text-[var(--p-text-2)]">
                                {t(
                                  "console.procurement.vendors.prequalification.detail.attachmentPrefix",
                                  { path: a.attachment_path },
                                  `attachment: ${a.attachment_path}`,
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
