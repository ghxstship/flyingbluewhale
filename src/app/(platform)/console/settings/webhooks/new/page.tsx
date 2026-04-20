import { ModuleHeader } from "@/components/Shell";
import { WebhookEndpointForm } from "./WebhookEndpointForm";

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="New webhook endpoint"
        subtitle="Register a URL to receive HMAC-signed event deliveries."
        breadcrumbs={[
          { label: "Settings" },
          { label: "Webhooks", href: "/console/settings/webhooks" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <WebhookEndpointForm />
      </div>
    </>
  );
}
