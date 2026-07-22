import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type FormRow = {
  id: string;
  title: string;
  slug: string;
  form_state: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.forms.eyebrow", undefined, "Workspace")}
          title={t("console.forms.title", undefined, "Forms")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.forms.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("form_defs")
    .select("id, title, slug, form_state, description, created_at, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as FormRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.forms.eyebrow", undefined, "Workspace")}
        title={t("console.forms.title", undefined, "Forms")}
        subtitle={
          rows.length === 1
            ? t("console.forms.countSingular", { count: rows.length }, `${rows.length} form`)
            : t("console.forms.countPlural", { count: rows.length }, `${rows.length} forms`)
        }
        action={
          <Button href="/studio/forms/new" size="sm">
            {t("console.forms.newForm", undefined, "+ New Form")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<FormRow>
          rows={rows}
          rowHref={(r) => `/studio/forms/${r.id}`}
          emptyLabel={t("console.forms.emptyLabel", undefined, "No forms yet")}
          emptyDescription={t(
            "console.forms.emptyDescription",
            undefined,
            "Author intake, RSVP, or feedback forms with a JSON schema. Each form gets a public response URL.",
          )}
          emptyAction={
            <Button href="/studio/forms/new" size="sm">
              {t("console.forms.newForm", undefined, "+ New Form")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.forms.column.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "slug",
              header: t("console.forms.column.slug", undefined, "Slug"),
              render: (r) => r.slug,
              accessor: (r) => r.slug ?? null,
              mono: true,
            },
            {
              key: "form_state",
              header: t("console.forms.column.form_state", undefined, "Status"),
              render: (r) => r.form_state,
              accessor: (r) => r.form_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "updated_at",
              header: t("console.forms.column.updated", undefined, "Updated"),
              render: (r) => r.updated_at?.slice(0, 10),
              accessor: (r) => r.updated_at?.slice ?? null,
              mono: true,
            },
          ]}
        />
      </div>
    </>
  );
}
