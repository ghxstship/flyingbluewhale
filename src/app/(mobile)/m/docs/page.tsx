import { DocsSurface } from "@/components/connecteam/DocsSurface";

/** COMPVSS personal documents — thin wrapper over shared <DocsSurface>. */
export const dynamic = "force-dynamic";

export default function MobileDocsPage() {
  return <DocsSurface variant="mobile" uploadHref="/m/docs/new" />;
}
