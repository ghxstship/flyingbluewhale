import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in required");

  const { data, error } = await supabase
    .from("user_passkeys")
    .select("id, device_name, last_used_at, created_at")
    .eq("user_id", u.user.id)
    .order("created_at", { ascending: false });

  if (error) return apiError("internal", error.message);
  return apiOk({ credentials: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return apiError("bad_request", "id must be a valid UUID");

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in required");

  const { error } = await supabase
    .from("user_passkeys")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", u.user.id);

  if (error) return apiError("internal", error.message);
  return apiOk({ deleted: true });
}
