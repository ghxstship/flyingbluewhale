import { CrewScaffoldPage } from "@/components/portal/CrewScaffoldPage";

/** Crew portal — docs (ADR-0008 Move 2 scaffold). */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <CrewScaffoldPage
      title="Docs"
      subtitle="Your personal document vault."
      mobilePath="/m/docs"
      mobileLabel="Manage docs in COMPVSS"
    />
  );
}
