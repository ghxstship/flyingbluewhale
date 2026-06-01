import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

/**
 * GET  /api/v1/marketplace/offers/[offerId]/contract — fetch existing contract
 * POST /api/v1/marketplace/offers/[offerId]/contract — generate from template
 *
 * Mirrors Gigwell's one-click contract + rider builder.
 * The rendered_markdown is a template merge of the contract body with
 * offer-specific values (fee, deposit, dates, artist name).
 */

const PostSchema = z.object({
  template_id: z.string().uuid().optional(),
});

type OfferRow = {
  id: string;
  fee_cents: number;
  currency: string;
  deposit_pct: number;
  balance_terms: string;
  performance_date: string;
  slot_start: string | null;
  slot_end: string | null;
  org_id: string;
};

type TemplateRow = {
  id: string;
  name: string;
  body_markdown: string;
  rider_sections: RiderSection[];
  deposit_pct: number;
};

type RiderSection = {
  title: string;
  content: string;
};

function renderContract(template: TemplateRow, offer: OfferRow): string {
  const feeDollars = (offer.fee_cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: offer.currency,
  });
  const depositAmount = (offer.fee_cents * offer.deposit_pct / 10000).toLocaleString("en-US", {
    style: "currency",
    currency: offer.currency,
  });

  let body = template.body_markdown
    .replace(/\{\{fee\}\}/g, feeDollars)
    .replace(/\{\{deposit_pct\}\}/g, `${offer.deposit_pct}%`)
    .replace(/\{\{deposit_amount\}\}/g, depositAmount)
    .replace(/\{\{performance_date\}\}/g, offer.performance_date)
    .replace(/\{\{balance_terms\}\}/g, offer.balance_terms.replace(/_/g, " "))
    .replace(/\{\{slot_start\}\}/g, offer.slot_start ?? "TBD")
    .replace(/\{\{slot_end\}\}/g, offer.slot_end ?? "TBD");

  if (template.rider_sections.length > 0) {
    body += "\n\n---\n\n## Rider\n\n";
    body += template.rider_sections
      .map((s: RiderSection) => `### ${s.title}\n\n${s.content}`)
      .join("\n\n");
  }

  return body;
}

export async function GET(req: Request, { params }: { params: Promise<{ offerId: string }> }) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase not configured");
  const { offerId } = await params;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  const { data } = await supabase
    .from("offer_contracts")
    .select("*")
    .eq("offer_id", offerId)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return apiError("not_found", "No contract for this offer yet");
  return apiOk({ contract: data });
}

export async function POST(req: Request, { params }: { params: Promise<{ offerId: string }> }) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase not configured");
  const { offerId } = await params;

  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("talent_offers")
    .select("id, fee_cents, currency, deposit_pct, balance_terms, performance_date, slot_start, slot_end, org_id")
    .eq("id", offerId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!offer) return apiError("not_found", "Offer not found");

  let templateQuery = supabase
    .from("contract_templates")
    .select("id, name, body_markdown, rider_sections, deposit_pct")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);

  if (input.template_id) {
    templateQuery = templateQuery.eq("id", input.template_id);
  } else {
    templateQuery = templateQuery.eq("is_default", true);
  }

  const { data: template } = await templateQuery.maybeSingle();

  const rendered = template
    ? renderContract(template as TemplateRow, offer as OfferRow)
    : `# Performance Agreement\n\nFee: {{fee}}\nDeposit: {{deposit_pct}} due upon signing.\nPerformance date: {{performance_date}}\n\n*No template configured. Visit /console/settings/contracts to create one.*`
        .replace(/\{\{fee\}\}/g, `${(offer.fee_cents / 100).toFixed(2)} ${offer.currency}`)
        .replace(/\{\{deposit_pct\}\}/g, `${offer.deposit_pct}%`)
        .replace(/\{\{performance_date\}\}/g, offer.performance_date);

  const { data: contract, error } = await supabase
    .from("offer_contracts")
    .insert({
      org_id: session.orgId,
      offer_id: offerId,
      template_id: template?.id ?? null,
      rendered_markdown: rendered,
    })
    .select()
    .single();

  if (error) return apiError("internal", error.message);
  return apiCreated({ contract });
}
