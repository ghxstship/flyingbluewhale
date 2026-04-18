import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
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
  return NextResponse.json({ ok: true, data: { credentials: data ?? [] } });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("bad_request", "id required");

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in required");

  const { error } = await supabase
    .from("user_passkeys")
    .delete()
    .eq("id", id)
    .eq("user_id", u.user.id);

  if (error) return apiError("internal", error.message);
  return NextResponse.json({ ok: true });
}
