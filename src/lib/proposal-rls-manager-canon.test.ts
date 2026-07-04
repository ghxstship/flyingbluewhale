import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * D1 regression guard — proposal-lifecycle RLS must admit `manager`.
 *
 * The app guard `isManagerPlus()` (src/lib/auth.ts) admits role `manager`,
 * and the proposal create/convert server actions run on the RLS-enforced
 * user client. If the write policies on `proposals`, `proposal_share_links`,
 * and `projects` omit `manager` from their role band, a real manager
 * (persona NOT in owner/admin/controller/collaborator) passes the app check
 * but the DB rejects the write — the exact HIGH-severity authorization
 * defect found on 2026-06-12 and fixed in
 * `20260612180000_proposal_rls_manager_grant.sql`.
 *
 * This spec parses the migrations, resolves the LAST (effective) definition
 * of each guarded write policy, and asserts `'manager'` is present in its
 * `private.has_org_role(...)` band. It is a pure-text guard (no live DB) so
 * it runs under the standard vitest gate and fails loudly if a future
 * migration drops `manager` back out of the band.
 *
 * Mirrors the introspection style of `src/lib/ldp-naming-canon.test.ts`.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

// (table, policy) pairs whose write band MUST include 'manager'. The first
// six are the hard-blocking surfaces of the proposal create/convert path
// (20260612180000_proposal_rls_manager_grant.sql); the last five are the
// convert-SEED downstream tables that convertProposalToProjectAction writes
// after the project exists (20260613182535_convert_seed_rls_manager_grant.sql)
// — without them a manager gets a project but SILENTLY no deposit/balance
// invoices and no seeded deliverables/budgets, because those seeds soft-fail.
// A missing grant here returns "new row violates row-level security policy"
// to a manager who the app already authorized.
//
// NOT listed (intentionally): deliverables_insert + master_catalog_items_org_rw
// gate on private.is_org_member, which already admits a manager — there is no
// 4-role band to widen, so they carry no manager-specific guard.
const GUARDED_WRITE_POLICIES: ReadonlyArray<{ table: string; policy: string }> = [
  { table: "proposals", policy: "proposals_insert" },
  { table: "proposals", policy: "proposals_update" },
  { table: "projects", policy: "projects_insert" },
  { table: "projects", policy: "projects_update" },
  { table: "proposal_share_links", policy: "proposal_share_links_modify__insert" },
  { table: "proposal_share_links", policy: "proposal_share_links_update_consolidated" },
  // convert-seed downstream (D1 follow-up)
  { table: "invoices", policy: "invoices_insert" },
  { table: "invoices", policy: "invoices_update" },
  { table: "budgets", policy: "budgets_insert" },
  { table: "budgets", policy: "budgets_update" },
  { table: "deliverables", policy: "deliverables_update_consolidated" },
  // tasks (D1-class follow-up, 2026-06-25): createTaskAction gates ONLY on
  // requireSession (any operator may create a task), yet the tasks write
  // bands omitted 'manager' — a role=manager operator failed the INSERT at
  // the DB. Fixed in 20260625*_tasks_rls_manager_grant.sql; guarded here so a
  // future migration can't silently drop manager back out of the band.
  { table: "tasks", policy: "tasks_insert" },
  { table: "tasks", policy: "tasks_update" },
  // Schema-wide D1 sweep (2026-06-25), 20260625130000_rls_manager_grant_sweep.sql:
  // 212 INSERT/UPDATE/ALL write policies across 124 tables whose has_org_role
  // band admitted 'collaborator' and/or 'controller' but omitted 'manager' —
  // the same app-vs-RLS inversion as proposals/tasks. Each was recreated with
  // 'manager' inserted into the band (rest verbatim). Listed here so a future
  // migration can't silently drop manager back out of any of them.
  { table: "accounting_period_state_transitions", policy: "accounting_period_state_transitions_insert_controller" },
  { table: "accreditation_categories", policy: "accreditation_categories_rw__insert" },
  { table: "accreditation_categories", policy: "accreditation_categories_rw__update" },
  { table: "accreditation_changes", policy: "accreditation_changes_write__insert" },
  { table: "accreditation_changes", policy: "accreditation_changes_write__update" },
  { table: "accreditations", policy: "accreditations_admin__insert" },
  { table: "accreditations", policy: "accreditations_admin__update" },
  { table: "assessment_questions", policy: "assessment_questions_write" },
  { table: "assessments", policy: "assessments_write" },
  { table: "assignment_events", policy: "assignment_events_insert" },
  { table: "assignment_external_holders", policy: "assignment_external_holders_insert" },
  { table: "assignment_external_holders", policy: "assignment_external_holders_update" },
  { table: "assignment_scan_codes", policy: "assignment_scan_codes_insert" },
  { table: "assignment_scan_codes", policy: "assignment_scan_codes_update" },
  { table: "assignments", policy: "assignments_insert" },
  { table: "assignments", policy: "assignments_update" },
  { table: "automations", policy: "automations_org_modify__insert" },
  { table: "automations", policy: "automations_org_modify__update" },
  { table: "campaigns", policy: "campaigns_insert" },
  { table: "campaigns", policy: "campaigns_update" },
  { table: "case_studies", policy: "case_studies_admin__insert" },
  { table: "case_studies", policy: "case_studies_admin__update" },
  { table: "certification_holders", policy: "certification_holders_write" },
  { table: "certification_holders", policy: "certification_holders_insert" },
  { table: "certification_recerts", policy: "certification_recerts_write" },
  { table: "clients", policy: "clients_insert" },
  { table: "clients", policy: "clients_update" },
  { table: "conversations", policy: "conversations_update" },
  { table: "cost_codes", policy: "cost_codes_write__insert" },
  { table: "cost_codes", policy: "cost_codes_write__update" },
  { table: "course_enrollments", policy: "course_enrollments_update" },
  { table: "course_modules", policy: "course_modules_write" },
  { table: "credential_assignment_details", policy: "credential_assignment_details_iud" },
  { table: "credentials", policy: "credentials_insert" },
  { table: "credentials", policy: "credentials_update" },
  { table: "crew_members", policy: "crew_members_insert" },
  { table: "crew_members", policy: "crew_members_update" },
  { table: "crisis_alerts", policy: "crisis_alerts_admin__insert" },
  { table: "crisis_alerts", policy: "crisis_alerts_admin__update" },
  { table: "cues", policy: "cues_org_modify__insert" },
  { table: "cues", policy: "cues_org_modify__update" },
  { table: "daily_log_deliveries", policy: "dl_deliveries_write__insert" },
  { table: "daily_log_deliveries", policy: "dl_deliveries_write__update" },
  { table: "daily_log_equipment", policy: "dl_equipment_write__insert" },
  { table: "daily_log_equipment", policy: "dl_equipment_write__update" },
  { table: "daily_log_manpower", policy: "dl_manpower_write__insert" },
  { table: "daily_log_manpower", policy: "dl_manpower_write__update" },
  { table: "daily_log_photos", policy: "dl_photos_write__insert" },
  { table: "daily_log_photos", policy: "dl_photos_write__update" },
  { table: "daily_log_visitors", policy: "dl_visitors_write__insert" },
  { table: "daily_log_visitors", policy: "dl_visitors_write__update" },
  { table: "daily_logs", policy: "daily_logs_insert" },
  { table: "daily_logs", policy: "daily_logs_update" },
  { table: "delegations", policy: "delegations_admin__insert" },
  { table: "delegations", policy: "delegations_admin__update" },
  { table: "deliverable_state_transitions", policy: "deliverable_state_transitions_insert_collab" },
  { table: "deliverable_templates", policy: "deliverable_templates_insert" },
  { table: "deliverable_templates", policy: "deliverable_templates_update" },
  { table: "dispatch_runs", policy: "dispatch_runs_admin__insert" },
  { table: "dispatch_runs", policy: "dispatch_runs_admin__update" },
  { table: "document_state_transitions", policy: "document_state_transitions_insert_collab" },
  { table: "dsar_requests", policy: "dsar_requests_insert_consolidated" },
  { table: "dsar_requests", policy: "dsar_requests_admin__update" },
  { table: "equipment", policy: "equipment_insert" },
  { table: "equipment", policy: "equipment_update" },
  { table: "event_guides", policy: "event_guides_insert" },
  { table: "event_guides", policy: "event_guides_update" },
  { table: "events", policy: "events_insert" },
  { table: "events", policy: "events_update" },
  { table: "expenses", policy: "expenses_insert" },
  { table: "expenses", policy: "expenses_update" },
  { table: "fabrication_orders", policy: "fabrication_orders_insert" },
  { table: "fabrication_orders", policy: "fabrication_orders_update" },
  { table: "form_defs", policy: "form_defs_org_modify__insert" },
  { table: "form_defs", policy: "form_defs_org_modify__update" },
  { table: "guard_tours", policy: "guard_tours_insert" },
  { table: "guard_tours", policy: "guard_tours_update" },
  { table: "incidents", policy: "incidents_update" },
  { table: "inspection_items", policy: "insp_items_write__insert" },
  { table: "inspection_items", policy: "insp_items_write__update" },
  { table: "inspection_template_items", policy: "insp_tpl_items_write__insert" },
  { table: "inspection_template_items", policy: "insp_tpl_items_write__update" },
  { table: "inspection_templates", policy: "insp_tpl_insert" },
  { table: "inspection_templates", policy: "insp_tpl_update" },
  { table: "inspections", policy: "inspections_insert" },
  { table: "inspections", policy: "inspections_update" },
  { table: "insurance_policies", policy: "insurance_policies_rw" },
  { table: "invoice_line_items", policy: "invoice_line_items_modify__insert" },
  { table: "invoice_line_items", policy: "invoice_line_items_modify__update" },
  { table: "itil_changes", policy: "itil_changes_insert" },
  { table: "itil_changes", policy: "itil_changes_update" },
  { table: "itil_problems", policy: "itil_problems_insert" },
  { table: "itil_problems", policy: "itil_problems_update" },
  { table: "kb_articles", policy: "kb_articles_write__insert" },
  { table: "kb_articles", policy: "kb_articles_write__update" },
  // leads merged into opportunities (ADR-0014 Phase A, 20260703150000_crm_merge_leads_kind)
  { table: "opportunities", policy: "opportunities_insert" },
  { table: "opportunities", policy: "opportunities_update" },
  { table: "legend_certifications", policy: "legend_certifications_write" },
  { table: "legend_courses", policy: "legend_courses_write" },
  { table: "legend_crew_members", policy: "legend_crew_members_write" },
  { table: "legend_crews", policy: "legend_crews_write" },
  { table: "legend_live_sessions", policy: "legend_live_sessions_write" },
  { table: "legend_session_registrations", policy: "legend_session_registrations_update" },
  { table: "lessons", policy: "lessons_write" },
  { table: "locations", policy: "locations_insert" },
  { table: "locations", policy: "locations_update" },
  { table: "lodging_assignment_details", policy: "lodging_assignment_details_iud" },
  { table: "maintenance_schedules", policy: "maint_sched_insert" },
  { table: "maintenance_schedules", policy: "maint_sched_update" },
  { table: "medical_encounters", policy: "medical_encounters_write__insert" },
  { table: "medical_encounters", policy: "medical_encounters_write__update" },
  { table: "mileage_logs", policy: "mileage_logs_insert" },
  { table: "mileage_logs", policy: "mileage_logs_update" },
  { table: "msa_state_transitions", policy: "msa_state_transitions_insert_collab" },
  { table: "onboarding_step_state_transitions", policy: "onboarding_step_state_transitions_insert_collab" },
  { table: "payment_application_lines", policy: "pay_app_lines_write__insert" },
  { table: "payment_application_lines", policy: "pay_app_lines_write__update" },
  { table: "payment_applications", policy: "pay_apps_update" },
  { table: "playbooks", policy: "playbooks_insert" },
  { table: "playbooks", policy: "playbooks_update" },
  { table: "po_change_order_lines", policy: "po_co_lines_write__insert" },
  { table: "po_change_order_lines", policy: "po_co_lines_write__update" },
  { table: "po_change_orders", policy: "po_co_update" },
  { table: "po_line_items", policy: "po_line_items_modify__insert" },
  { table: "po_line_items", policy: "po_line_items_modify__update" },
  { table: "prequalification_questionnaires", policy: "prequal_q_write__insert" },
  { table: "prequalification_questionnaires", policy: "prequal_q_write__update" },
  { table: "prequalification_questions", policy: "prequal_questions_write__insert" },
  { table: "prequalification_questions", policy: "prequal_questions_write__update" },
  { table: "production_phase_transitions", policy: "production_phase_transitions_insert_collab" },
  { table: "project_phase_transitions", policy: "project_phase_transitions_insert_collab" },
  { table: "project_photos", policy: "proj_photos_write__insert" },
  { table: "project_photos", policy: "proj_photos_write__update" },
  { table: "punch_items", policy: "punch_items_update" },
  { table: "punch_lists", policy: "punch_lists_write__insert" },
  { table: "punch_lists", policy: "punch_lists_write__update" },
  { table: "purchase_orders", policy: "purchase_orders_insert" },
  { table: "purchase_orders", policy: "purchase_orders_update" },
  { table: "rate_card_items", policy: "rate_card_items_admin__insert" },
  { table: "rate_card_items", policy: "rate_card_items_admin__update" },
  { table: "rentals", policy: "rentals_insert" },
  { table: "rentals", policy: "rentals_update" },
  { table: "requisitions", policy: "requisitions_insert" },
  { table: "requisitions", policy: "requisitions_update" },
  { table: "rfis", policy: "rfis_update" },
  { table: "rfq_response_lines", policy: "rfq_resp_lines_write__insert" },
  { table: "rfq_response_lines", policy: "rfq_resp_lines_write__update" },
  { table: "rfq_responses", policy: "rfq_resp_update" },
  { table: "rfqs", policy: "rfqs_org_modify__insert" },
  { table: "rfqs", policy: "rfqs_org_modify__update" },
  { table: "risks", policy: "risks_insert" },
  { table: "risks", policy: "risks_update" },
  { table: "safety_briefings", policy: "briefings_insert" },
  { table: "safety_briefings", policy: "briefings_update" },
  { table: "service_sla_policies", policy: "service_sla_policies_insert" },
  { table: "service_sla_policies", policy: "service_sla_policies_update" },
  { table: "shifts", policy: "shifts_admin__insert" },
  { table: "shifts", policy: "shifts_admin__update" },
  { table: "site_plan_pins", policy: "site_plan_pins_write__insert" },
  { table: "site_plan_pins", policy: "site_plan_pins_write__update" },
  { table: "site_plan_revisions", policy: "site_plan_rev_write__insert" },
  { table: "site_plan_revisions", policy: "site_plan_rev_write__update" },
  { table: "site_plans", policy: "site_plans_insert" },
  { table: "site_plans", policy: "site_plans_update" },
  { table: "sponsor_entitlements", policy: "sponsor_entitlements_admin__insert" },
  { table: "sponsor_entitlements", policy: "sponsor_entitlements_admin__update" },
  { table: "stage_plots", policy: "stage_plots_insert" },
  { table: "stage_plots", policy: "stage_plots_update" },
  { table: "submittal_revisions", policy: "submittal_rev_write__insert" },
  { table: "submittal_revisions", policy: "submittal_rev_write__update" },
  { table: "submittals", policy: "submittals_update" },
  { table: "subscription_state_transitions", policy: "subscription_state_transitions_insert_admin" },
  { table: "subscriptions", policy: "subscriptions_admin_insert" },
  { table: "subscriptions", policy: "subscriptions_admin_update" },
  { table: "threats", policy: "threats_insert" },
  { table: "threats", policy: "threats_update" },
  { table: "ticket_assignment_details", policy: "ticket_assignment_details_iud" },
  { table: "time_entries", policy: "time_entries_insert" },
  { table: "time_entries", policy: "time_entries_update" },
  { table: "trademarks", policy: "trademarks_rw" },
  { table: "travel_assignment_details", policy: "travel_assignment_details_iud" },
  { table: "vehicle_assignment_details", policy: "vehicle_assignment_details_iud" },
  { table: "vendor_prequalification_answers", policy: "vp_ans_write__insert" },
  { table: "vendor_prequalification_answers", policy: "vp_ans_write__update" },
  { table: "vendor_prequalifications", policy: "vp_insert" },
  { table: "vendor_prequalifications", policy: "vp_update" },
  { table: "vendors", policy: "vendors_insert" },
  { table: "vendors", policy: "vendors_update" },
  { table: "venue_build_log", policy: "venue_build_log_insert" },
  { table: "venue_build_log", policy: "venue_build_log_update" },
  { table: "venue_closeout_items", policy: "venue_closeout_insert" },
  { table: "venue_closeout_items", policy: "venue_closeout_update" },
  { table: "venue_design_specs", policy: "venue_design_specs_insert" },
  { table: "venue_design_specs", policy: "venue_design_specs_update" },
  { table: "venue_handover_items", policy: "venue_handover_insert" },
  { table: "venue_handover_items", policy: "venue_handover_update" },
  { table: "venue_vop_sections", policy: "venue_vop_insert" },
  { table: "venue_vop_sections", policy: "venue_vop_update" },
  { table: "work_order_broadcasts", policy: "wob_insert" },
  { table: "work_order_broadcasts", policy: "wob_update" },
  { table: "workforce_members", policy: "workforce_members_admin__insert" },
  { table: "workforce_members", policy: "workforce_members_admin__update" },
  { table: "xpms_atom_tiers", policy: "xpms_atom_tiers_write__insert" },
  { table: "xpms_atom_tiers", policy: "xpms_atom_tiers_write__update" },
  { table: "xpms_atoms", policy: "xpms_atoms_write__insert" },
  { table: "xpms_atoms", policy: "xpms_atoms_write__update" },
  { table: "xpms_project_composition", policy: "xpms_composition_write__insert" },
  { table: "xpms_project_composition", policy: "xpms_composition_write__update" },
  { table: "xpms_provenance_edges", policy: "xpms_edges_write__insert" },
  { table: "xpms_provenance_edges", policy: "xpms_edges_write__update" },
  { table: "xpms_variance_ledger", policy: "xpms_variance_write__insert" },
  { table: "xpms_variance_ledger", policy: "xpms_variance_write__update" },
];

