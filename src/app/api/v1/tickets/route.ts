import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api/api-response';

const STUB_RESPONSE = { error: 'Ticketing engine not yet enabled', status: 'stub' };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  if (!projectId) return apiError('project_id required', 400);
  // TODO: List / search tickets for project
  return apiError(STUB_RESPONSE.error, 501);
}

export async function POST(request: NextRequest) {
  void request;
  // TODO: Purchase / reserve ticket
  return apiError(STUB_RESPONSE.error, 501);
}
