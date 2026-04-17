/* ═══════════════════════════════════════════════════════
   DEPRECATED: Legacy ERP Types
   
   These interfaces have been superseded by the canonical
   types in '@/lib/supabase/types.ts' as of the Red Sea Lion
   Role Lifecycle Audit (migrations 007-014).
   
   Canonical replacements:
   - Deal         → No direct replacement (CRM not yet built)
   - Expense      → import { Expense } from '@/lib/supabase/types'
   - Invoice      → import { Invoice } from '@/lib/supabase/types'
   - Person       → import { Person } from '@/lib/supabase/types'
   - ApprovalStatus → import { ExpenseStatus } from '@/lib/supabase/types'
   - InvoiceStatus  → import { InvoiceStatus } from '@/lib/supabase/types'
   - EmploymentType → import { EmploymentType } from '@/lib/supabase/types'
   
   This file is retained for reference only. Do NOT import from it.
   ═══════════════════════════════════════════════════════ */

/** @deprecated Use `import { Expense } from '@/lib/supabase/types'` */
export type { Expense } from '@/lib/supabase/types';

/** @deprecated Use `import { Invoice } from '@/lib/supabase/types'` */
export type { Invoice } from '@/lib/supabase/types';

/** @deprecated Use `import { Person } from '@/lib/supabase/types'` */
export type { Person } from '@/lib/supabase/types';

/** @deprecated Use `import { InvoiceStatus } from '@/lib/supabase/types'` */
export type { InvoiceStatus } from '@/lib/supabase/types';

/** @deprecated Use `import { EmploymentType } from '@/lib/supabase/types'` */
export type { EmploymentType } from '@/lib/supabase/types';

/** @deprecated Use `import { ExpenseStatus } from '@/lib/supabase/types'` as ApprovalStatus */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/** @deprecated No backing table yet — CRM not implemented */
export interface Deal {
  id: string;
  title: string;
  deal_value: number;
  stage: string;
  probability: number | null;
  expected_close_date: string | null;
}
