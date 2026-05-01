import { MedicForm } from "./MedicForm";

export const dynamic = "force-dynamic";

export default function MedicNewPage() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">Medic</div>
      <h1 className="mt-1 text-2xl font-semibold">New Encounter</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Log a clinical encounter. Use a pseudonymous patient reference — never a real name. Records are retained per
        local clinical record law.
      </p>
      <div className="mt-6">
        <MedicForm />
      </div>
    </div>
  );
}
