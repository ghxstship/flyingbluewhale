import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BrandingPage() {
  return (
    <>
      <ModuleHeader eyebrow="Settings" title="Branding" subtitle="Logo, colors, and email template customization" />
      <div className="page-content space-y-4">
        <div className="surface p-5 space-y-3">
          <div className="text-sm font-semibold">Preview</div>
          <div className="surface-inset p-5 space-y-2">
            <div data-platform="atlvs" className="text-sm"><span className="text-[var(--org-primary)]">●</span> Console shell · ATLVS red</div>
            <div data-platform="gvteway" className="text-sm"><span className="text-[var(--org-primary)]">●</span> Portal shell · GVTEWAY blue</div>
            <div data-platform="compvss" className="text-sm"><span className="text-[var(--org-primary)]">●</span> Mobile shell · COMPVSS yellow</div>
          </div>
        </div>
        <EmptyState
          title="Custom branding on Enterprise"
          description="Upload your logo, set custom colors, and tailor email templates. Available on Enterprise tier."
        />
      </div>
    </>
  );
}
