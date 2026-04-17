import { NextResponse } from 'next/server';

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    total?: number;
    offset?: number;
    limit?: number;
    has_more?: boolean;
  };
}

/**
 * Standard HTTP success response
 */
export function success<T>(data: T, meta?: ApiResponse<T>['meta'], status = 200) {
  return NextResponse.json({ data, meta }, { status });
}

/**
 * Standard HTTP error response
 */
export function error(message: string, status = 400, code?: string, details?: any) {
  return NextResponse.json({ error: { message, code, details } }, { status });
}

/**
 * Maps raw database/system errors to safe client messages
 */
export function sanitizeError(err: any): { message: string; status: number } {
  // Log the real error internally
  console.error('[API Error]:', err);

  if (!err) {
    return { message: 'An unknown error occurred', status: 500 };
  }

  // Supabase PGRST errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return { message: 'This record already exists.', status: 409 };
      case '23503': // foreign_key_violation
        return { message: 'Referenced record does not exist or is still in use.', status: 400 };
      case '42501': // insufficient_privilege (RLS)
        return { message: 'You do not have permission to perform this action.', status: 403 };
      case 'PGRST116': // zero rows from single()
        return { message: 'Record not found.', status: 404 };
    }
  }

  if (err.name === 'ZodError') {
    return { message: 'Validation failed', status: 400 };
  }

  // Fallback for string messages that shouldn't leak
  const msg = typeof err.message === 'string' ? err.message : String(err);
  if (msg.includes('row level security') || msg.includes('relation') || msg.includes('column')) {
    return { message: 'A database error occurred. Please contact support.', status: 500 };
  }

  return { message: msg, status: 400 };
}

/**
 * Wraps DB errors in the standard envelope
 */
export function handleError(err: any) {
  const { message, status } = sanitizeError(err);
  return error(message, status);
}
