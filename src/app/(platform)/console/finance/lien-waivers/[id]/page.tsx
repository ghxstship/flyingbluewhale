import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { sendWaiver, recordSignature, markReturned, releaseWaiver, voidWaiver } from "./actions";
import { toneFor } from "@/lib/tones";

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

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
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
        eyebrow={`${t("console.finance.lienWaivers.detail.eyebrow", undefined, "Lien Waivers")} · ${w.project?.name ?? t("console.finance.lienWaivers.detail.projectFallback", undefined, "Project")}`}
        title={`${toTitle(w.waiver_type)} · ${toTitle(w.waiver_scope)} ${t("console.finance.lienWaivers.detail.waiverWord", undefined, "waiver")}`}
        subtitle={`${w.vendor?.name ?? t("console.finance.lienWaivers.detail.unassignedVendor", undefined, "Unassigned vendor")} · ${fmt.money(Math.round(Number(w.amount) * 100))}${w.through_date ? ` · ${t("console.finance.lienWaivers.detail.throughLabel", undefined, "through")} ${fmt.dateParts(w.through_date + "T00:00:00", { month: "short", day: "numeric", year: "numeric" })}` : ""}`}
        action={
          <Button href="/console/finance/lien-waivers" size="sm" variant="ghost">
            {t("console.finance.lienWaivers.detail.allWaivers", undefined, "← All Waivers")}
          </Button>
        }
      />
      <div className="page-content space-y-6">
        <div className="surface flex flex-wrap items-center gap-3 p-3 text-xs">
          <Badge variant={toneFor(w.waiver_state)}>{toTitle(w.waiver_state)}</Badge>
          {w.state_jurisdiction && (
            <span className="font-mono text-[var(--p-text-2)]">
              {t("console.finance.lienWaivers.detail.jdLabel", undefined, "JD")} · {w.state_jurisdiction}
            </span>
          )}
          {w.envelope_id && (
            <span className="font-mono text-[10px] text-[var(--p-text-2)]">
              {t("console.finance.lienWaivers.detail.envelopeLabel", undefined, "Envelope")}{" "}
              {w.envelope_id.slice(0, 12)}…
            </span>
          )}
          {w.payment_application && (
            <a
              className="text-[var(--p-accent)] underline"
              href={`/console/finance/pay-apps/${w.payment_application.id}`}
            >
              {t("console.finance.lienWaivers.detail.payAppLabel", undefined, "Pay-App")}{" "}
              {w.payment_application.period_label ?? "—"}
            </a>
          )}
        </div>

        <section className="surface space-y-2 p-4 text-xs">
          <h2 className="text-sm font-semibold">
            {t("console.finance.lienWaivers.detail.timelineHeading", undefined, "Timeline")}
          </h2>
          <ul className="space-y-1">
            {w.sent_at && (
              <li>
                <span className="font-mono text-[var(--p-text-2)]">
                  {t("console.finance.lienWaivers.detail.sentLabel", undefined, "Sent")}
                </span>{" "}
                · {fmt.dateParts(w.sent_at, { year: "numeric", month: "short", day: "numeric" })}
              </li>
            )}
            {w.signed_at && (
              <li>
                <span className="font-mono text-[var(--p-text-2)]">
                  {t("console.finance.lienWaivers.detail.signedLabel", undefined, "Signed")}
                </span>{" "}
                · {w.signer_name ?? "—"}
                {w.signer_title ? ` (${w.signer_title})` : ""} ·{" "}
                {fmt.dateParts(w.signed_at, { year: "numeric", month: "short", day: "numeric" })}
              </li>
            )}
            {w.returned_at && (
              <li>
                <span className="font-mono text-[var(--p-text-2)]">
                  {t("console.finance.lienWaivers.detail.returnedLabel", undefined, "Returned")}
                </span>{" "}
                · {fmt.dateParts(w.returned_at, { year: "numeric", month: "short", day: "numeric" })}
              </li>
            )}
            {w.released_at && (
              <li>
                <span className="font-mono text-[var(--p-text-2)]">
                  {t("console.finance.lienWaivers.detail.releasedLabel", undefined, "Released")}
                </span>{" "}
                · {fmt.dateParts(w.released_at, { year: "numeric", month: "short", day: "numeric" })}
              </li>
            )}
            {w.voided_at && (
              <li className="text-[var(--p-danger)]">
                <span className="font-mono">
                  {t("console.finance.lienWaivers.detail.voidedLabel", undefined, "Voided")}
                </span>{" "}
                · {fmt.dateParts(w.voided_at, { year: "numeric", month: "short", day: "numeric" })}
                {w.voided_reason ? ` · ${w.voided_reason}` : ""}
              </li>
            )}
          </ul>
        </section>

        {w.waiver_state !== "voided" && w.waiver_state !== "released" && (
          <section className="surface space-y-3 p-4 text-xs">
            <h2 className="text-sm font-semibold">
              {t("console.finance.lienWaivers.detail.actionsHeading", undefined, "Actions")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {w.waiver_state === "drafted" && (
                <form action={sendWaiver} className="flex items-center gap-2">
                  <input type="hidden" name="waiver_id" value={w.id} />
                  <input
                    name="envelope_id"
                    placeholder={t(
                      "console.finance.lienWaivers.detail.envelopePlaceholder",
                      undefined,
                      "DocuSign Envelope ID · Optional",
                    )}
                    className={`${INPUT} w-72 text-xs`}
                  />
                  <Button type="submit" size="sm">
                    {t("console.finance.lienWaivers.detail.markSent", undefined, "Mark Sent")}
                  </Button>
                </form>
              )}
              {(w.waiver_state === "drafted" || w.waiver_state === "sent") && (
                <form action={recordSignature} className="flex items-center gap-2">
                  <input type="hidden" name="waiver_id" value={w.id} />
                  <input
                    name="signer_name"
                    placeholder={t(
                      "console.finance.lienWaivers.detail.signerNamePlaceholder",
                      undefined,
                      "Signer name",
                    )}
                    required
                    className={`${INPUT} w-44 text-xs`}
                  />
                  <input
                    name="signer_title"
                    placeholder={t("console.finance.lienWaivers.detail.titlePlaceholder", undefined, "Title")}
                    className={`${INPUT} w-32 text-xs`}
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    {t("console.finance.lienWaivers.detail.recordSignature", undefined, "Record Signature")}
                  </Button>
                </form>
              )}
              {w.waiver_state === "signed" && (
                <form action={markReturned}>
                  <input type="hidden" name="waiver_id" value={w.id} />
                  <Button type="submit" size="sm" variant="secondary">
                    {t("console.finance.lienWaivers.detail.markReturned", undefined, "Mark Returned")}
                  </Button>
                </form>
              )}
              {w.waiver_state === "returned" && (
                <form action={releaseWaiver}>
                  <input type="hidden" name="waiver_id" value={w.id} />
                  <Button type="submit" size="sm">
                    {t(
                      "console.finance.lienWaivers.detail.releasePaymentCleared",
                      undefined,
                      "Release — Payment Cleared",
                    )}
                  </Button>
                </form>
              )}
              <form action={voidWaiver} className="flex items-center gap-2">
                <input type="hidden" name="waiver_id" value={w.id} />
                <input
                  name="reason"
                  placeholder={t("console.finance.lienWaivers.detail.voidReasonPlaceholder", undefined, "Void reason")}
                  className={`${INPUT} w-56 text-xs`}
                />
                <Button type="submit" size="sm" variant="ghost">
                  {t("console.finance.lienWaivers.detail.void", undefined, "Void")}
                </Button>
              </form>
            </div>
          </section>
        )}

        {w.notes && (
          <section className="surface space-y-2 p-4">
            <h2 className="text-sm font-semibold">
              {t("console.finance.lienWaivers.detail.notesHeading", undefined, "Notes")}
            </h2>
            <p className="text-xs whitespace-pre-wrap text-[var(--p-text-2)]">{w.notes}</p>
          </section>
        )}
      </div>
    </>
  );
}
