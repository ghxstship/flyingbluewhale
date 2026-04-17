import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api/api-response';

const STUB_RESPONSE = { error: 'Ticketing engine not yet enabled', status: 'stub' };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  // TODO: List ticket tiers for project
  return NextResponse.json(STUB_RESPONSE, { status: 501 });
}

export async function POST(request: NextRequest) {
  void request;
  // TODO: Create ticket tier
  return NextResponse.json(STUB_RESPONSE, { status: 501 });
}
