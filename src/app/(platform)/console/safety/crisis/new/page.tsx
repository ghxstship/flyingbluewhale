import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Create" title="New alert" />
      <div className="page-content">
        <form action="/api/v1/crisis_alerts" method="post" className="surface p-6 grid gap-4 max-w-xl">
        <label className="flex flex-col gap-1 text-sm"><span>Title</span><input type="text" name="title" className="surface-inset p-3 rounded" required /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Body</span><textarea name="body" rows={4} className="surface-inset p-3 rounded" required /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Severity</span><select name="severity" className="surface-inset p-3 rounded" required><option value="info">info</option><option value="warn">warn</option><option value="critical">critical</option></select></label>
          <div className="flex gap-2">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </>
  );
}
