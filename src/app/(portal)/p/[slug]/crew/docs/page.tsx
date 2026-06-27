import { DocsSurface } from "@/components/workforce/DocsSurface";

/** GVTEWAY crew docs — thin wrapper over shared <DocsSurface>. */
export const dynamic = "force-dynamic";

export default function CrewDocsPage() {
  return <DocsSurface variant="portal" uploadHref="/m/docs/new" eyebrowLabel="Crew" titleLabel="Docs" />;
}
