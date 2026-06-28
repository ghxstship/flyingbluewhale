import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import {
  RAIL_GROUPS,
  resolveEntitledApps,
  shouldShowRail,
  activeAppForShell,
  type AppId,
} from "@/lib/entitlements";
import type { Shell } from "@/lib/urls";
import type { RailGroup, AppRailLabels } from "./AppRail";

/**
 * Server-side resolver for the global App Rail. Each authenticated shell layout
 * calls this once, then renders <AppRail {...} /> when `show` is true.
 *
 * Builds the grouped, translated, reach-filtered rail model from the session:
 * reachable products + the coming-soon extensions (locked products are
 * omitted). The render gate (`show`) keys off the reachable-product count.
 */
export async function resolveAppRail(opts: {
  shell: Shell;
  userId: string;
  role: string | null;
  persona: string | null;
  isDeveloper: boolean;
  portalSlug?: string | null;
}): Promise<{ show: boolean; groups: RailGroup[]; activeId: AppId | null; labels: AppRailLabels }> {
  const supabase = await createClient();

  let hasPortal = false;
  try {
    const { count } = await supabase
      .from("project_members")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", opts.userId);
    hasPortal = (count ?? 0) > 0;
  } catch {
    // fall through to role heuristics in the resolver
  }

  const resolved = resolveEntitledApps({
    role: opts.role,
    persona: opts.persona,
    isDeveloper: opts.isDeveloper,
    hasPortal,
    portalSlug: opts.portalSlug,
  });
  const byId = Object.fromEntries(resolved.map((a) => [a.id, a]));

  const { t } = await getRequestT();
  const groupLabel = (l: string) =>
    l === "Products"
      ? t("rail.group.products", undefined, "Products")
      : l === "Extensions"
        ? t("rail.group.extensions", undefined, "Extensions")
        : l;

  const groups: RailGroup[] = RAIL_GROUPS.map((g) => ({
    label: groupLabel(g.label),
    items: g.apps
      .map((id) => byId[id as AppId])
      // Show reachable products (full/ro) + coming-soon extensions; omit locked.
      .filter((a): a is NonNullable<typeof a> => !!a && (a.comingSoon || a.access !== null))
      .map((a) => ({ id: a.id, name: a.name, access: a.access, comingSoon: a.comingSoon, href: a.href })),
  })).filter((g) => g.items.length);

  const labels: AppRailLabels = {
    nav: t("rail.nav", undefined, "Switch app"),
    readOnly: t("rail.readOnly", undefined, "read-only"),
    soon: t("rail.soon", undefined, "Soon"),
  };

  return { show: shouldShowRail(resolved), groups, activeId: activeAppForShell(opts.shell), labels };
}
