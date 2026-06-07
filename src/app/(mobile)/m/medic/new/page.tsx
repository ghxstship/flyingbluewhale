import { getRequestT } from "@/lib/i18n/request";
import { MedicForm } from "./MedicForm";

export const dynamic = "force-dynamic";

export default async function MedicNewPage() {
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-danger)] uppercase">
        {t("m.medic.new.eyebrow", undefined, "Medic")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.medic.new.title", undefined, "New Encounter")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "m.medic.new.description",
          undefined,
          "Log a clinical encounter. Use a pseudonymous patient reference — never a real name. Records are retained per local clinical record law.",
        )}
      </p>
      <div className="mt-6">
        <MedicForm />
      </div>
    </div>
  );
}
