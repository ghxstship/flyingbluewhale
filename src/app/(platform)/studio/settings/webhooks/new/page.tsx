import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { WebhookEndpointForm } from "./WebhookEndpointForm";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.webhooks.new.eyebrow", undefined, "Settings")}
        title={t("console.settings.webhooks.new.title", undefined, "New Webhook Endpoint")}
        subtitle={t("console.settings.webhooks.new.subtitle", undefined, "Register a URL to receive event deliveries.")}
        breadcrumbs={[
          { label: t("console.settings.webhooks.new.breadcrumb.settings", undefined, "Settings") },
          {
            label: t("console.settings.webhooks.new.breadcrumb.webhooks", undefined, "Webhooks"),
            href: "/studio/settings/webhooks",
          },
          { label: t("console.settings.webhooks.new.breadcrumb.new", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <WebhookEndpointForm />
      </div>
    </>
  );
}
