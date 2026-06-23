import { ModuleHeader } from "@/components/Shell";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { hasSupabase } from "@/lib/env";
import { requireSession } from "@/lib/auth";
import { WhiteboardForm } from "../WhiteboardForm";
import { createWhiteboardAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewWhiteboardPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Collaborate" title="New Whiteboard" />
        <ConfigureSupabase />
      </>
    );
  }
  await requireSession();

  return (
    <>
      <ModuleHeader
        eyebrow="Collaborate"
        title="New Whiteboard"
        breadcrumbs={[
          { label: "Collaborate" },
          { label: "Whiteboards", href: "/studio/collaborate/whiteboards" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-xl">
        <WhiteboardForm action={createWhiteboardAction} submitLabel="Create Whiteboard" />
      </div>
    </>
  );
}
