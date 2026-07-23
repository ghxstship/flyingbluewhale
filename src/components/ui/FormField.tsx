/**
 * Compat re-export (W5 vocabulary consolidation, F-03, 2026-07-22).
 *
 * The canonical form-row wrapper is `@/components/forms/FormField` — it closes
 * the FormShell error loop (useFieldError) and ships the TextInput/TextArea/
 * NativeSelect bound controls. This file's historical clone-with-aria
 * standalone mode now lives there as `UnboundFormField`; the old import paths
 * (`@/components/ui/FormField` and the `@/components/ui` barrel) keep
 * resolving so no importer churns. New code should import from
 * `@/components/forms/FormField` directly.
 */
export { UnboundFormField as FormField, FormGrid } from "@/components/forms/FormField";
