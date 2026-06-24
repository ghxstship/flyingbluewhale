import { DirectorySurface } from "@/components/workforce/DirectorySurface";

/** GVTEWAY crew directory — thin wrapper over shared <DirectorySurface>. */
export const dynamic = "force-dynamic";

export default function CrewDirectoryPage() {
  return <DirectorySurface variant="portal" eyebrowLabel="Crew" titleLabel="Directory" />;
}
