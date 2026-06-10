"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RFQ_VISIBILITIES, slugify } from "@/lib/marketplace";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  rfq_id: z.string().uuid(),
  visibility: z.enum(RFQ_VISIBILITIES),
  trade_categories: z.string().max(400).optional().or(z.literal("")),
  region: z.string().max(80).optional().or(z.literal("")),
  budget_band: z.string().max(80).optional().or(z.literal("")),
  due_at: z.string().optional().or(z.literal("")),
  requires_prequalification: z.string().optional(),
  requires_insurance: z.string().optional(),
  requires_w9: z.string().optional(),
  nda_required: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const toArray = (v: string | undefined): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function publishRfqAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // RFQ visibility flip → public mints the public_slug + lands on the
  // public marketplace surface. Manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can publish RFQs" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Fetch the RFQ to slug from title
  const rfqResp = await supabase
    .from("rfqs")
    .select("id, title, public_slug, visibility, rfq_state")
    .eq("id", parsed.data.rfq_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!rfqResp.data) return { error: "RFQ not found" };
  const rfq = rfqResp.data as {
    id: string;
    title: string;
    public_slug: string | null;
    visibility: string;
    rfq_state: string;
  };

  // Slug is sticky once minted — flipping visibility back and forth must
  // not regenerate it, or every previously-shared permalink dies.
  const publicSlug = rfq.public_slug ?? `${slugify(rfq.title)}-${Math.random().toString(36).slice(2, 7)}`;

  const { error } = await supabase
    .from("rfqs")
    .update({
      visibility: parsed.data.visibility,
      public_slug: publicSlug,
      trade_categories: toArray(parsed.data.trade_categories),
      region: parsed.data.region || null,
      budget_band: parsed.data.budget_band || null,
      due_at: parsed.data.due_at || null,
      requires_prequalification: parsed.data.requires_prequalification === "on",
      requires_insurance: parsed.data.requires_insurance === "on",
      requires_w9: parsed.data.requires_w9 === "on",
      nda_required: parsed.data.nda_required === "on",
      rfq_state: parsed.data.visibility === "private" ? rfq.rfq_state : "sent",
      published_at:
        parsed.data.visibility === "private" ? null : rfq.rfq_state === "sent" ? undefined : new Date().toISOString(),
    })
    .eq("id", parsed.data.rfq_id)
    .eq("org_id", session.orgId);

  if (error) return { error: error.message };
  revalidatePath("/console/procurement/rfqs");
  revalidatePath(`/console/procurement/rfqs/${parsed.data.rfq_id}`);
  redirect(`/console/procurement/rfqs/${parsed.data.rfq_id}`);
}
