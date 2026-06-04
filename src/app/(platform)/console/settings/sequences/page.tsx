import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatSequencePreview } from "@/lib/sequences";
import { resetSequence, upsertSequence } from "./actions";

export const dynamic = "force-dynamic";

// org_sequences PK is (org_id, scope) — no surrogate id. Synthesize one
// per row so DataTable can key on it; scope is unique within the org's
// view so it serves cleanly as the stable identity.
type Row = {
  id: string;
  org_id: string;
  scope: string;
  current_val: number;
  format: string;
  updated_at: string;
};

// Common scope names operators expect to see pre-seeded — surface them
// even when no row exists yet so the page doubles as a "what can I
// number?" reference. New scopes get inserted on first nextSequence()
// call (RPC creates the row), so an empty list is normal on day-one.
const SCOPE_HINTS: Array<{ scope: string; label: string; suggested: string }> = [
  { scope: "invoice", label: "Invoices", suggested: "INV-{YYYY}-{seq:04}" },
  { scope: "purchase_order", label: "Purchase Orders", suggested: "PO-{YYYY}-{seq:04}" },
  { scope: "proposal", label: "Proposals", suggested: "{ORG}-PROP-{YYYY}-{seq:04}" },
  { scope: "rfq", label: "RFQs", suggested: "RFQ-{YYYY}-{seq:04}" },
  { scope: "requisition", label: "Requisitions", suggested: "REQ-{YYYY}-{seq:04}" },
  { scope: "po_change_order", label: "PO Change Orders", suggested: "CO-{seq:04}" },
];

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Auto-Number Sequences" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: rows }, { data: org }] = await Promise.all([
    supabase
      .from("org_sequences")
      .select("org_id, scope, current_val, format, updated_at")
      .eq("org_id", session.orgId)
      .order("scope", { ascending: true }),
    supabase.from("orgs").select("slug").eq("id", session.orgId).maybeSingle(),
  ]);
  const existing = ((rows ?? []) as Array<Omit<Row, "id">>).map((r) => ({ ...r, id: r.scope }));
  const orgSlug = ((org as { slug: string | null } | null)?.slug ?? "org").toUpperCase();
  const scopesInUse = new Set(existing.map((r) => r.scope));
  const unconfiguredHints = SCOPE_HINTS.filter((h) => !scopesInUse.has(h.scope));

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Auto-Number Sequences"
        subtitle={`${existing.length} active sequence${existing.length === 1 ? "" : "s"} · format strings drive every invoice / PO / proposal identifier`}
        breadcrumbs={[{ label: "Settings", href: "/console/settings" }, { label: "Sequences" }]}
      />
      <div className="page-content space-y-5">
        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Active Sequences</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Each scope is a monotonic counter scoped to your org. The format string is templated when{" "}
            <code className="font-mono">nextSequence()</code> fires — tokens:{" "}
            <code className="font-mono">{"{seq}"}</code>, <code className="font-mono">{"{seq:N}"}</code>,{" "}
            <code className="font-mono">{"{YYYY}"}</code>, <code className="font-mono">{"{YY}"}</code>,{" "}
            <code className="font-mono">{"{MM}"}</code>, <code className="font-mono">{"{DD}"}</code>,{" "}
            <code className="font-mono">{"{ORG}"}</code>.
          </p>
          <DataTable<Row>
            rows={existing}
            emptyLabel="No sequences allocated yet"
            emptyDescription="A row appears the first time something asks for a number (invoice creation, PO submit, etc.). You can pre-seed any of the suggested scopes below to lock the format in advance."
            columns={[
              { key: "scope", header: "Scope", render: (r) => <code className="font-mono text-xs">{r.scope}</code> },
              {
                key: "format",
                header: "Format",
                render: (r) => <code className="font-mono text-xs">{r.format}</code>,
              },
              {
                key: "current_val",
                header: "Current",
                render: (r) => <span className="font-mono text-xs">{r.current_val.toLocaleString()}</span>,
                accessor: (r) => r.current_val,
              },
              {
                key: "next",
                header: "Next identifier",
                render: (r) => (
                  <span className="font-mono text-xs">
                    {formatSequencePreview(r.format, { seq: r.current_val + 1, orgSlug })}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <DeleteForm
                    action={resetSequence.bind(null, r.scope)}
                    label="Reset"
                    title="Reset sequence"
                    confirm={`Reset "${r.scope}" counter to 0? Future identifiers restart from the beginning of the format.`}
                  />
                ),
              },
            ]}
          />
        </section>

        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Edit / Pre-Seed</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Upsert a scope — set its format and (optionally) jump the counter forward to align with a legacy numbering
            scheme.
          </p>
          <form
            action={upsertSequence}
            className="surface-inset mt-3 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-6"
          >
            <input
              name="scope"
              required
              maxLength={64}
              placeholder="invoice"
              pattern="[a-z0-9_]+"
              title="Lowercase letters, digits, underscore"
              className="input-base sm:col-span-2"
            />
            <input
              name="format"
              required
              maxLength={128}
              placeholder="INV-{YYYY}-{seq:04}"
              defaultValue="{seq:04}"
              className="input-base sm:col-span-3"
            />
            <input
              name="seed_val"
              type="number"
              min="0"
              max="9999999999"
              placeholder="Seed"
              className="input-base sm:col-span-1"
            />
            <div className="flex justify-end sm:col-span-6">
              <Button type="submit" size="sm" variant="secondary">
                Save Sequence
              </Button>
            </div>
          </form>
        </section>

        {unconfiguredHints.length > 0 && (
          <section className="surface p-5">
            <h2 className="text-sm font-semibold">Suggested Scopes</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Common identifier scopes not yet configured. Pre-seeding now locks the format so the first
              invoice/PO/proposal numbers don&rsquo;t come out as bare <code className="font-mono">0001</code>.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {unconfiguredHints.map((h) => (
                <li key={h.scope} className="surface-inset flex items-center justify-between gap-3 rounded-md p-3">
                  <div>
                    <div className="text-sm font-semibold">{h.label}</div>
                    <code className="font-mono text-xs text-[var(--text-muted)]">{h.suggested}</code>
                  </div>
                  <form action={upsertSequence}>
                    <input type="hidden" name="scope" value={h.scope} />
                    <input type="hidden" name="format" value={h.suggested} />
                    <Button type="submit" variant="secondary" size="sm">
                      <Badge variant="muted">{h.scope}</Badge>
                      <span className="ms-2">Pre-seed</span>
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
