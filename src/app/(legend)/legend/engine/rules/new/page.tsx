import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { RuleForm } from "../RuleForm";

export default async function NewRulePage() {
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  return (
    <>
      <ModuleHeader eyebrow="LEG3ND · XMCE" title="New Compliance Rule" />
      <div className="page-content max-w-2xl">
        <RuleForm />
      </div>
    </>
  );
}
