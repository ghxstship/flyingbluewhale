import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { answerRfi, closeRfi } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: rfi } = await supabase
    .from("rfis")
    .select(
      "*, project:project_id(name), ball:ball_in_court_id(name, email), asker:asked_by(name, email), answerer:answered_by(name, email)",
    )
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!rfi) notFound();

  const project = (rfi.project as unknown as { name: string | null } | null)?.name ?? "—";

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        breadcrumbs={[{ label: "RFIs", href: "/console/rfis" }, { label: rfi.code }]}
        title={`${rfi.code} — ${rfi.subject}`}
        subtitle={project}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="info">{rfi.status}</Badge>
            {rfi.status === "answered" && (
              <form action={closeRfi.bind(null, id)}>
                <button className="surface-raised hover-lift rounded-md px-3 py-1.5 text-xs font-medium" type="submit">
                  Close RFI
                </button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Question</h3>
          <p className="mt-2 text-sm whitespace-pre-wrap">{rfi.question}</p>
          {rfi.category && <p className="mt-2 text-xs text-[var(--text-muted)]">Category: {rfi.category}</p>}
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Official answer</h3>
          {rfi.official_answer ? (
            <div className="mt-2">
              <p className="text-sm whitespace-pre-wrap">{rfi.official_answer}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Answered by{" "}
                {(rfi.answerer as unknown as { name: string | null; email: string | null } | null)?.name ?? "—"}
                {rfi.answered_at ? ` · ${new Date(rfi.answered_at).toLocaleString()}` : ""}
              </p>
            </div>
          ) : (
            rfi.status === "open" && (
              <form action={answerRfi.bind(null, id)} className="mt-2 space-y-2">
                <textarea
                  name="official_answer"
                  rows={4}
                  required
                  placeholder="Provide the binding response. This becomes the authoritative answer."
                  className={INPUT}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="surface-raised hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
                  >
                    Post answer
                  </button>
                </div>
              </form>
            )
          )}
        </section>

        <ConversationPanel orgId={session.orgId} recordType="rfi" recordId={id} />
      </div>
    </>
  );
}
