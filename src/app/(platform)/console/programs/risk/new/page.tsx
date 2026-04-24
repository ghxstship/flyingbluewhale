import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Create" title="New risk" />
      <div className="page-content">
        <form action="/api/v1/risks" method="post" className="surface p-6 grid gap-4 max-w-xl">
        <label htmlFor="fld-title" className="flex flex-col gap-1 text-sm"><span>Title</span><input id="fld-title" type="text" name="title" className="surface-inset p-3 rounded" required /></label>
        <label htmlFor="fld-description" className="flex flex-col gap-1 text-sm"><span>Description</span><textarea id="fld-description" name="description" rows={4} className="surface-inset p-3 rounded" /></label>
        <label htmlFor="fld-category" className="flex flex-col gap-1 text-sm"><span>Category</span><input id="fld-category" type="text" name="category" className="surface-inset p-3 rounded" /></label>
          <div className="flex gap-2">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </>
  );
}
