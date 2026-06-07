import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Submission Received — ATLVS Partner Program",
  description: "Your partner integration proposal is in the queue.",
  path: "/integrations/submit/thanks",
});

export default function Page() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Integrations", href: "/integrations" },
    { label: "Submission Received", href: "/integrations/submit/thanks" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />
      <section className="mx-auto max-w-2xl px-6 pt-12 pb-20 text-center">
        <div className="eyebrow eyebrow-brand">Partner Program</div>
        <h1 className="hed-3xl mt-4">Submission Received.</h1>
        <p className="mt-5 text-lg text-[var(--p-text-2)]">
          Your proposal is in the queue. The ATLVS partner-AM team typically responds within 5 business days. Watch the
          inbox you submitted with — we&apos;ll reach out from <span className="font-mono">partners@atlvs.pro</span>.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button href="/integrations">Back to live integrations</Button>
          <Button href="/integrations/partners" variant="ghost">
            See the partner directory
          </Button>
        </div>
      </section>
    </div>
  );
}
