import { redirect } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createKudosFromConsole } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Desktop kudos composer. Mirrors the mobile /m/kudos quick-give surface
 * but with a typed Recipient picker so admins giving recognition from the
 * console don't have to know UUIDs. Same `recognition_posts` table; same
 * push notification fan-out via the shared action.
 */
export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce · Recognition" title="Give Kudos" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // All active members of the caller's org — same RLS gate as the action.
  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, users(id, email, name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .neq("user_id", session.userId);

  type Row = { user_id: string; users: { id: string; email: string; name: string | null } | null };
  const recipients = ((members ?? []) as unknown as Row[])
    .map((r) => ({ id: r.user_id, label: r.users?.name ?? r.users?.email ?? r.user_id }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce · Recognition"
        title="Give Kudos"
        subtitle="Send a recognition post."
        breadcrumbs={[
          { label: "Workforce", href: "/console" },
          { label: "Recognition", href: "/console/workforce/recognition" },
          { label: "Give Kudos" },
        ]}
      />
      <div className="page-content max-w-xl">
        <form
          action={async (fd: FormData) => {
            "use server";
            await createKudosFromConsole(fd);
            redirect("/console/workforce/recognition");
          }}
          className="surface space-y-4 p-6"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Recipient</span>
            <select name="to_user_id" required className="input-base focus-ring w-full" defaultValue="">
              <option value="" disabled>
                — Pick A Teammate —
              </option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Message</span>
            <textarea
              name="message"
              required
              maxLength={500}
              rows={4}
              placeholder="Specifically, what did they do that mattered?"
              className="input-base focus-ring w-full"
            />
          </label>
          <Input
            label="Value Tag (Optional)"
            name="value_tag"
            maxLength={40}
            placeholder="e.g. craftsmanship, hustle"
          />
          <div className="flex justify-end gap-2">
            <Button href="/console/workforce/recognition" variant="ghost">
              Cancel
            </Button>
            <Button type="submit">Send Kudos</Button>
          </div>
        </form>
      </div>
    </>
  );
}
