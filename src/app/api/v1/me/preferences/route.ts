import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Read & write the calling user's preferences row.
 * SSOT: user_preferences table; RLS scoped via user_id = auth.uid().
 */

const PatchSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  density: z.enum(["comfortable", "compact"]).optional(),
  locale: z.string().min(2).max(8).optional(),
  timezone: z.string().min(1).max(64).optional(),
  consent: z.record(z.string(), z.boolean()).optional(),
  table_views: z.record(z.string(), z.unknown()).optional(),
  last_org_id: z.string().uuid().nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in required");

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", u.user.id)
    .maybeSingle();

  if (error) return apiError("internal", error.message);
  return NextResponse.json({ ok: true, data: data ?? null });
}

export async function PATCH(req: NextRequest) {
  const parsed = await parseJson(req, PatchSchema);
  if (parsed instanceof NextResponse) return parsed;

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in required");

  // Upsert pattern — preferences row may not exist yet
  const { data: existing } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", u.user.id)
    .maybeSingle();

  // Coerce unknown-typed json fields to Json for supabase types
  const patch: Record<string, unknown> = { ...parsed };
  if (parsed.consent) patch.consent = parsed.consent as Json;
  if (parsed.table_views) patch.table_views = parsed.table_views as Json;

  if (existing) {
    const { data, error } = await (supabase.from("user_preferences") as unknown as {
      update: (p: Record<string, unknown>) => ReturnType<typeof supabase.from>;
    })
      .update(patch)
      .eq("user_id", u.user.id)
      .select()
      .single();
    if (error) return apiError("internal", error.message);
    return NextResponse.json({ ok: true, data });
  } else {
    const { data, error } = await (supabase.from("user_preferences") as unknown as {
      insert: (p: Record<string, unknown>) => ReturnType<typeof supabase.from>;
    })
      .insert({ user_id: u.user.id, ...patch })
      .select()
      .single();
    if (error) return apiError("internal", error.message);
    return NextResponse.json({ ok: true, data });
  }
}
