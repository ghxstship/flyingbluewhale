-- Migration 0057: set security_invoker on notification_kind_catalog view.
--
-- Migration 0025 established the project-wide convention that all public
-- views carry security_invoker=on so queries run under the caller's RLS
-- context rather than the view definer's. notification_kind_catalog was
-- created in 0051 as a plain CREATE OR REPLACE VIEW and missed this
-- hardening step. The view returns only static string literals (no table
-- scans), so the practical risk is minimal, but conformance with 0025 is
-- required for the Supabase Advisor security gate to pass clean.

ALTER VIEW public.notification_kind_catalog SET (security_invoker = on);
