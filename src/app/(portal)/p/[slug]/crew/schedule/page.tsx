import { CrewScaffoldPage } from "@/components/portal/CrewScaffoldPage";

/** Crew portal — schedule (ADR-0008 Move 2 scaffold). */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <CrewScaffoldPage
      title="Schedule"
      subtitle="Your upcoming shifts on this project."
      mobilePath="/m/shift"
      mobileLabel="Open schedule in COMPVSS"
    />
  );
}
