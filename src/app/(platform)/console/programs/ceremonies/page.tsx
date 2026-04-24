import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Ceremonies" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Opening, closing, victory, and mixed-zone ceremonies share one Run-of-Show module atop events + stage plots. Author cues in the Production module; run live on COMPVSS /m/ros.</div>
      </div>
    </>
  );
}
