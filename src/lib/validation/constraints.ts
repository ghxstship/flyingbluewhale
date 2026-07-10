/**
 * HP-15 — single-source client/server validation constants.
 *
 * The health audit found hand-mirrored constraint pairs drifting between
 * client `<input>` attributes and server zod schemas (e.g. the signup form
 * enforced `minLength={8}` but not the server's `.max(128)`, so a 129-char
 * password failed only after a round trip). Constants that BOTH sides need
 * live here — a plain module with no "use server"/"server-only" pragma so
 * client components and server actions can import the same values.
 *
 * The server zod schema remains the authority on the RULE; this module only
 * owns the shared numbers. When adding a form constraint that must render
 * client-side, define the constant here and consume it from both places
 * rather than re-typing the literal.
 */

/** Auth password policy — signup, reset, invite-accept. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Invoice title (finance/invoices create + edit). */
export const INVOICE_TITLE_MAX_LENGTH = 200;
