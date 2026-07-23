import { notFound } from "next/navigation";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getWhiteboard } from "@/lib/db/whiteboards";
import { getRequestT } from "@/lib/i18n/request";
import { WHITEBOARD_STATES, WHITEBOARD_STATE_LABELS } from "@/lib/whiteboards";
import { setWhiteboardStateAction, deleteWhiteboardAction } from "../actions";
import { WhiteboardCanvas } from "./whiteboard-loader";
import type { TLEditorSnapshot } from "tldraw";

export const dynamic = "force-dynamic";

export default async function WhiteboardDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();

  const session = await requireSession();
  const canEdit = isManagerPlus(session);
  const board = await getWhiteboard(session.orgId, id);
  if (!board) notFound();

  // The snapshot is opaque tldraw document state; the canvas validates it on
  // load. Null until the board's first save.
  const initialSnapshot = (board.snapshot ?? null) as TLEditorSnapshot | null;
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.collaborate.whiteboards.detail.eyebrow", undefined, "Whiteboard")}
        title={board.name}
        subtitle={WHITEBOARD_STATE_LABELS[board.whiteboard_state]}
        breadcrumbs={[
          { label: t("console.collaborate.whiteboards.detail.breadcrumb.collaborate", undefined, "Collaborate") },
          {
            label: t("console.collaborate.whiteboards.title", undefined, "Whiteboards"),
            href: "/studio/collaborate/whiteboards",
          },
          { label: board.name },
        ]}
        action={
          canEdit ? (
            <div className="flex items-center gap-2">
              {WHITEBOARD_STATES.filter((s) => s !== board.whiteboard_state).map((s) => (
                <form key={s} action={setWhiteboardStateAction.bind(null, board.id, s)}>
                  <Button type="submit" size="sm" variant="secondary">
                    {s === "archived"
                      ? t("console.collaborate.whiteboards.detail.archive", undefined, "Archive")
                      : t("console.collaborate.whiteboards.detail.reactivate", undefined, "Reactivate")}
                  </Button>
                </form>
              ))}
              <DeleteForm
                action={deleteWhiteboardAction.bind(null, board.id)}
                confirm={t(
                  "console.collaborate.whiteboards.detail.deleteConfirm",
                  { name: board.name },
                  `Delete whiteboard "${board.name}"?`,
                )}
                undo={{ table: "whiteboards", id: board.id, redirectTo: "/studio/collaborate/whiteboards" }}
              />
            </div>
          ) : undefined
        }
      />
      <div className="page-content">
        <WhiteboardCanvas id={board.id} initialSnapshot={initialSnapshot} canEdit={canEdit} />
      </div>
    </>
  );
}
