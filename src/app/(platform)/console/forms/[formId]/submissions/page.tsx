import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type SubmissionRow = {
  id: string;
  form_id: string;
  submitter_email: string | null;
  created_at: string;
};

export default async function Page({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.forms.eyebrow", undefined, "Forms")}
          title={t("console.forms.submissions.title", undefined, "Submissions")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.forms.submissions.configureSupabase", undefined, "Configure Supabase.")}
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
    .select("id, form_id, submitter_email, created_at")
    .eq("form_id", formId)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as SubmissionRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.forms.eyebrow", undefined, "Forms")}
        title={t("console.forms.submissions.title", undefined, "Submissions")}
        subtitle={
          <span className="font-mono text-xs">
            /{formData.slug} ·{" "}
            {rows.length === 1
              ? t("console.forms.submissions.countSingular", { count: rows.length }, `${rows.length} response`)
              : t("console.forms.submissions.countPlural", { count: rows.length }, `${rows.length} responses`)}
          </span>
        }
        breadcrumbs={[
          { label: t("console.forms.eyebrow", undefined, "Forms"), href: "/console/forms" },
          { label: formData.title, href: `/console/forms/${formId}` },
          { label: t("console.forms.submissions.title", undefined, "Submissions") },
        ]}
        action={
          <Button href={`/console/forms/${formId}`} variant="secondary" size="sm">
            {t("console.forms.submissions.backToForm", undefined, "Back to form")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<SubmissionRow>
          rows={rows}
          rowHref={(r) => `/console/forms/${formId}/submissions/${r.id}`}
          emptyLabel={t("console.forms.submissions.emptyLabel", undefined, "No submissions yet")}
          emptyDescription={t(
            "console.forms.submissions.emptyDescription",
            undefined,
            "Responses collected from the public form URL will appear here.",
          )}
          columns={[
            {
              key: "submitter_email",
              header: t("console.forms.submissions.column.email", undefined, "Submitter"),
              render: (r) =>
                r.submitter_email ?? (
                  <span className="text-[var(--p-text-2)]">
                    {t("console.forms.submissions.anonymous", undefined, "Anonymous")}
                  </span>
                ),
              accessor: (r) => r.submitter_email ?? null,
            },
            {
              key: "created_at",
              header: t("console.forms.submissions.column.submitted", undefined, "Submitted"),
              render: (r) => <span className="font-mono text-xs">{r.created_at?.slice(0, 16).replace("T", " ")}</span>,
              accessor: (r) => r.created_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
