import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { OpenCallSubmitForm } from "./OpenCallSubmitForm";

export const dynamic = "force-dynamic";

type Call = {
  id: string;
  org_id: string;
  public_slug: string;
  title: string;
  deadline_at: string | null;
  status: string;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) return notFound();
  const supabase = await createClient();

  const { data } = await supabase
    .from("open_calls")
    .select("id, org_id, public_slug, title, deadline_at, status")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!data || data.status !== "published") return notFound();
  const call = data as Call;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Calls", href: "/marketplace/calls" },
          { label: call.title, href: `/marketplace/calls/${slug}` },
          { label: "Submit" },
        ]}
        className="mx-auto max-w-2xl px-6 pt-6"
      />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="hed-2xl mb-1">{call.title}</h1>
        {call.deadline_at && (
          <p className="mb-6 text-sm text-[var(--p-text-2)]">
            Deadline: {new Date(call.deadline_at).toLocaleDateString()}
          </p>
        )}
        <OpenCallSubmitForm
          openCallId={call.id}
          orgId={call.org_id}
          slug={slug}
        />
      </div>
    </>
  );
}
