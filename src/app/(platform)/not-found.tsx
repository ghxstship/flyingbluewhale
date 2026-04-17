import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";

export default function ConsoleNotFound() {
  return (
    <>
      <ModuleHeader eyebrow="404" title="Not found" subtitle="That record doesn't exist, or you don't have access." />
      <div className="page-content">
        <div className="surface p-6">
          <Button href="/console">Back to console</Button>
        </div>
      </div>
    </>
  );
}
