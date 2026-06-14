import { ModuleHeader } from "@/components/Shell";
import { RuleForm } from "../RuleForm";

export default function NewRulePage() {
  return (
    <>
      <ModuleHeader eyebrow="LEG3ND · XMCE" title="New Compliance Rule" />
      <div className="page-content max-w-2xl">
        <RuleForm />
      </div>
    </>
  );
}
