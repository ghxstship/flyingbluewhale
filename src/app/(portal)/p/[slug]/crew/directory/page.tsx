import { CrewScaffoldPage } from "@/components/portal/CrewScaffoldPage";

/** Crew portal — directory (ADR-0008 Move 2 scaffold). */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <CrewScaffoldPage
      title="Directory"
      subtitle="Everyone on this project."
      mobilePath="/m/directory"
      mobileLabel="Browse directory in COMPVSS"
    />
  );
}
