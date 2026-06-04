import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { PLATFORM_ROLES } from "@/lib/supabase/types";
import { getRequestT } from "@/lib/i18n/request";
import { updatePerson, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ personId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("memberships")
    .select("id, role, is_developer, updated_at, users:users(id, name, email)")
    .eq("org_id", session.orgId)
    .eq("user_id", p.personId)
    .is("deleted_at", null)
    .maybeSingle();
  type Row = {
    id: string;
    role: string;
    is_developer: boolean;
    updated_at: string;
    users: { id: string; name: string | null; email: string } | null;
  };
  const typed = row as unknown as Row | null;
  if (!typed) notFound();
  const action = updatePerson.bind(null, p.personId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.edit.eyebrow", undefined, "Member")}
        title={t(
          "console.people.edit.title",
          {
            name: typed.users?.name ?? typed.users?.email ?? t("console.people.edit.fallbackName", undefined, "member"),
          },
          `Edit ${typed.users?.name ?? typed.users?.email ?? "member"}`,
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/people/${p.personId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={typed.updated_at} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.people.edit.platformRole", undefined, "Platform role")}
            </span>
            <select name="role" defaultValue={typed.role} required className="input-base focus-ring w-full">
              {PLATFORM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_developer" defaultChecked={typed.is_developer} className="mt-1 h-4 w-4" />
            <span>
              <span className="font-medium">{t("console.people.edit.developer", undefined, "Developer")}</span>
              <span className="block text-xs text-[var(--text-muted)]">
                {t(
                  "console.people.edit.developerHint",
                  undefined,
                  "Grants API keys, webhooks, and audit access. Orthogonal to platform role.",
                )}
              </span>
            </span>
          </label>
          <p className="text-xs text-[var(--text-muted)]">
            {t(
              "console.people.edit.profileHint",
              undefined,
              "Profile fields (name, email) are managed by the user. Project-level access is managed on each project.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
