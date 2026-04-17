import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (hasSupabase) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", url.origin), { status: 303 });
}
