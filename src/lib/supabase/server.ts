import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Safe wrapper for API routes — returns 401 JSON if auth fails
 * instead of throwing a 500.
 */
export async function withAuth<T>(
  handler: (supabase: Awaited<ReturnType<typeof createClient>>, user: { id: string; email?: string }) => Promise<T>
): Promise<T | Response> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(supabase, user);
  } catch {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
}
