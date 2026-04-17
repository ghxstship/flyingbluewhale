-- flyingbluewhale · RLS for business tables

alter table clients enable row level security;
alter table leads enable row level security;
alter table proposals enable row level security;
alter table invoices enable row level security;
alter table invoice_line_items enable row level security;
alter table expenses enable row level security;
alter table budgets enable row level security;
alter table time_entries enable row level security;
alter table mileage_logs enable row level security;
alter table advances enable row level security;
alter table vendors enable row level security;
alter table requisitions enable row level security;
alter table purchase_orders enable row level security;
alter table po_line_items enable row level security;
alter table equipment enable row level security;
alter table rentals enable row level security;
alter table fabrication_orders enable row level security;
alter table tasks enable row level security;
alter table events enable row level security;
alter table locations enable row level security;
alter table crew_members enable row level security;
alter table credentials enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table audit_log enable row level security;
alter table notifications enable row level security;

-- Standard org-member read / controller-write policies
do $$
declare
  t text;
  readable_by_org text[] := array[
    'clients','leads','proposals','invoices','invoice_line_items','expenses','budgets',
    'time_entries','mileage_logs','advances','vendors','requisitions','purchase_orders','po_line_items',
    'equipment','rentals','fabrication_orders','tasks','events','locations','crew_members','credentials',
    'audit_log'
  ];
  writable_by_org text[] := array[
    'clients','leads','proposals','invoices','expenses','budgets','time_entries','mileage_logs',
    'advances','vendors','requisitions','purchase_orders','equipment','rentals','fabrication_orders',
    'tasks','events','locations','crew_members','credentials'
  ];
begin
  foreach t in array readable_by_org loop
    execute format('create policy %I_select on %I for select using (is_org_member(org_id))', t || '_select', t);
  end loop;
  foreach t in array writable_by_org loop
    execute format('create policy %I_insert on %I for insert with check (has_org_role(org_id, array[''owner'',''admin'',''controller'',''collaborator'']))', t || '_insert', t);
    execute format('create policy %I_update on %I for update using (has_org_role(org_id, array[''owner'',''admin'',''controller'',''collaborator''])) with check (has_org_role(org_id, array[''owner'',''admin'',''controller'',''collaborator'']))', t || '_update', t);
    execute format('create policy %I_delete on %I for delete using (has_org_role(org_id, array[''owner'',''admin'']))', t || '_delete', t);
  end loop;
end $$;

-- Line items inherit from parent
create policy invoice_line_items_select on invoice_line_items for select
  using (exists (select 1 from invoices i where i.id = invoice_id and is_org_member(i.org_id)));

create policy invoice_line_items_modify on invoice_line_items for all
  using (exists (select 1 from invoices i where i.id = invoice_id
                  and has_org_role(i.org_id, array['owner','admin','controller','collaborator'])))
  with check (exists (select 1 from invoices i where i.id = invoice_id
                  and has_org_role(i.org_id, array['owner','admin','controller','collaborator'])));

create policy po_line_items_select on po_line_items for select
  using (exists (select 1 from purchase_orders p where p.id = purchase_order_id and is_org_member(p.org_id)));

create policy po_line_items_modify on po_line_items for all
  using (exists (select 1 from purchase_orders p where p.id = purchase_order_id
                  and has_org_role(p.org_id, array['owner','admin','controller','collaborator'])))
  with check (exists (select 1 from purchase_orders p where p.id = purchase_order_id
                  and has_org_role(p.org_id, array['owner','admin','controller','collaborator'])));

-- AI: user owns their conversations
create policy ai_conversations_select on ai_conversations for select
  using (user_id = auth.uid() or has_org_role(org_id, array['owner','admin']));
create policy ai_conversations_insert on ai_conversations for insert
  with check (user_id = auth.uid() and is_org_member(org_id));
create policy ai_conversations_update on ai_conversations for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ai_conversations_delete on ai_conversations for delete
  using (user_id = auth.uid());

create policy ai_messages_select on ai_messages for select
  using (exists (select 1 from ai_conversations c where c.id = conversation_id
                  and (c.user_id = auth.uid() or has_org_role(c.org_id, array['owner','admin']))));
create policy ai_messages_insert on ai_messages for insert
  with check (exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- Audit log: read-only by admin; inserts by any org member (via service or triggers later)
create policy audit_log_insert on audit_log for insert with check (is_org_member(org_id));

-- Notifications: user-scoped
create policy notifications_select on notifications for select using (user_id = auth.uid());
create policy notifications_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_insert on notifications for insert with check (is_org_member(org_id));
