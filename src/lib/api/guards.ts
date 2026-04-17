import { createClient } from '../supabase/server';
import { error, handleError } from './response';
import { NextRequest } from 'next/server';
import type { PlatformRole, ProjectRole } from '../supabase/types';
import { z } from 'zod';

export type GuardHandler<T = any> = (
  req: NextRequest,
  ctx: { user: { id: string; email?: string } },
  ...args: any[]
) => Promise<T>;

/**
 * Guards an API route ensuring the user is authenticated.
 */
export function requireAuth(handler: GuardHandler) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return error('Authentication required', 401);
      }

      return await handler(req, { user }, ...args);
    } catch (err) {
      return handleError(err);
    }
  };
}

/**
 * Validates request body using Zod schema
 */
export async function validateBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<T | null> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      throw err;
    }
    return null;
  }
}
