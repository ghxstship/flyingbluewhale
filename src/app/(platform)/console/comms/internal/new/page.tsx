import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Create" title="New campaign" />
      <div className="page-content">
        <form action="/api/v1/email_templates" method="post" className="surface p-6 grid gap-4 max-w-xl">
        <label htmlFor="fld-slug" className="flex flex-col gap-1 text-sm"><span>Slug</span><input id="fld-slug" type="text" name="slug" className="surface-inset p-3 rounded" required /></label>
        <label htmlFor="fld-name" className="flex flex-col gap-1 text-sm"><span>Name</span><input id="fld-name" type="text" name="name" className="surface-inset p-3 rounded" required /></label>
        <label htmlFor="fld-subject" className="flex flex-col gap-1 text-sm"><span>Subject</span><input id="fld-subject" type="text" name="subject" className="surface-inset p-3 rounded" required /></label>
          <div className="flex gap-2">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </>
  );
}
