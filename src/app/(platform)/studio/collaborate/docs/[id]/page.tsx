import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { asTiptapDoc, isDocState, type DocState } from "@/lib/collaborate";
import { DocEditorIsland } from "./DocEditorIsland";
import { deleteDoc } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="page-content">
        {t("console.collaborate.docs.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await (supabase as unknown as LooseSupabase)
    .from("collab_docs")
    .select("id, title, content, doc_state, updated_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const doc = data as { id: string; title: string; content: unknown; doc_state: string; updated_at: string };
  const docState: DocState = isDocState(doc.doc_state) ? doc.doc_state : "draft";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.collaborate.docs.detail.eyebrow", undefined, "Pages")}
        title={doc.title}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={docState} />
            <DeleteForm
              action={deleteDoc.bind(null, doc.id)}
              confirm={t(
                "console.collaborate.docs.detail.deleteConfirm",
                undefined,
                "Delete this document? This moves it to trash.",
              )}
              label={t("common.delete", undefined, "Delete")}
              undo={{ table: "collab_docs", id: doc.id, redirectTo: "/studio/collaborate/docs" }}
            />
          </div>
        }
      />
      <div className="page-content">
        <DocEditorIsland
          id={doc.id}
          initialTitle={doc.title}
          initialState={docState}
          initialContent={asTiptapDoc(doc.content)}
        />
      </div>
    </>
  );
}
