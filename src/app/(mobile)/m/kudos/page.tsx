import { KudosSurface } from "@/components/connecteam/KudosSurface";

/** COMPVSS kudos — thin wrapper over shared <KudosSurface>. */
export const dynamic = "force-dynamic";

export default function MobileKudosPage() {
  return <KudosSurface variant="mobile" revalidatePath="/m/kudos" />;
}
