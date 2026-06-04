import { DirectorySurface } from "@/components/connecteam/DirectorySurface";

/** GVTEWAY vendor directory (ADR-0008 Move 3). */
export const dynamic = "force-dynamic";

export default function VendorDirectoryPage() {
  return <DirectorySurface variant="portal" eyebrowLabel="Vendor" titleLabel="Directory" />;
}
