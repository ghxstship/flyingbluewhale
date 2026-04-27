import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateTrademark, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ markId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("trademarks", session.orgId, p.markId);
  if (!row) notFound();
  const action = updateTrademark.bind(null, p.markId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Trademark" title={`Edit ${row.mark}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/legal/ip/${p.markId}`} submitLabel="Save changes">
          <Input label="Mark" name="mark" defaultValue={row.mark} required maxLength={200} />
          <Input label="Jurisdiction" name="jurisdiction" defaultValue={row.jurisdiction ?? ""} maxLength={120} />
          <Input
            label="Registration #"
            name="registration_no"
            defaultValue={row.registration_no ?? ""}
            maxLength={120}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status} className="input-base focus-ring w-full">
              <option value="pending">pending</option>
              <option value="registered">registered</option>
              <option value="abandoned">abandoned</option>
              <option value="expired">expired</option>
            </select>
          </label>
          <Input label="Registered on" name="registered_on" type="date" defaultValue={dateOnly(row.registered_on)} />
          <Input label="Expires on" name="expires_on" type="date" defaultValue={dateOnly(row.expires_on)} />
        </FormShell>
      </div>
    </>
  );
}
