import { CrewScaffoldPage } from "@/components/portal/CrewScaffoldPage";

/** Crew portal — learning (ADR-0008 Move 2 scaffold). */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <CrewScaffoldPage
      title="Learning"
      subtitle="Assigned courses + due dates."
      mobilePath="/m/learning"
      mobileLabel="Take courses in COMPVSS"
    />
  );
}
