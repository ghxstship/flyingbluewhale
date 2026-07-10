import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { InquirePanel } from "../../../_inquire/InquirePanel";

import type { Metadata } from "next";

// E-23: user-specific form surface — explicit noindex.
export const metadata: Metadata = {
  title: "Vendor Inquiry",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_vendor_directory")
    .select("id, name")
    .eq("public_handle", handle)
    .maybeSingle();
  return (
    <InquirePanel
      kind="vendor"
      handle={handle}
      userId={session.userId}
      subject={data?.id && data.name ? { id: data.id, name: data.name } : null}
    />
  );
}
