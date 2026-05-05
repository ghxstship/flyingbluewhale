/**
 * Project templates — Phase 6.3 of the SmartSuite parity roadmap.
 *
 * Per https://help.smartsuite.com/en/collections/2709053-smartsuite-solutions
 * a Solution Template seeds a workspace with a complete shape (records +
 * structure). Our equivalent is a `project_templates` row whose `blueprint`
 * JSONB describes the project shape + child rows to materialize on apply.
 */

export type TemplateCategory = "festival" | "activation" | "tour" | "corporate" | "sponsor" | "custom";

export type TemplateBlueprint = {
  project: {
    kind: string;
    modules: string[];
    [key: string]: unknown;
  };
  deliverables?: Array<{
    kind: string;
    title: string;
    description?: string;
  }>;
  tasks?: Array<{
    title: string;
    description?: string;
    relativeDueDays?: number;
  }>;
  guides?: Array<{
    persona: string;
    config: Record<string, unknown>;
  }>;
  [key: string]: unknown;
};

export type ProjectTemplate = {
  id: string;
  orgId: string | null;
  slug: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  tagline: string | null;
  coverImage: string | null;
  blueprint: TemplateBlueprint;
  enabled: boolean;
  isOfficial: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export function coerceBlueprint(raw: unknown): TemplateBlueprint {
  if (!raw || typeof raw !== "object") return { project: { kind: "custom", modules: [] } };
  const r = raw as Record<string, unknown>;
  const proj = (r.project as Record<string, unknown>) ?? { kind: "custom", modules: [] };
  return {
    project: {
      kind: typeof proj.kind === "string" ? proj.kind : "custom",
      modules: Array.isArray(proj.modules) ? (proj.modules as string[]) : [],
      ...proj,
    },
    deliverables: Array.isArray(r.deliverables) ? (r.deliverables as TemplateBlueprint["deliverables"]) : undefined,
    tasks: Array.isArray(r.tasks) ? (r.tasks as TemplateBlueprint["tasks"]) : undefined,
    guides: Array.isArray(r.guides) ? (r.guides as TemplateBlueprint["guides"]) : undefined,
  };
}
