-- Revoke EXECUTE from anon + authenticated on SECURITY DEFINER functions that
-- are only ever called by trusted server code via the service-role client.
--
-- - public.consume_share_link(p_id uuid)
--     Called from src/lib/share/links.ts via createServiceClient(). The /share
--     route flow already HMAC-verifies the token, fetches the row, and
--     enforces passcode/expiry checks before calling this RPC. There is no
--     reason for an unauth or authed PostgREST caller to invoke it directly.
--
-- - public.next_sequence(p_org_id uuid, p_scope text, p_format text)
-- - public.peek_sequence(p_org_id uuid, p_scope text)
--     Called from src/lib/sequences.ts via createServiceClient(). All
--     auto-numbered IDs (invoices, POs, etc.) flow through server actions
--     that have already authenticated + org-scoped the user.
--
-- mark_closed is intentionally LEFT exposed to authenticated — it carries
-- a hard-coded table whitelist + per-table RLS gates the row visibility.
-- The COMMENT on that function records the accepted-by-design rationale.
--
-- Result: anon+authenticated lose EXECUTE; service_role keeps it; postgres
-- (the owner) keeps it. PostgREST will respond 404 on the public RPC route
-- if anyone probes for them.

revoke execute on function public.consume_share_link(uuid) from anon, authenticated;
revoke execute on function public.next_sequence(uuid, text, text) from authenticated;
revoke execute on function public.peek_sequence(uuid, text) from authenticated;

comment on function public.consume_share_link(uuid) is
  'Atomic share-link claim. SECURITY DEFINER + service_role-only EXECUTE — '
  'callers must HMAC-verify the token first (see src/lib/share/links.ts).';

comment on function public.next_sequence(uuid, text, text) is
  'Atomic per-org auto-number sequence. SECURITY DEFINER + service_role-only '
  'EXECUTE — callers run inside server actions that have already authed + '
  'org-scoped the user (see src/lib/sequences.ts).';

comment on function public.peek_sequence(uuid, text) is
  'Read-only counter inspection. SECURITY DEFINER + service_role-only EXECUTE '
  '— matched to next_sequence, called only by server-side preview helpers.';
