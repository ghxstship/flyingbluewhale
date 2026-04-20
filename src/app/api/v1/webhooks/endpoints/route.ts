import { type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/v1/webhooks/endpoints — outbound webhook registrations.
 * Resolves audit B2. GET lists, POST registers a new endpoint with a
 * freshly-minted HMAC secret (returned once; never re-exposed).
 */

const EVENTS = [
  "project.created", "project.status_changed",
  "invoice.sent", "invoice.paid",
  "proposal.sent", "proposal.signed",
  "deliverable.submitted", "deliverable.approved",
  "ticket.scanned",
  "po.acknowledged", "po.fulfilled",
  "incident.filed",
  "job.failed",
  "passkey.registered",
  "account.deletion_requested",
  "*",
] as const;

const PostSchema = z.object({
  url: z.string().url().startsWith("https://", "Use HTTPS (production). For local dev, register via SQL."),
  description: z.string().max(200).optional(),
  events: z.array(z.enum(EVENTS)).min(1).max(EVENTS.length),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .select("id, url, description, events, is_active, last_delivery_at, last_error, failure_count, created_at")
      .eq("org_id", session.orgId ?? "")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) return apiError("internal", error.message);
    return apiOk({ endpoints: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const secret = `whsec_${randomBytes(32).toString("base64url")}`;
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        org_id: session.orgId,
        url: input.url,
        description: input.description ?? null,
        events: input.events as unknown as string[],
        secret,
        created_by: session.userId,
      })
      .select("id, url, description, events, is_active, created_at")
      .single();
    if (error) return apiError("internal", error.message);
    // Secret returned ONCE at creation. The GET list never exposes it.
    return apiCreated({ endpoint: data, secret });
  });
}
