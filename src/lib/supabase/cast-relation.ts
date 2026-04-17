/** Stub: cast-relation — safely casts Supabase relation results */

/**
 * Casts a Supabase relation result from its raw form to the expected type.
 * Handles the case where Supabase returns `{ [key]: value }` or `null`.
 */
export function castRelation<T>(relation: unknown): T | null {
  if (!relation || typeof relation !== 'object') return null;
  return relation as T;
}

/**
 * Casts a Supabase array relation result.
 */
export function castRelationArray<T>(relation: unknown): T[] {
  if (!Array.isArray(relation)) return [];
  return relation as T[];
}

export default castRelation;
