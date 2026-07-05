import { platformNavDomain } from "@/lib/nav";

/**
 * The scopable module set (kit 21 W4) — the console rail's top-level group
 * labels. A subcontractor invite's allow-list is a subset of these.
 *
 * Lives outside `actions.ts` because that file is a "use server" module, which
 * may only export async functions — a plain const would fail the production
 * build. Both the server action and the page import the list from here.
 */
export const SCOPABLE_MODULES = platformNavDomain.map((g) => g.label);
