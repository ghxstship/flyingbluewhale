import "server-only";
import { z } from "zod";

/**
 * Task importer — Opportunity #7.
 * Requires a `project_id` injected by the route. `title` is the only
 * required column; everything else is optional.
 */

export const TaskRowSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().max(4000).optional().or(z.literal("").transform(() => undefined)),
  status: z.enum(["todo", "in_progress", "review", "blocked", "done"]).default("todo"),
  priority: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0 && v <= 5), {
      message: "priority must be 0-5",
    }),
  due_at: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
});
export type TaskRow = z.infer<typeof TaskRowSchema>;

export function dedupeKey(row: TaskRow): string {
  return `${row.title}::${row.due_at ?? ""}`.toLowerCase();
}
