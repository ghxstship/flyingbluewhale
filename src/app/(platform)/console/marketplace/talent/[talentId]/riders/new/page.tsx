import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { TALENT_RIDER_KINDS } from "@/lib/marketplace";
import { createRiderAction } from "../../../new/actions";

export default async function Page({ params }: { params: Promise<{ talentId: string }> }) {
  const { talentId } = await params;

  return (
    <>
      <ModuleHeader
        eyebrow="Talent · New Rider"
        title="New Rider"
        subtitle="Saving demotes the current rider of this kind to historical and marks this as current."
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createRiderAction}
          cancelHref={`/console/marketplace/talent/${talentId}/riders`}
          submitLabel="Save Rider"
        >
          <input type="hidden" name="talent_id" value={talentId} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" required className="input-base mt-1.5 w-full">
              {TALENT_RIDER_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <Input label="Title" name="title" placeholder="Tech Rider v3 (Spring 2026)" maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Body</label>
            <textarea name="content" rows={10} maxLength={20000} className="input-base mt-1.5 w-full" />
          </div>
          <Input label="File URL (optional)" name="file_url" placeholder="https://…/rider.pdf" />
        </FormShell>
      </div>
    </>
  );
}
