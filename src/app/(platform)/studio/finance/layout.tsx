import { getSession, isManagerPlus } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { AccessDenied } from "@/components/ui/AccessDenied";

/**
 * REC-16 / SC-5 — page-level permission gate for the finance area.
 *
 * Threshold: manager-plus, matching the mutation gates the finance actions
 * already enforce (`isManagerPlus` in createInvoiceAction et al.) and the
 * CAPABILITIES matrix in src/lib/auth.ts, where invoices/expenses/budgets
 * live in the manager band. Members and portal personas previously saw
 * misleading empty states here; now they get an explicit denial.
 *
 * Server-side check only — layouts wrap server components, so no role
 * information leaks to the client beyond the rendered result. The
 * `!hasSupabase` escape keeps the dev "Configure Supabase" fallbacks
 * reachable when no backend is wired.
 */
export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabase) return <>{children}</>;
  const session = await getSession();
  if (!isManagerPlus(session)) return <AccessDenied requiredRole="Manager" />;
  return <>{children}</>;
}
