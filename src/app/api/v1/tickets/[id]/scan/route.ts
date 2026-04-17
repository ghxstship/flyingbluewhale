import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api/api-response';

const STUB_RESPONSE = { error: 'Ticketing engine not yet enabled', status: 'stub' };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request;
  void params;
  // TODO: Record ticket scan at gate (alternative to unified /check-in/scan route)
  return apiError(STUB_RESPONSE.error, 501);
}
