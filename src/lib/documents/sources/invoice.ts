import "server-only";
import type { createClient } from "@/lib/supabase/server";

/**
 * Single source of truth for loading an invoice as a client-facing artifact.
 *
 * Two render pipelines consume an invoice record: the kit documents engine
 * (HTML `.doc` via resolvers.ts → `/api/v1/documents/invoice`) and the react-pdf
 * binary renderer (`src/lib/pdf/invoice` → `/api/v1/invoices/{id}/pdf`). Both
 * previously queried `invoices` + line items + client/org/project branding
 * independently, so the two artifacts could silently drift (different columns,
 * different row ordering, different brand inputs). This loader is the one place
 * that fetch lives; each pipeline shapes the same rows for its own renderer.
 *
 * `server-only` + org-scoped (RLS is the real boundary; the `org_id` filter is
 * defense-in-depth, matching the rest of the documents layer).
 */

type DB = Awaited<ReturnType<typeof createClient>>;

export type InvoiceArtifact = {
  invoice: {
    id: string;
    org_id: string;
    project_id: string | null;
    client_id: string | null;
    number: string;
    title: string | null;
    currency: string | null;
    amount_cents: number | string | null;
    invoice_state: string | null;
    issued_at: string | null;
    due_at: string | null;
    paid_at: string | null;
    stripe_payment_intent: string | null;
    notes: string | null;
  };
  lineItems: { description: string; quantity: number | string; unit_price_cents: number | string; position: number | null }[];
  org: { name: string | null; name_override: string | null; logo_url: string | null; branding: unknown; support_email: string | null } | null;
  client: { name: string | null; contact_email: string | null; branding: unknown; logo_url: string | null } | null;
  project: { branding: unknown } | null;
};

export async function loadInvoiceArtifact(db: DB, orgId: string, invoiceId: string): Promise<InvoiceArtifact | null> {
  const { data: invoice } = await db
    .from("invoices")
    .select(
      "id, org_id, project_id, client_id, number, title, currency, amount_cents, invoice_state, issued_at, due_at, paid_at, stripe_payment_intent, notes",
    )
    .eq("id", invoiceId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!invoice) return null;

  const [{ data: lineItems }, { data: org }, { data: client }, { data: project }] = await Promise.all([
    db
      .from("invoice_line_items")
      .select("description, quantity, unit_price_cents, position")
      .eq("invoice_id", invoiceId)
      .order("position", { ascending: true }),
    db.from("orgs").select("name, name_override, logo_url, branding, support_email").eq("id", orgId).maybeSingle(),
    invoice.client_id
      ? db.from("clients").select("name, contact_email, branding, logo_url").eq("id", invoice.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
    invoice.project_id
      ? db.from("projects").select("branding").eq("id", invoice.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return { invoice, lineItems: lineItems ?? [], org: org ?? null, client: client ?? null, project: project ?? null };
}
