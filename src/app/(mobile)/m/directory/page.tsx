import { DirectorySurface } from "@/components/connecteam/DirectorySurface";

/** COMPVSS directory — thin wrapper over shared <DirectorySurface>. */
export const dynamic = "force-dynamic";

export default function MobileDirectoryPage() {
  return <DirectorySurface variant="mobile" />;
}
