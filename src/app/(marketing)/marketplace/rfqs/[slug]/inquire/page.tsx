import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { InquirePanel } from "../../../_inquire/InquirePanel";

import type { Metadata } from "next";

// E-23: user-specific form surface — explicit noindex.
export const metadata: Metadata = {
  title: "RFQ Inquiry",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_rfq_marketplace")
    .select("id, title")
    .eq("public_slug", slug)
    .maybeSingle();
  return (
    <InquirePanel
      kind="rfq"
      handle={slug}
      userId={session.userId}
      subject={data?.id && data.title ? { id: data.id, name: data.title } : null}
    />
  );
}
