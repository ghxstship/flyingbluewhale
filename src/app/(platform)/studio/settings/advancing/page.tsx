export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import {
  ADVANCE_SECTION_KEYS,
  ADVANCE_SECTION_LABEL,
  type AdvanceSectionKey,
} from "@/lib/db/advance-packets";
import { addPresetAction, deletePresetAction } from "./actions";

type PresetRow = {
  id: string;
  audience_type: string;
  section_key: AdvanceSectionKey;
  requirement: "required" | "optional" | "hidden";
  due_offset_days: number | null;
};

export default async function AdvancingSettingsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("org_advance_presets")
    .select("id, audience_type, section_key, requirement, due_offset_days")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("audience_type", { ascending: true })
    .limit(500);
  const rows = (data ?? []) as PresetRow[];

  const byType = new Map<string, PresetRow[]>();
  for (const row of rows) {
    const bucket = byType.get(row.audience_type) ?? [];
    bucket.push(row);
    byType.set(row.audience_type, bucket);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.advancing.eyebrow", undefined, "Settings")}
        title={t("console.settings.advancing.title", undefined, "Advancing Presets")}
        subtitle={t(
          "console.settings.advancing.subtitle",
          undefined,
          "Default section matrices per audience type. New packet audiences seed from these; contract terms override manually.",
        )}
      />
      <div className="page-content max-w-5xl space-y-5">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.settings.advancing.empty", undefined, "No Presets Yet")}
            description={t(
              "console.settings.advancing.emptyDescription",
              undefined,
              "Define what a vendor, artist, or internal department gets by default: which sections, at which requirement level, due how many days before the anchor.",
            )}
          />
        ) : (
          Array.from(byType.entries()).map(([type, presets]) => (
            <section key={type} className="space-y-2">
              <h3>{type}</h3>
              <div className="overflow-x-auto">
                <table className="ps-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>{t("console.settings.advancing.columns.section", undefined, "Section")}</th>
                      <th>{t("console.settings.advancing.columns.requirement", undefined, "Requirement")}</th>
                      <th>{t("console.settings.advancing.columns.dueOffset", undefined, "Due Offset")}</th>
                      <th className="text-end">
                        {t("console.settings.advancing.columns.actions", undefined, "Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {presets.map((p) => (
                      <tr key={p.id}>
                        <td>{ADVANCE_SECTION_LABEL[p.section_key] ?? p.section_key}</td>
                        <td>
                          <Badge
                            variant={
                              p.requirement === "required" ? "success" : p.requirement === "optional" ? "info" : "muted"
                            }
                          >
                            {p.requirement}
                          </Badge>
                        </td>
                        <td className="font-mono text-xs">
                          {p.due_offset_days != null
                            ? t(
                                "console.settings.advancing.daysBefore",
                                { days: p.due_offset_days },
                                `${p.due_offset_days}d before anchor`,
                              )
                            : "—"}
                        </td>
                        <td className="text-end">
                          <form action={deletePresetAction} className="inline">
                            <input type="hidden" name="preset_id" value={p.id} />
                            <button type="submit" className="ps-btn ps-btn--sm">
                              {t("common.remove", undefined, "Remove")}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}

        <details className="surface p-6" open={rows.length === 0}>
          <summary className="cursor-pointer text-sm font-semibold">
            {t("console.settings.advancing.add", undefined, "Add Preset Row")}
          </summary>
          <div className="pt-4">
            <FormShell
              action={addPresetAction}
              submitLabel={t("console.settings.advancing.addSubmit", undefined, "Save Preset")}
              dirtyGuard={false}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  name="audience_type"
                  label={t("console.settings.advancing.audienceType", undefined, "Audience Type")}
                  hint={t(
                    "console.settings.advancing.audienceTypeHint",
                    undefined,
                    "vendor, artist, internal, delegation. Your own vocabulary.",
                  )}
                  required
                />
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                    {t("console.settings.advancing.columns.section", undefined, "Section")}
                  </span>
                  <select name="section_key" className="ps-input">
                    {ADVANCE_SECTION_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {ADVANCE_SECTION_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                    {t("console.settings.advancing.columns.requirement", undefined, "Requirement")}
                  </span>
                  <select name="requirement" className="ps-input" defaultValue="required">
                    <option value="required">
                      {t("console.settings.advancing.required", undefined, "Required")}
                    </option>
                    <option value="optional">
                      {t("console.settings.advancing.optional", undefined, "Optional")}
                    </option>
                    <option value="hidden">{t("console.settings.advancing.hidden", undefined, "Hidden")}</option>
                  </select>
                </label>
                <Input
                  name="due_offset_days"
                  type="number"
                  min={0}
                  max={365}
                  label={t("console.settings.advancing.dueOffsetLabel", undefined, "Due Offset (days before anchor)")}
                />
              </div>
            </FormShell>
          </div>
        </details>
      </div>
    </>
  );
}
