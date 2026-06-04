import { redirect } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createKudosFromConsole } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Desktop kudos composer. Mirrors the mobile /m/kudos quick-give surface
 * but with a typed Recipient picker so admins giving recognition from the
 * console don't have to know UUIDs. Same `recognition_posts` table; same
 * push notification fan-out via the shared action.
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.recognition.new.eyebrow", undefined, "Workforce · Recognition")}
          title={t("console.workforce.recognition.new.title", undefined, "Give Kudos")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.recognition.new.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.workforce.recognition.new.eyebrow", undefined, "Workforce · Recognition")}
        title={t("console.workforce.recognition.new.title", undefined, "Give Kudos")}
        subtitle={t("console.workforce.recognition.new.subtitle", undefined, "Send a recognition post.")}
        breadcrumbs={[
          { label: t("console.workforce.recognition.new.crumbWorkforce", undefined, "Workforce"), href: "/console" },
          {
            label: t("console.workforce.recognition.new.crumbRecognition", undefined, "Recognition"),
            href: "/console/workforce/recognition",
          },
          { label: t("console.workforce.recognition.new.crumbGiveKudos", undefined, "Give Kudos") },
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
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.workforce.recognition.new.recipientLabel", undefined, "Recipient")}
            </span>
            <select name="to_user_id" required className="input-base focus-ring w-full" defaultValue="">
              <option value="" disabled>
                {t("console.workforce.recognition.new.pickTeammate", undefined, "— Pick A Teammate —")}
              </option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.workforce.recognition.new.messageLabel", undefined, "Message")}
            </span>
            <textarea
              name="message"
              required
              maxLength={500}
              rows={4}
              placeholder={t(
                "console.workforce.recognition.new.messagePlaceholder",
                undefined,
                "Specifically, what did they do that mattered?",
              )}
              className="input-base focus-ring w-full"
            />
          </label>
          <Input
            label={t("console.workforce.recognition.new.valueTagLabel", undefined, "Value Tag (Optional)")}
            name="value_tag"
            maxLength={40}
            placeholder={t(
              "console.workforce.recognition.new.valueTagPlaceholder",
              undefined,
              "e.g. craftsmanship, hustle",
            )}
          />
          <div className="flex justify-end gap-2">
            <Button href="/console/workforce/recognition" variant="ghost">
              {t("console.workforce.recognition.new.cancel", undefined, "Cancel")}
            </Button>
            <Button type="submit">{t("console.workforce.recognition.new.submit", undefined, "Send Kudos")}</Button>
          </div>
        </form>
      </div>
    </>
  );
}
