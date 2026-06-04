import { CrewScaffoldPage } from "@/components/portal/CrewScaffoldPage";

/** Crew portal — time off (ADR-0008 Move 2 scaffold). */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <CrewScaffoldPage
      title="Time Off"
      subtitle="Your requests + their state."
      mobilePath="/m/time-off"
      mobileLabel="Manage time off in COMPVSS"
    />
  );
}
