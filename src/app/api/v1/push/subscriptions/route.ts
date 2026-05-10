import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, apiCreated, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validateOutboundUrl } from "@/lib/http-ssrf";

/**
 * Web Push subscription registration (Phase 2.3).
 *
 * GET    — list active subscriptions for the calling user.
 * POST   — upsert by endpoint. The browser may re-issue the same endpoint
 *          across reloads; we update keys + last_seen_at instead of inserting
 *          a duplicate. Re-subscribing also clears `disabled_at`.
 * DELETE — soft-deletes a single subscription by endpoint or by id.
 */

const PostSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(512).optional(),
});

const DeleteSchema = z.object({
  endpoint: z.string().url().optional(),
  id: z.string().uuid().optional(),
});

type SubsClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        is: (
          col: string,
          val: null,
        ) => {
          order: (
            col: string,
            opts: { ascending: boolean },
          ) => Promise<{
            data: Array<Record<string, unknown>> | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    upsert: (
      row: Record<string, unknown>,
      opts: { onConflict: string },
    ) => {
      select: (cols: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
    delete: () => {
      eq: (
        col: string,
        val: string,
      ) => {
        eq: (
          col: string,
          val: string,
        ) => {
          select: (cols: string) => Promise<{
            data: Array<{ id: string }> | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

export async function GET() {
  return withAuth(async (session) => {
    const supabase = (await createClient()) as unknown as SubsClient;
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, user_agent, created_at, last_seen_at")
      .eq("user_id", session.userId)
      .is("disabled_at", null)
      .order("last_seen_at", { ascending: false });
    if (error) return apiError("internal", error.message);
    return apiOk({ subscriptions: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  // SSRF guard at the registration boundary. Browser-issued push
  // endpoints always resolve to public push services (Google FCM,
  // Mozilla autopush, Microsoft WNS); a request for an endpoint that
  // resolves to RFC1918 / loopback / link-local is either a fake
  // subscription or a probe to make the server fetch internal hosts
  // when notify() fans out. Reject upstream so webpush never reaches it.
  const ssrf = await validateOutboundUrl(input.endpoint);
  if (!ssrf.ok) return apiError("bad_request", `endpoint rejected: ${ssrf.reason}`);
  return withAuth(async (session) => {
    const supabase = (await createClient()) as unknown as SubsClient;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: session.userId,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          user_agent: input.userAgent ?? null,
          last_seen_at: now,
          failure_count: 0,
          disabled_at: null,
        },
        { onConflict: "endpoint" },
      )
      .select("id, endpoint, user_agent, created_at, last_seen_at")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ subscription: data });
  });
}

export async function DELETE(req: NextRequest) {
  let body: z.infer<typeof DeleteSchema>;
  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = DeleteSchema.safeParse(raw);
    if (!parsed.success) return apiError("bad_request", "Pass `endpoint` or `id`.");
    body = parsed.data;
  } catch {
    return apiError("bad_request", "Invalid JSON body");
  }
  if (!body.endpoint && !body.id) {
    return apiError("bad_request", "Pass `endpoint` or `id`.");
  }
  return withAuth(async (session) => {
    const supabase = (await createClient()) as unknown as SubsClient;
    // Belt + suspenders: RLS already scopes delete to the calling user,
    // but we also pin user_id explicitly so a future RLS regression
    // (or service-role caller importing this surface) can't delete
    // another user's subscription. The .select() also lets us 404 on
    // a wrong/foreign id instead of silently returning deleted:true.
    const col = body.id ? "id" : "endpoint";
    const val = body.id ?? body.endpoint!;
    const { data, error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq(col, val)
      .eq("user_id", session.userId)
      .select("id");
    if (error) return apiError("internal", error.message);
    if (!data || data.length === 0) {
      return apiError("not_found", "Subscription not found");
    }
    return apiOk({ deleted: true });
  });
}
