import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Json } from "@/lib/supabase/database.types";
import { getRequestT } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type SubmissionRow = {
  id: string;
  form_id: string;
  payload: Json;
  submitter_email: string | null;
  user_agent: string | null;
  created_at: string;
};

function fmt(iso: string): string {
  return formatDateParts(new Date(iso), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A `file` answer is stored as `{ path, name, size, type }` — the bytes live
 * in the private `forms` bucket, so the payload alone is unopenable.
 * `renderValue` used to JSON.stringify it, which showed a reviewer a storage
 * path and no way to reach the document someone actually submitted.
 */
type FileAnswer = { path: string; name: string; size?: number; type?: string };

function asFileAnswer(value: Json): FileAnswer | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, Json>;
  if (typeof v.path !== "string" || !v.path || typeof v.name !== "string") return null;
  return {
    path: v.path,
    name: v.name,
    size: typeof v.size === "number" ? v.size : undefined,
    type: typeof v.type === "string" ? v.type : undefined,
  };
}

function formatBytes(n: number | undefined): string | null {
  if (n == null) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function renderValue(value: Json): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

export default async function Page({
  params,
}: {
  params: Promise<{ formId: string; submissionId: string }>;
}) {
  const { formId, submissionId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.forms.eyebrow", undefined, "Forms")}
          title={t("console.forms.submissions.detail.title", undefined, "Submission")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.forms.submissions.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: formData } = await supabase
    .from("form_defs")
    .select("id, title, slug")
    .eq("id", formId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!formData) notFound();

  const { data } = await supabase
    .from("form_submissions")
    .select("id, form_id, payload, submitter_email, user_agent, created_at")
    .eq("id", submissionId)
    .eq("form_id", formId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const submission = data as SubmissionRow | null;
  if (!submission) notFound();

  const payload = submission.payload;
  const entries =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? Object.entries(payload as Record<string, Json>)
      : [];

  // Sign the file answers so a reviewer can open what was submitted. The
  // `forms` bucket is private and the object path is org-prefixed, so the
  // caller's own client can sign it — RLS stays the gate. Best-effort: a
  // missing object renders as its filename rather than blanking the answer.
  const signedFiles = new Map<string, string>();
  await Promise.all(
    entries.map(async ([key, value]) => {
      const file = asFileAnswer(value);
      if (!file) return;
      const { data } = await supabase.storage.from("forms").createSignedUrl(file.path, 600);
      if (data?.signedUrl) signedFiles.set(key, data.signedUrl);
    }),
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.forms.eyebrow", undefined, "Forms")}
        title={t("console.forms.submissions.detail.title", undefined, "Submission")}
        subtitle={
          <span className="font-mono text-xs">
            {t("console.forms.submissions.detail.submittedAt", { date: fmt(submission.created_at) }, `submitted ${fmt(submission.created_at)}`)}
          </span>
        }
        breadcrumbs={[
          { label: t("console.forms.eyebrow", undefined, "Forms"), href: "/studio/forms" },
          { label: formData.title, href: `/studio/forms/${formId}` },
          {
            label: t("console.forms.submissions.title", undefined, "Submissions"),
            href: `/studio/forms/${formId}/submissions`,
          },
          { label: submission.id.slice(0, 8) },
        ]}
        action={
          <Button href={`/studio/forms/${formId}/submissions`} variant="secondary" size="sm">
            {t("console.forms.submissions.detail.backToList", undefined, "All submissions")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.forms.submissions.detail.metaHeading", undefined, "Details")}
          </h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--p-text-2)]">
                {t("console.forms.submissions.column.email", undefined, "Submitter")}
              </dt>
              <dd className="text-sm">
                {submission.submitter_email ?? (
                  <span className="text-[var(--p-text-2)]">
                    {t("console.forms.submissions.anonymous", undefined, "Anonymous")}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--p-text-2)]">
                {t("console.forms.submissions.column.submitted", undefined, "Submitted")}
              </dt>
              <dd className="text-sm font-mono">{fmt(submission.created_at)}</dd>
            </div>
            {submission.user_agent && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[var(--p-text-2)]">
                  {t("console.forms.submissions.detail.userAgent", undefined, "User agent")}
                </dt>
                <dd className="text-xs font-mono break-all text-[var(--p-text-2)]">{submission.user_agent}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.forms.submissions.detail.answersHeading", undefined, "Answers")}
          </h3>
          {entries.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.forms.submissions.detail.noAnswers", undefined, "No answers recorded for this submission.")}
            </p>
          ) : (
            <dl className="mt-3 divide-y divide-[var(--p-border)]">
              {entries.map(([key, value]) => {
                const file = asFileAnswer(value);
                const href = file ? signedFiles.get(key) : undefined;
                const meta = file ? [file.type, formatBytes(file.size)].filter(Boolean).join(" · ") : "";
                return (
                  <div key={key} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-medium text-[var(--p-text-2)]">{toTitle(key)}</dt>
                    <dd className="whitespace-pre-wrap text-sm sm:col-span-2">
                      {file ? (
                        <span className="flex flex-wrap items-baseline gap-2">
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--p-accent-text)] underline"
                            >
                              {file.name}
                            </a>
                          ) : (
                            // The row says a file was submitted; if we can't
                            // reach it, say that plainly rather than render a
                            // dead link or a storage path.
                            <span>{file.name}</span>
                          )}
                          {meta && <span className="text-xs text-[var(--p-text-3)]">{meta}</span>}
                          {!href && (
                            <span className="text-xs text-[var(--p-warning)]">
                              {t("console.forms.submissions.detail.fileUnavailable", undefined, "File unavailable")}
                            </span>
                          )}
                        </span>
                      ) : (
                        renderValue(value)
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </section>
      </div>
    </>
  );
}
