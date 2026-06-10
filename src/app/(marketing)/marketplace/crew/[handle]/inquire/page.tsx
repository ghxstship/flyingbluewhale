import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { InquirePanel } from "../../../_inquire/InquirePanel";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_crew_directory")
    .select("id, name")
    .eq("public_handle", handle)
    .maybeSingle();
  return (
    <InquirePanel
      kind="crew"
      handle={handle}
      userId={session.userId}
      subject={data?.id && data.name ? { id: data.id, name: data.name } : null}
    />
  );
}
