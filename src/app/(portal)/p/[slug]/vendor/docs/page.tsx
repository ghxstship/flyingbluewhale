import { DocsSurface } from "@/components/workforce/DocsSurface";

/** GVTEWAY vendor docs (ADR-0008 Move 3). */
export const dynamic = "force-dynamic";

export default function VendorDocsPage() {
  return <DocsSurface variant="portal" uploadHref="/m/docs/new" eyebrowLabel="Vendor" titleLabel="Docs" />;
}