/**
 * Return the body of the LAST `create policy "<policy>" on ... <table>`
 * statement across all migrations (sorted by filename = chronological),
 * or null if no migration defines it. The body runs from the `create
 * policy` keyword to the terminating semicolon.
 */
function lastPolicyBody(policy: string, table: string): string | null {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((n) => n.endsWith(".sql"))
    .sort();

  let body: string | null = null;
  // Match `create policy "<policy>" on "public"."<table>" ...;`
  // (case-insensitive; tolerant of optional quoting and whitespace).
  const re = new RegExp(`create\\s+policy\\s+"?${policy}"?\\s+on\\s+"?public"?\\."?${table}"?[\\s\\S]*?;`, "gi");
  for (const name of files) {
    const txt = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
    const matches = txt.match(re);
    if (matches && matches.length > 0) {
      body = matches[matches.length - 1]!;
    }
  }
  return body;
}

describe("proposal-lifecycle RLS manager canon", () => {
  for (const { table, policy } of GUARDED_WRITE_POLICIES) {
    it(`${policy} (on ${table}) grants 'manager' in its has_org_role band`, () => {
      const body = lastPolicyBody(policy, table);
      expect(body, `policy ${policy} on ${table} is not defined in any migration`).not.toBeNull();
      expect(body).toMatch(/has_org_role/i);
      // The band must include 'manager'. Without this, isManagerPlus()-gated
      // create/convert actions 500 at the DB for a real (non-owner-persona)
      // manager. See 20260612180000_proposal_rls_manager_grant.sql.
      expect(
        /'manager'/.test(body!),
        `policy ${policy} on ${table} omits 'manager' — app guard isManagerPlus admits it but RLS rejects the write`,
      ).toBe(true);
    });
  }
});
