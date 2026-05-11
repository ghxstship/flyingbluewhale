import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updateAnnouncement } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, audience, pinned, publish_state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const a = data as {
    id: string;
    title: string;
    body: string;
    audience: string;
    pinned: boolean;
    publish_state: string;
  };

  return (
    <>
      <ModuleHeader eyebrow="Announcement" title={`Edit · ${a.title}`} />
      <div className="page-content max-w-2xl">
        <FormShell action={updateAnnouncement} cancelHref={`/console/comms/announcements/${a.id}`} submitLabel="Save">
          <input type="hidden" name="id" value={a.id} />
          <Input label="Title" name="title" required maxLength={200} defaultValue={a.title} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Body</label>
            <textarea
              name="body"
              rows={6}
              required
              maxLength={8000}
              defaultValue={a.body}
              className="input-base mt-1.5 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Audience</label>
            <select name="audience" className="input-base mt-1.5 w-full" defaultValue={a.audience}>
              <option value="all">All</option>
              <option value="crew">Crew</option>
              <option value="contractors">Contractors</option>
              <option value="vendors">Vendors</option>
              <option value="admins">Admins</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="pinned" defaultChecked={a.pinned} /> Pin to top of feed
          </label>
        </FormShell>
      </div>
    </>
  );
}
