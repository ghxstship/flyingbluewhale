-- Document-lifecycle gap closure (1 of 2 concerns each):
--
-- A) personal_documents gains the missing lifecycle: expiry (valid_until) and an
--    office-side verification loop (verification_state, LDP *_state naming —
--    cyclical operational state). New uploads land in pending_review; rows that
--    predate the lifecycle are backfilled to unverified so the review queue
--    starts empty. RLS was self-only; the manager band (owner/admin/manager)
--    gains read + update so the office can actually review, and a trigger stops
--    document owners from flipping their own verification fields (RLS is
--    column-blind; the self_rw ALL policy would otherwise allow self-verify).
--
-- B) chat_messages.attachments (jsonb, shipped empty) finally gets its storage:
--    the chat-attachments bucket, org-prefixed like every other private bucket,
--    added to the shared org-scoped read + upload policies.

-- A1) verification lifecycle
create type personal_doc_verification_state as enum
  ('unverified', 'pending_review', 'verified', 'rejected');

alter table public.personal_documents
  add column valid_until date,
  add column verification_state personal_doc_verification_state not null default 'pending_review',
  add column verified_by uuid references auth.users(id) on delete set null,
  add column verified_at timestamptz,
  add column rejection_reason text;

update public.personal_documents set verification_state = 'unverified';

create index personal_documents_expiry_idx
  on public.personal_documents (org_id, valid_until)
  where deleted_at is null and valid_until is not null;

create index personal_documents_verification_idx
  on public.personal_documents (org_id, verification_state)
  where deleted_at is null;

-- A2) manager band can read + review org personal documents (was self-only)
create policy personal_documents_manager_read on public.personal_documents
  for select using (private.has_org_role(org_id, array['owner','admin','manager']));

create policy personal_documents_manager_update on public.personal_documents
  for update using (private.has_org_role(org_id, array['owner','admin','manager']))
  with check (private.has_org_role(org_id, array['owner','admin','manager']));

-- A3) owners cannot self-verify. service_role bypasses RLS but NOT triggers,
-- so the guard explicitly lets it through.
create or replace function private.guard_personal_doc_verification()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (new.verification_state is distinct from old.verification_state
      or new.verified_by is distinct from old.verified_by
      or new.verified_at is distinct from old.verified_at
      or new.rejection_reason is distinct from old.rejection_reason)
     and coalesce(auth.role(), '') <> 'service_role'
     and not private.has_org_role(old.org_id, array['owner','admin','manager'])
  then
    raise exception 'verification fields are manager-band only';
  end if;
  return new;
end
$$;

create trigger tg_personal_documents_verification_guard
  before update on public.personal_documents
  for each row execute function private.guard_personal_doc_verification();

-- B) chat attachments bucket + shared policy arrays (mirrors live shape exactly,
-- adding only chat-attachments)
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

alter policy "storage_org_scoped_read" on storage.objects
  using (
    bucket_id = any (array['advancing', 'receipts', 'proposals', 'credentials', 'branding',
                           'incident-photos', 'procore-parity', 'personal-documents',
                           'listing-photos', 'forms', 'chat-attachments'])
    and exists (
      select 1
      from public.memberships m
      where m.user_id = (select auth.uid())
        and m.org_id::text = (storage.foldername(name))[1]
        and m.deleted_at is null
    )
  );

alter policy "storage_org_scoped_upload" on storage.objects
  with check (
    bucket_id = any (array['advancing', 'incident-photos', 'procore-parity', 'branding',
                           'listing-photos', 'chat-attachments'])
    and private.caller_owns_org_prefix(name)
  );
