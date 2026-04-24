import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Create" title="New venue" />
      <div className="page-content">
        <form action="/api/v1/venues" method="post" className="surface p-6 grid gap-4 max-w-xl">
        <label htmlFor="fld-name" className="flex flex-col gap-1 text-sm"><span>Name</span><input id="fld-name" type="text" name="name" className="surface-inset p-3 rounded" required /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Kind</span><select name="kind" className="surface-inset p-3 rounded" required><option value="competition">competition</option><option value="training">training</option><option value="live_site">live_site</option><option value="ibc">ibc</option><option value="mpc">mpc</option><option value="village">village</option><option value="support">support</option></select></label>
        <label htmlFor="fld-cluster" className="flex flex-col gap-1 text-sm"><span>Cluster</span><input id="fld-cluster" type="text" name="cluster" className="surface-inset p-3 rounded" /></label>
        <label htmlFor="fld-capacity" className="flex flex-col gap-1 text-sm"><span>Capacity</span><input id="fld-capacity" type="number" name="capacity" className="surface-inset p-3 rounded" /></label>
          <div className="flex gap-2">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </>
  );
}
