export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createEventTypeAction } from "./actions";

export default async function NewEventTypePage() {
  await requireSession();
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.scheduler.eyebrow", undefined, "Operations")}
        title={t("console.scheduler.new.title", undefined, "New Event Type")}
        subtitle={t(
          "console.scheduler.new.subtitle",
          undefined,
          "Duration, buffers, minimum notice, daily cap. Weekday availability seeds Monday to Friday, 09:00 to 17:00.",
        )}
        breadcrumbs={[
          { label: t("console.scheduler.title", undefined, "Scheduler"), href: "/studio/scheduler" },
          { label: t("console.scheduler.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createEventTypeAction}
          submitLabel={t("console.scheduler.new.submit", undefined, "Create Event Type")}
          cancelHref="/studio/scheduler"
        >
          <Input name="name" label={t("console.scheduler.new.name", undefined, "Name")} required />
          <Input name="description" label={t("console.scheduler.new.description", undefined, "Description")} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              name="duration_minutes"
              type="number"
              defaultValue={30}
              min={5}
              max={480}
              label={t("console.scheduler.new.duration", undefined, "Duration (minutes)")}
              required
            />
            <Input
              name="min_notice_minutes"
              type="number"
              defaultValue={240}
              min={0}
              label={t("console.scheduler.new.minNotice", undefined, "Minimum Notice (minutes)")}
            />
            <Input
              name="buffer_before_minutes"
              type="number"
              defaultValue={0}
              min={0}
              label={t("console.scheduler.new.bufferBefore", undefined, "Buffer Before (minutes)")}
            />
            <Input
              name="buffer_after_minutes"
              type="number"
              defaultValue={0}
              min={0}
              label={t("console.scheduler.new.bufferAfter", undefined, "Buffer After (minutes)")}
            />
            <Input
              name="max_per_day"
              type="number"
              min={1}
              max={48}
              label={t("console.scheduler.new.maxPerDay", undefined, "Daily Cap")}
            />
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                {t("console.scheduler.new.location", undefined, "Location")}
              </span>
              <select name="location_kind" className="ps-input" defaultValue="call">
                <option value="call">{t("console.scheduler.locationCall", undefined, "Call")}</option>
                <option value="on_site">{t("console.scheduler.locationOnSite", undefined, "On Site")}</option>
              </select>
            </label>
            <Input
              name="timezone"
              defaultValue="America/New_York"
              label={t("console.scheduler.new.timezone", undefined, "Timezone (IANA)")}
              required
            />
            <Input
              name="redirect_url"
              label={t("console.scheduler.new.redirect", undefined, "Redirect After Booking")}
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
