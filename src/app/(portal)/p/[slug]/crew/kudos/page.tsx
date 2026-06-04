import { CrewScaffoldPage } from "@/components/portal/CrewScaffoldPage";

/** Crew portal — kudos (ADR-0008 Move 2 scaffold). */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <CrewScaffoldPage
      title="Kudos"
      subtitle="Recent recognition on this project."
      mobilePath="/m/kudos"
      mobileLabel="Post + react in COMPVSS"
    />
  );
}
