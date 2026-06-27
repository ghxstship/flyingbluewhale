/**
 * Default signing authority for offer letters / MSAs (plumb-line DOC-5).
 *
 * Single owner for the fallback used when a record's `signing_authority_*`
 * fields are null. Every renderer (LetterDocument), document binding
 * (offer-binding / registry sample), and email composer (offer-letters/compose)
 * MUST reference these instead of re-hardcoding the name/title — otherwise two
 * renderings of the same offer letter can show different signers.
 */
export const DEFAULT_SIGNING_AUTHORITY_NAME = "Julian Clarkson";
export const DEFAULT_SIGNING_AUTHORITY_TITLE = "Producer & Operations Director";
