import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { updateCallAction } from "./actions";

type Call = {
  id: string;
  title: string;
  kind: string;
  description: string | null;
  genre_tags: string[];
  trade_categories: string[];
  region: string | null;
  venue_type: string | null;
  performance_date: string | null;
  slot_length_min: number | null;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  deadline_at: string | null;
};

const dollars = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(0));

export default async function Page({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("open_calls")
    .select("*")
    .eq("id", callId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const c = data as Call;

  return (
    <>
      <ModuleHeader eyebrow="Marketplace · Call" title={`Edit · ${c.title}`} />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateCallAction}
          cancelHref={`/console/marketplace/calls/${c.id}`}
          submitLabel="Save Changes"
        >
          <input type="hidden" name="call_id" value={c.id} />
          <Input label="Title" name="title" required maxLength={200} defaultValue={c.title} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" className="input-base mt-1.5 w-full" defaultValue={c.kind}>
              <option value="talent_call">Talent Call</option>
              <option value="audition">Audition</option>
              <option value="gig">Gig</option>
              <option value="rfq">Public RFQ</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={6}
              maxLength={8000}
              className="input-base mt-1.5 w-full"
              defaultValue={c.description ?? ""}
            />
          </div>
          <Input label="Genre Tags" name="genre_tags" defaultValue={c.genre_tags.join(", ")} />
          <Input label="Trade Categories" name="trade_categories" defaultValue={c.trade_categories.join(", ")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Region" name="region" maxLength={80} defaultValue={c.region ?? ""} />
            <Input label="Venue Type" name="venue_type" maxLength={80} defaultValue={c.venue_type ?? ""} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Performance Date"
              name="performance_date"
              type="date"
              defaultValue={c.performance_date ?? ""}
            />
            <Input label="Slot (min)" name="slot_length_min" type="number" defaultValue={c.slot_length_min ?? ""} />
            <Input
              label="Deadline"
              name="deadline_at"
              type="datetime-local"
              defaultValue={c.deadline_at ? c.deadline_at.slice(0, 16) : ""}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Fee Min" name="fee_min" defaultValue={dollars(c.fee_min_cents)} />
            <Input label="Fee Max" name="fee_max" defaultValue={dollars(c.fee_max_cents)} />
            <Input label="Currency" name="currency" maxLength={3} defaultValue={c.currency} />
          </div>
        </FormShell>
      </div>
    </>
  );
}
