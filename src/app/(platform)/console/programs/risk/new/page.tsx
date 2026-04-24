import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Create" title="New risk" />
      <div className="page-content">
        <form action="/api/v1/risks" method="post" className="surface p-6 grid gap-4 max-w-xl">
        <label className="flex flex-col gap-1 text-sm"><span>Title</span><input type="text" name="title" className="surface-inset p-3 rounded" required /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Description</span><textarea name="description" rows={4} className="surface-inset p-3 rounded" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Category</span><input type="text" name="category" className="surface-inset p-3 rounded" /></label>
          <div className="flex gap-2">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </>
  );
}
