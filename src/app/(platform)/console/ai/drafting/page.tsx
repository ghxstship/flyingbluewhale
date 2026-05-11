import { ModuleHeader } from "@/components/Shell";
import { DraftingWorkspace } from "./DraftingWorkspace";

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="AI"
        title="Drafting Workspace"
        subtitle="Generate proposals, SOPs, contracts, press releases, and more"
      />
      <DraftingWorkspace />
    </>
  );
}
