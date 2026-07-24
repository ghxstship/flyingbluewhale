import { readFileSync } from "node:fs";
import { join } from "node:path";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * LEG3ND Architecture — the live ecosystem-IA reference (ADR-0011 / IMPLEMENTATION §6).
 * Renders entirely from `public/ia/ia-model.json`, the generated SSOT
 * (`npm run gen:ia-map`), so it auto-updates whenever the platform IA changes.
 * Gated to authenticated users (internal + institution admins).
 */
type Route = { path: string; arch: string[] };
type Group = { label: string; routes: Route[] };
type ShellModel = { id: string; name: string; descriptor: string; color: string; host: string; routeGroup: string; groups: Group[] };
type Archetype = { name: string; desc: string };
type Model = { meta: { addressing: string }; archetypes: Record<string, Archetype>; newComponents: string[]; shells: ShellModel[] };

function loadModel(): Model {
  return JSON.parse(readFileSync(join(process.cwd(), "public/ia/ia-model.json"), "utf8")) as Model;
}

export default async function ArchitecturePage() {
  await requireSession();
  const { t } = await getRequestT();
  const model = loadModel();
  const totalRoutes = model.shells.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.routes.length, 0), 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="eyebrow">{t("console.legend.architecture.eyebrow", undefined, "Ecosystem · Architecture")}</p>
        <h1>{t("console.legend.architecture.title", undefined, "ATLVS Ecosystem Map")}</h1>
        <p className="max-w-2xl text-[var(--p-text-2)]">
          {t(
            "console.legend.architecture.stats",
            {
              shells: model.shells.length,
              routes: totalRoutes,
              archetypes: Object.keys(model.archetypes).length,
            },
            `${model.shells.length} shells · ${totalRoutes} routes · ${Object.keys(model.archetypes).length} archetypes.`,
          )}{" "}
          {t("console.legend.architecture.generatedFromBefore", undefined, "Generated from")}{" "}
          <code className="font-mono text-sm">nav.ts</code>{" "}
          {t(
            "console.legend.architecture.generatedFromAfter",
            undefined,
            "+ the route tree. It re-renders whenever the platform IA changes.",
          )}
        </p>
        <p className="text-sm text-[var(--p-text-3)]">{model.meta.addressing}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {model.shells.map((shell) => {
          const routeCount = shell.groups.reduce((m, g) => m + g.routes.length, 0);
          return (
            <article
              key={shell.id}
              className="surface rounded-[var(--p-r-lg,12px)] border border-[var(--p-border)] p-5"
              style={{ borderInlineStartWidth: 5, borderInlineStartColor: shell.color }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold">{shell.name}</h2>
                <span className="font-mono text-xs text-[var(--p-text-3)]">{shell.host}</span>
              </div>
              <p className="mt-0.5 text-sm text-[var(--p-text-2)]">{shell.descriptor}</p>
              <p className="mt-1 font-mono text-xs text-[var(--p-text-3)]">
                {t(
                  "console.legend.architecture.shellStats",
                  { routeGroup: shell.routeGroup, groups: shell.groups.length, routes: routeCount },
                  `${shell.routeGroup} · ${shell.groups.length} groups · ${routeCount} routes`,
                )}
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {shell.groups.map((g) => (
                  <li
                    key={g.label}
                    className="rounded-[var(--p-r-pill,999px)] bg-[var(--p-surface-2)] px-2.5 py-1 text-xs text-[var(--p-text-2)]"
                  >
                    {g.label} <span className="text-[var(--p-text-3)]">({g.routes.length})</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">{t("console.legend.architecture.archetypes", undefined, "Archetypes")}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(model.archetypes).map(([key, a]) => (
            <div key={key} className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] p-3">
              <span className="font-mono text-xs font-semibold text-[var(--p-accent-text)]">{key}</span>
              <span className="ml-2 text-sm text-[var(--p-text-1)]">{a.name}</span>
              <p className="mt-0.5 text-xs text-[var(--p-text-3)]">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
