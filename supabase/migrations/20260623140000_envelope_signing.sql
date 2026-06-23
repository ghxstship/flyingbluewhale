-- Envelope signing capture (kit v7 SignaturePad archetype).
--
-- Adds a per-signer signing token (for the public /sign/[token] surface) and a
-- captured-signature image column to the existing contract_envelope_signers
-- table. These are not lifecycle columns, so LDP *_state/*_phase naming does
-- not apply; the signer lifecycle stays on `signer_state`.
--
-- CODE-READY migration — not applied to the live project here. The operator
-- applies it, then regenerates database.types.ts.

alter table public.contract_envelope_signers
  add column if not exists sign_token text,
  add column if not exists signature_image text;

-- O(1) public token resolution; tokens are unique when present.
create unique index if not exists contract_envelope_signers_sign_token_idx
  on public.contract_envelope_signers (sign_token)
  where sign_token is not null;

-- Anonymous (public-link) signers resolve their row by token via the service
-- client in the /sign/[token] route handler; no anon RLS grant is added — the
-- service client bypasses RLS and scopes the mutation to the matched token.
