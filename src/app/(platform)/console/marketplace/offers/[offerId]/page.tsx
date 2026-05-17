import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE } from "@/lib/marketplace";
import { OfferControls } from "./OfferControls";

export const dynamic = "force-dynamic";

type Flight = {
  type: "inbound" | "outbound";
  number: string;
  departs_at: string;
  arrives_at: string;
  origin: string;
  destination: string;
  notes?: string;
};

type Logistics = {
  flights?: Flight[];
  hotel?: {
    name?: string;
    address?: string;
    check_in?: string;
    check_out?: string;
    confirmation?: string;
    notes?: string;
  };
  ground?: string;
  dietary?: string;
  other?: string;
};

type Offer = {
  id: string;
  performance_date: string;
  fee_cents: number;
  currency: string;
  deposit_pct: number;
  balance_terms: string;
  status: string;
  talent_profile_id: string;
  project_id: string | null;
  slot_start: string | null;
  slot_end: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  contracted_at: string | null;
  logistics: Logistics | null;
  advance_doc_url: string | null;
};

export default async function Page({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_offers")
    .select("*")
    .eq("id", offerId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const o = data as Offer;

  const talentResp = await supabase
    .from("talent_profiles")
    .select("id, act_name, public_handle")
    .eq("id", o.talent_profile_id)
    .maybeSingle();
  const talent = talentResp.data as { id: string; act_name: string; public_handle: string | null } | null;

  const depositCents = Math.round(o.fee_cents * (o.deposit_pct / 100));
  const balanceCents = o.fee_cents - depositCents;

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace · Offer"
        title={talent?.act_name ?? "Offer"}
        subtitle={`${o.performance_date} · ${formatMoney(o.fee_cents)}`}
        action={<Badge variant={STATUS_TONE[o.status] ?? "muted"}>{o.status}</Badge>}
      />
      <div className="page-content space-y-5">
        <OfferControls offerId={o.id} status={o.status} />

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Terms</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">Fee</dt>
              <dd className="font-mono">{formatMoney(o.fee_cents)}</dd>
              <dt className="text-[var(--text-secondary)]">Deposit</dt>
              <dd className="font-mono">
                {o.deposit_pct}% · {formatMoney(depositCents)}
              </dd>
              <dt className="text-[var(--text-secondary)]">Balance</dt>
              <dd className="font-mono">
                {formatMoney(balanceCents)} on {o.balance_terms.replace("_", " ")}
              </dd>
              <dt className="text-[var(--text-secondary)]">Slot</dt>
              <dd>{o.slot_start ? `${new Date(o.slot_start).toLocaleString()}` : "—"}</dd>
              <dt className="text-[var(--text-secondary)]">Project</dt>
              <dd>{o.project_id ?? "—"}</dd>
            </dl>
          </div>
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Timeline</h2>
            <ul className="space-y-1.5 text-sm">
              <li>Created · {/* via created_at */} —</li>
              <li>Sent · {o.sent_at ? new Date(o.sent_at).toLocaleString() : "—"}</li>
              <li>Accepted · {o.accepted_at ? new Date(o.accepted_at).toLocaleString() : "—"}</li>
              <li>Contracted · {o.contracted_at ? new Date(o.contracted_at).toLocaleString() : "—"}</li>
            </ul>
          </div>
        </section>

        {/* Logistics — Gigwell artist advancing parity */}
        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Logistics</h2>
          {!o.logistics ? (
            <p className="text-sm text-[var(--text-muted)]">No logistics on file yet.</p>
          ) : (
            <div className="space-y-4 text-sm">
              {o.logistics.flights && o.logistics.flights.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">Flights</p>
                  <ul className="space-y-2">
                    {o.logistics.flights.map((f, i) => (
                      <li key={i} className="surface-inset rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{f.number}</span>
                          <span className="text-[var(--text-muted)] capitalize">{f.type}</span>
                        </div>
                        <p className="text-[var(--text-muted)]">{f.origin} → {f.destination}</p>
                        <p className="text-[var(--text-muted)]">
                          Departs {new Date(f.departs_at).toLocaleString()} · Arrives {new Date(f.arrives_at).toLocaleString()}
                        </p>
                        {f.notes && <p className="mt-1 text-[var(--text-muted)]">{f.notes}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {o.logistics.hotel && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">Hotel</p>
                  <div className="surface-inset rounded-lg px-3 py-2 space-y-1">
                    {o.logistics.hotel.name && <p className="font-medium">{o.logistics.hotel.name}</p>}
                    {o.logistics.hotel.address && <p className="text-[var(--text-muted)]">{o.logistics.hotel.address}</p>}
                    {(o.logistics.hotel.check_in || o.logistics.hotel.check_out) && (
                      <p className="text-[var(--text-muted)]">
                        {o.logistics.hotel.check_in && `Check-in: ${new Date(o.logistics.hotel.check_in).toLocaleDateString()}`}
                        {o.logistics.hotel.check_in && o.logistics.hotel.check_out && " · "}
                        {o.logistics.hotel.check_out && `Check-out: ${new Date(o.logistics.hotel.check_out).toLocaleDateString()}`}
                      </p>
                    )}
                    {o.logistics.hotel.confirmation && (
                      <p className="text-[var(--text-muted)]">Conf: {o.logistics.hotel.confirmation}</p>
                    )}
                    {o.logistics.hotel.notes && <p className="text-[var(--text-muted)]">{o.logistics.hotel.notes}</p>}
                  </div>
                </div>
              )}
              {o.logistics.ground && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Ground transport</p>
                  <p>{o.logistics.ground}</p>
                </div>
              )}
              {o.logistics.dietary && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Dietary</p>
                  <p>{o.logistics.dietary}</p>
                </div>
              )}
              {o.logistics.other && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Other notes</p>
                  <p>{o.logistics.other}</p>
                </div>
              )}
            </div>
          )}
          {o.advance_doc_url && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <a
                href={o.advance_doc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--org-primary)] hover:underline"
              >
                📄 Advancing document ↗
              </a>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
