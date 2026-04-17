/* ═══════════════════════════════════════════════════════
   Structured Logging
   Standardizes console logging into structured JSON formats
   for proper ingestion by Datadog / CloudWatch / Sentry.
   ═══════════════════════════════════════════════════════ */

import { headers } from 'next/headers';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  requestId?: string;
  error?: Error | unknown;
}

class Logger {
  private format(payload: LogPayload): string {
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(payload);
    }
    
    // Pretty print for development
    const base = `[${payload.timestamp}] ${payload.level.toUpperCase()}: ${payload.message}`;
    const ctx = payload.context ? `\nContext: ${JSON.stringify(payload.context, null, 2)}` : '';
    const req = payload.requestId ? ` [Request ID: ${payload.requestId}]` : '';
    const err = payload.error ? `\nError: ${payload.error instanceof Error ? payload.error.stack : String(payload.error)}` : '';
    return `${base}${req}${ctx}${err}`;
  }

  private async getRequestId(): Promise<string | undefined> {
    try {
      const headersList = await headers();
      return headersList.get('x-request-id') ?? undefined;
    } catch {
      return undefined;
    }
  }

  private async log(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
    const requestId = await this.getRequestId();
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId,
    };

    if (context) payload.context = context;
    if (error) payload.error = error;

    const formatted = this.format(payload);

    switch (level) {
      case 'debug': console.debug(formatted); break;
      case 'info': console.info(formatted); break;
      case 'warn': console.warn(formatted); break;
      case 'error': console.error(formatted); break;
    }
  }

  debug(message: string, context?: LogContext) {
    void this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    void this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    void this.log('warn', message, context);
  }

  error(message: string, error?: unknown, context?: LogContext) {
    void this.log('error', message, context, error);
  }
}

export const logger = new Logger();
