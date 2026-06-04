import { CrewScaffoldPage } from "@/components/portal/CrewScaffoldPage";

/** Crew portal — chat (ADR-0008 Move 2 scaffold). */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <CrewScaffoldPage
      title="Chat"
      subtitle="Project team rooms + threads."
      mobilePath="/m/inbox"
      mobileLabel="Open chat in COMPVSS"
    />
  );
}
