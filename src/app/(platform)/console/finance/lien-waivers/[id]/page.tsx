import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { sendWaiver, recordSignature, markReturned, releaseWaiver, voidWaiver } from "./actions";

export const dynamic = "force-dynamic";

type WaiverState = "drafted" | "sent" | "signed" | "returned" | "released" | "voided";

type Waiver = {
  id: string;
  waiver_type: "conditional" | "unconditional";
  waiver_scope: "partial" | "final";
  waiver_state: WaiverState;
  amount: number;
  through_date: string | null;
  state_jurisdiction: string | null;
  envelope_id: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signer_title: string | null;
  sent_at: string | null;
  returned_at: string | null;
  released_at: string | null;
  voided_at: string | null;
  voided_reason: string | null;
  notes: string | null;
  project: { id: string; name: string | null } | null;
  vendor: { id: string; name: string | null } | null;
  payment_application: { id: string; period_label: string | null } | null;
};

const STATE_TONE: Record<WaiverState, "muted" | "info" | "warning" | "success" | "error"> = {
  drafted: "muted",
  sent: "info",
  signed: "info",
  returned: "warning",
  released: "success",
  voided: "error",
};

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const { id } = await params;

  const { data: row } = await supabase
    .from("lien_waivers")
    .select(
      "id, waiver_type, waiver_scope, waiver_state, amount, through_date, state_jurisdiction, envelope_id, signed_at, signer_name, signer_title, sent_at, returned_at, released_at, voided_at, voided_reason, notes, project:project_id(id, name), vendor:vendor_id(id, name), payment_application:payment_application_id(id, period_label)",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const w = row as unknown as Waiver;

  return (
    <>
      <ModuleHeader
        eyebrow={`Lien Waivers · ${w.project?.name ?? "Project"}`}
        title={`${toTitle(w.waiver_type)} · ${toTitle(w.waiver_scope)} waiver`}
        subtitle={`${w.vendor?.name ?? "Unassigned vendor"} · ${fmt.money(Math.round(Number(w.amount) * 100))}${w.through_date ? ` · through ${fmt.dateParts(w.through_date + "T00:00:00", { month: "short", day: "numeric", year: "numeric" })}` : ""}`}
        action={
          <Button href="/console/finance/lien-waivers" size="sm" variant="ghost">
            ← All Waivers
          </Button>
        }
      />
      <div className="page-content space-y-6">
        <div className="surface flex flex-wrap items-center gap-3 p-3 text-xs">
          <Badge variant={STATE_TONE[w.waiver_state]}>{toTitle(w.waiver_state)}</Badge>
          {w.state_jurisdiction && (
            <span className="font-mono text-[var(--text-muted)]">JD · {w.state_jurisdiction}</span>
          )}
          {w.envelope_id && (
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              Envelope {w.envelope_id.slice(0, 12)}…
            </span>
          )}
          {w.payment_application && (
            <a
              className="text-[var(--accent)] underline"
              href={`/console/finance/pay-apps/${w.payment_application.id}`}
            >
              Pay-App {w.payment_application.period_label ?? "—"}
            </a>
          )}
        </div>

        <section className="surface space-y-2 p-4 text-xs">
          <h2 className="text-sm font-semibold">Timeline</h2>
          <ul className="space-y-1">
            {w.sent_at && (
              <li>
                <span className="font-mono text-[var(--text-muted)]">Sent</span> ·{" "}
                {fmt.dateParts(w.sent_at, { year: "numeric", month: "short", day: "numeric" })}
              </li>
            )}
            {w.signed_at && (
              <li>
                <span className="font-mono text-[var(--text-muted)]">Signed</span> · {w.signer_name ?? "—"}
                {w.signer_title ? ` (${w.signer_title})` : ""} ·{" "}
                {fmt.dateParts(w.signed_at, { year: "numeric", month: "short", day: "numeric" })}
              </li>
            )}
            {w.returned_at && (
              <li>
                <span className="font-mono text-[var(--text-muted)]">Returned</span> ·{" "}
                {fmt.dateParts(w.returned_at, { year: "numeric", month: "short", day: "numeric" })}
              </li>
            )}
            {w.released_at && (
              <li>
                <span className="font-mono text-[var(--text-muted)]">Released</span> ·{" "}
                {fmt.dateParts(w.released_at, { year: "numeric", month: "short", day: "numeric" })}
              </li>
            )}
            {w.voided_at && (
              <li className="text-[var(--color-error)]">
                <span className="font-mono">Voided</span> ·{" "}
                {fmt.dateParts(w.voided_at, { year: "numeric", month: "short", day: "numeric" })}
                {w.voided_reason ? ` · ${w.voided_reason}` : ""}
              </li>
            )}
          </ul>
        </section>

        {w.waiver_state !== "voided" && w.waiver_state !== "released" && (
          <section className="surface space-y-3 p-4 text-xs">
            <h2 className="text-sm font-semibold">Actions</h2>
            <div className="flex flex-wrap gap-2">
              {w.waiver_state === "drafted" && (
                <form action={sendWaiver} className="flex items-center gap-2">
                  <input type="hidden" name="waiver_id" value={w.id} />
                  <input
                    name="envelope_id"
                    placeholder="DocuSign envelope ID (optional)"
                    className={`${INPUT} w-72 text-xs`}
                  />
                  <Button type="submit" size="sm">
                    Mark Sent
                  </Button>
                </form>
              )}
              {(w.waiver_state === "drafted" || w.waiver_state === "sent") && (
                <form action={recordSignature} className="flex items-center gap-2">
                  <input type="hidden" name="waiver_id" value={w.id} />
                  <input name="signer_name" placeholder="Signer name" required className={`${INPUT} w-44 text-xs`} />
                  <input name="signer_title" placeholder="Title" className={`${INPUT} w-32 text-xs`} />
                  <Button type="submit" size="sm" variant="secondary">
                    Record Signature
                  </Button>
                </form>
              )}
              {w.waiver_state === "signed" && (
                <form action={markReturned}>
                  <input type="hidden" name="waiver_id" value={w.id} />
                  <Button type="submit" size="sm" variant="secondary">
                    Mark Returned
                  </Button>
                </form>
              )}
              {w.waiver_state === "returned" && (
                <form action={releaseWaiver}>
                  <input type="hidden" name="waiver_id" value={w.id} />
                  <Button type="submit" size="sm">
                    Release (Payment Cleared)
                  </Button>
                </form>
              )}
              <form action={voidWaiver} className="flex items-center gap-2">
                <input type="hidden" name="waiver_id" value={w.id} />
                <input name="reason" placeholder="Void reason" className={`${INPUT} w-56 text-xs`} />
                <Button type="submit" size="sm" variant="ghost">
                  Void
                </Button>
              </form>
            </div>
          </section>
        )}

        {w.notes && (
          <section className="surface space-y-2 p-4">
            <h2 className="text-sm font-semibold">Notes</h2>
            <p className="text-xs whitespace-pre-wrap text-[var(--text-secondary)]">{w.notes}</p>
          </section>
        )}
      </div>
    </>
  );
}
