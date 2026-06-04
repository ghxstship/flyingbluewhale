export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { EmailTemplatesPanel } from "./EmailTemplatesPanel";

/** Email template catalog — Opportunity #21 UI surface. */

export default async function EmailTemplatesPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("email_templates")
    .select("id, slug, name, subject, is_active, updated_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("slug", { ascending: true });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.emailTemplates.eyebrow", undefined, "Settings")}
        title={t("console.settings.emailTemplates.title", undefined, "Email Templates")}
        subtitle={t("console.settings.emailTemplates.subtitle", undefined, "Transactional email shapes.")}
      />
      <div className="page-content max-w-5xl">
        <EmailTemplatesPanel initial={templates ?? []} />
      </div>
    </>
  );
}
