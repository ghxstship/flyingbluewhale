import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestT } from "@/lib/i18n/request";

/**
 * SC-13 — canonical dev fallback for pages guarded by `hasSupabase`.
 *
 * Server component. Drop it in place of the hand-rolled
 * `<div className="surface p-6">Configure Supabase…</div>` blocks so the
 * copy and styling stop drifting per page. Renders its own `page-content`
 * wrapper; pages keep their `<ModuleHeader>` and return
 * `<ConfigureSupabase />` as the body when `!hasSupabase`.
 */
export async function ConfigureSupabase() {
  const { t } = await getRequestT();
  return (
    <div className="page-content">
      <EmptyState
        title={t("common.configureSupabase.title", undefined, "Configure Supabase")}
        description={t(
          "common.configureSupabase.description",
          undefined,
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to load data.",
        )}
      />
    </div>
  );
}
