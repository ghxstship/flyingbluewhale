import { requireSession } from "@/lib/auth";
import { QuickFileForm } from "./QuickFileForm";

export const dynamic = "force-dynamic";

/** COMPVSS · Express incident quick-file. Server guard → client one-field form. */
export default async function NewQuickIncidentPage() {
  await requireSession();
  return <QuickFileForm />;
}
