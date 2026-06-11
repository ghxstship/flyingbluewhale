import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { uploadPersonalDoc } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDocPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("m.docs.new.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  await requireSession();

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold">{t("m.docs.new.title", undefined, "Upload Document")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "m.docs.new.description",
          undefined,
          "Only you can see these. The file is uploaded to a private bucket and downloadable via a short-lived signed URL.",
        )}
      </p>

      <FormShell
        action={uploadPersonalDoc}
        encType="multipart/form-data"
        className="mt-5 space-y-4"
        submitLabel={t("m.docs.new.upload", undefined, "Upload")}
        cancelHref="/m/docs"
      >
        <label className="block text-xs font-semibold">
          {t("m.docs.new.label", undefined, "Label")}
          <input
            type="text"
            name="label"
            required
            maxLength={200}
            placeholder={t("m.docs.new.labelPlaceholder", undefined, "e.g. Driver's License")}
            className="mt-1 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold">
          {t("m.docs.new.kind", undefined, "Kind")}
          <select
            name="doc_kind"
            required
            className="mt-1 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm"
            defaultValue="id"
          >
            <option value="id">{t("m.docs.new.kindId", undefined, "ID")}</option>
            <option value="license">{t("m.docs.new.kindLicense", undefined, "License / certification")}</option>
            <option value="tax">{t("m.docs.new.kindTax", undefined, "Tax form")}</option>
            <option value="contract">{t("m.docs.new.kindContract", undefined, "Contract")}</option>
            <option value="medical">{t("m.docs.new.kindMedical", undefined, "Medical")}</option>
            <option value="other">{t("m.docs.new.kindOther", undefined, "Other")}</option>
          </select>
        </label>
        <label className="block text-xs font-semibold">
          {t("m.docs.new.file", undefined, "File")}
          <input type="file" name="file" required accept="image/*,.pdf,.doc,.docx" className="mt-1 w-full text-sm" />
        </label>
      </FormShell>
    </div>
  );
}
