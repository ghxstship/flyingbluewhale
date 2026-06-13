-- Applied 2026-06-12 via Supabase MCP (version 20260612175539); file
-- recovered from the remote journal to keep local = remote in sync.
--
-- XPMS 2.1 Budget Template spec alignment: line types are
-- {Scope, Overhead, Contingency, Fee, Retainer}. Live enum had
-- {Scope, Fee, Contingency, Allowance, Markup}; append the two
-- missing spec values (append-only, non-breaking).
alter type budget_line_type add value if not exists 'Retainer';
alter type budget_line_type add value if not exists 'Overhead';
