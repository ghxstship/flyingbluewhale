import { CrewScaffoldPage } from "@/components/portal/CrewScaffoldPage";

/** Crew portal — feed (ADR-0008 Move 2 scaffold). */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <CrewScaffoldPage
      title="Feed"
      subtitle="Project announcements + updates."
      mobilePath="/m/feed"
      mobileLabel="Open feed in COMPVSS"
    />
  );
}
