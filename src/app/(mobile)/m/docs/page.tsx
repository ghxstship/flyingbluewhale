import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { DocsView, type DocItem, type DocScope } from "./DocsView";

export const dynamic = "force-dynamic";

type DeliverableRow = {
  id: string;
  type: string;
  title: string | null;
  scope: string;
  file_path: string | null;
  submitted_by: string | null;
  updated_at: string;
};

type PersonalRow = {
  id: string;
  label: string;
  doc_kind: string;
  uploaded_at: string;
};

/**
 * Map a deliverable's free-text `scope` onto the kit's visibility band.
 * `canonical` docs are shared with the project team; `external_example`
 * (and anything unrecognized) are treated as restricted. A deliverable
 * the caller themselves submitted reads as "You".
 */
function scopeFor(scope: string, isMine: boolean): DocScope {
  if (isMine) return "You";
  switch (scope) {
    case "canonical":
      return "Team";
    case "external_example":
      return "Restricted";
    default:
      return "All";
  }
}

/**
 * /m/docs — field document library. Two sources, one list: project
 * documents (`deliverables`, scoped by RBAC) the caller can see, plus
 * the caller's own personal documents (`personal_documents`). The
 * surviving client `DocsView` owns search/group/filter; only personal
 * docs are downloadable (DocDownloadLink mints a signed URL for them).
 */
export default async function MobileDocsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.docs.eyebrow", undefined, "Field")}</div>
        <h1 className="scr-h">{t("m.docs.title", undefined, "Documents")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  // RLS already scopes deliverables to what this user may read; we cap and
  // sort newest-first. Personal docs are self-owned.
  const [delivRes, personalRes] = await Promise.all([
    supabase
      .from("deliverables")
      .select("id, type, title, scope, file_path, submitted_by, updated_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("personal_documents")
      .select("id, label, doc_kind, uploaded_at")
      .eq("user_id", session.userId)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false })
      .limit(100),
  ]);

  const deliverables = (delivRes.data ?? []) as DeliverableRow[];
  const personal = (personalRes.data ?? []) as PersonalRow[];

  const items: DocItem[] = [
    ...deliverables.map<DocItem>((d) => ({
      id: d.id,
      title: d.title ?? toTitle(d.type),
      cat: toTitle(d.type),
      scope: scopeFor(d.scope, d.submitted_by === session.userId),
      kind: "deliverable",
      // Deliverable file delivery rides its own signed-URL endpoint, not
      // the personal-document DocDownloadLink — so no inline download here.
      downloadable: false,
      updated: d.updated_at,
    })),
    ...personal.map<DocItem>((p) => ({
      id: p.id,
      title: p.label,
      cat: toTitle(p.doc_kind),
      scope: "You" as DocScope,
      kind: "personal",
      downloadable: true,
      updated: p.uploaded_at,
    })),
  ];

  return (
    <DocsView
      items={items}
      eyebrow={t("m.docs.eyebrow", undefined, "Field")}
      title={t("m.docs.title", undefined, "Documents")}
    />
  );
}
