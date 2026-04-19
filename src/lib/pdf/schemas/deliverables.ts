import { z } from "zod";

/**
 * Per-deliverable-type Zod schemas — Opportunity #2.
 *
 * Each value of the `deliverable_type` enum gets a canonical shape for
 * `deliverables.data jsonb`. Schemas accept the minimum set of fields
 * industry-standard for that document; everything is optional past the
 * bare minimum so existing rows that predate the schema still render
 * via the `generic` fallback.
 */

// ── Shared row shapes ──────────────────────────────────────────────

const Row = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

const RowsBlock = z.object({
  rows: z.array(Row).default([]),
  columns: z.array(z.string()).default([]),
  note: z.string().optional(),
});

const EntriesBlock = z.object({
  entries: z.array(
    z.object({
      label: z.string().optional(),
      title: z.string().optional(),
      value: z.union([z.string(), z.number()]).optional(),
      note: z.string().optional(),
      time: z.string().optional(),
    }),
  ).default([]),
});

// ── Individual type schemas ────────────────────────────────────────

export const TechnicalRiderSchema = z.object({
  sections: z.array(
    z.object({
      heading: z.string(),
      body: z.string().optional(),
      items: z.array(z.string()).optional(),
    }),
  ).default([]),
});

export const HospitalityRiderSchema = TechnicalRiderSchema;

export const InputListSchema = z.object({
  entries: z.array(
    z.object({
      channel: z.union([z.string(), z.number()]),
      name: z.string(),
      source: z.string().optional(),
      mic: z.string().optional(),
      insert: z.string().optional(),
      note: z.string().optional(),
    }),
  ).default([]),
});

export const StagePlotSchema = z.object({
  elements: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      kind: z.string().optional(),
      x: z.number().optional(),
      y: z.number().optional(),
      w: z.number().optional(),
      h: z.number().optional(),
      rotation: z.number().optional(),
    }),
  ).default([]),
  /** Optional pre-rendered SVG of the plot. If present, we embed as an image. */
  svgUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export const CrewListSchema = z.object({
  entries: z.array(
    z.object({
      name: z.string(),
      role: z.string().optional(),
      department: z.string().optional(),
      call: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    }),
  ).default([]),
});

export const GuestListSchema = z.object({
  entries: z.array(
    z.object({
      name: z.string(),
      plus_ones: z.number().optional(),
      credential_tier: z.string().optional(),
      note: z.string().optional(),
    }),
  ).default([]),
});

export const EquipmentPullListSchema = z.object({
  entries: z.array(
    z.object({
      qty: z.number().default(1),
      item: z.string(),
      category: z.string().optional(),
      note: z.string().optional(),
    }),
  ).default([]),
});

export const PowerPlanSchema = z.object({
  services: z.array(
    z.object({
      location: z.string(),
      amperage: z.string().optional(),
      phase: z.string().optional(),
      voltage: z.string().optional(),
      source: z.string().optional(),
      note: z.string().optional(),
    }),
  ).default([]),
  generators: z.array(
    z.object({
      label: z.string(),
      kw: z.number().optional(),
      fuel: z.string().optional(),
      location: z.string().optional(),
    }),
  ).default([]),
});

export const RiggingPlanSchema = z.object({
  points: z.array(
    z.object({
      label: z.string(),
      capacity_lbs: z.number().optional(),
      height_ft: z.number().optional(),
      note: z.string().optional(),
    }),
  ).default([]),
  notes: z.string().optional(),
});

export const SitePlanSchema = z.object({
  zones: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      contact: z.string().optional(),
    }),
  ).default([]),
  svgUrl: z.string().url().optional(),
});

export const BuildScheduleSchema = z.object({
  entries: z.array(
    z.object({
      day: z.string(),
      time: z.string().optional(),
      activity: z.string(),
      crew: z.string().optional(),
      note: z.string().optional(),
    }),
  ).default([]),
});

export const VendorPackageSchema = z.object({
  vendor_name: z.string().optional(),
  deliverables: z.array(
    z.object({
      name: z.string(),
      due: z.string().optional(),
      status: z.string().optional(),
    }),
  ).default([]),
  notes: z.string().optional(),
});

export const SafetyComplianceSchema = z.object({
  items: z.array(
    z.object({
      topic: z.string(),
      requirement: z.string(),
      owner: z.string().optional(),
      status: z.string().optional(),
    }),
  ).default([]),
});

export const CommsPlanSchema = z.object({
  channels: z.array(
    z.object({
      channel: z.string(),
      purpose: z.string(),
    }),
  ).default([]),
  codeWords: z.array(
    z.object({
      code: z.string(),
      meaning: z.string(),
    }),
  ).default([]),
});

export const SignageGridSchema = z.object({
  entries: z.array(
    z.object({
      location: z.string(),
      type: z.string(),
      size: z.string().optional(),
      install: z.string().optional(),
      strike: z.string().optional(),
      note: z.string().optional(),
    }),
  ).default([]),
});

export const CustomSchema = z.object({
  sections: z.array(
    z.object({ heading: z.string(), body: z.string() }),
  ).default([]),
});

// ── Type union for convenience ─────────────────────────────────────

export type TechnicalRiderData = z.infer<typeof TechnicalRiderSchema>;
export type HospitalityRiderData = z.infer<typeof HospitalityRiderSchema>;
export type InputListData = z.infer<typeof InputListSchema>;
export type StagePlotData = z.infer<typeof StagePlotSchema>;
export type CrewListData = z.infer<typeof CrewListSchema>;
export type GuestListData = z.infer<typeof GuestListSchema>;
export type EquipmentPullListData = z.infer<typeof EquipmentPullListSchema>;
export type PowerPlanData = z.infer<typeof PowerPlanSchema>;
export type RiggingPlanData = z.infer<typeof RiggingPlanSchema>;
export type SitePlanData = z.infer<typeof SitePlanSchema>;
export type BuildScheduleData = z.infer<typeof BuildScheduleSchema>;
export type VendorPackageData = z.infer<typeof VendorPackageSchema>;
export type SafetyComplianceData = z.infer<typeof SafetyComplianceSchema>;
export type CommsPlanData = z.infer<typeof CommsPlanSchema>;
export type SignageGridData = z.infer<typeof SignageGridSchema>;
export type CustomData = z.infer<typeof CustomSchema>;

export {
  RowsBlock,
  EntriesBlock,
};
