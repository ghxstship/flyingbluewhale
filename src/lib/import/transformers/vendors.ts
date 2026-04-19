import "server-only";
import { z } from "zod";

export const VendorRowSchema = z.object({
  name: z.string().trim().min(1),
  contact_email: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
  contact_phone: z.string().trim().max(64).optional().or(z.literal("").transform(() => undefined)),
  category: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(4000).optional().or(z.literal("").transform(() => undefined)),
});
export type VendorRow = z.infer<typeof VendorRowSchema>;
export function dedupeKey(row: VendorRow): string {
  return (row.contact_email ?? row.name).toLowerCase();
}
