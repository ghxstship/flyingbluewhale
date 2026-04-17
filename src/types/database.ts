/** Database types — re-exports from supabase types + application-level aliases */
export type { Database, Json } from '@/lib/supabase/database.types';
export type { Tables, TablesInsert, TablesUpdate, Enums } from '@/lib/supabase/database.types';

/* ═══════════════════════════════════════════
   Application-level type aliases
   Forward-declared types for modules that
   don't yet have DB-generated equivalents.
   ═══════════════════════════════════════════ */

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'proposal_sent'
  | 'negotiation'
  | 'verbal_yes'
  | 'contract_signed'
  | 'on_hold'
  | 'closed_won'
  | 'closed_lost'
  | 'lost';

export interface Deal {
  id: string;
  title: string;
  client_name: string | null;
  value: number;
  deal_value: number;
  stage: DealStage;
  probability: number;
  expected_close: string | null;
  expected_close_date: string | null;
  owner_name: string | null;
  owner_id: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

/** DealWithClient is Deal with joined client info */
export type DealWithClient = Deal & {
  clients?: { id: string; company_name: string } | null;
};

export interface VenueActivationDates {
  load_in?: string;
  show_day?: string;
  strike?: string;
  start?: string;
  end?: string;
}

export interface VenueLoadInStrike {
  load_in_start?: string;
  load_in_end?: string;
  strike_start?: string;
  strike_end?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

export interface NarrativeContext {
  overview?: string;
  objectives?: string[];
  audience?: string;
  [key: string]: any;
}

export interface PaymentTerms {
  type?: 'net_30' | 'net_60' | 'net_90' | 'upon_completion' | 'milestone' | 'custom';
  description?: string;
  milestones?: Array<{ label: string; percentage: number }>;
}

/** RequirementAssignee — used as a string ID in the proposals builder */
export type RequirementAssignee = string;
