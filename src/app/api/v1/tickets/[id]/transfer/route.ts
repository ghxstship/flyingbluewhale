import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api/api-response';

const STUB_RESPONSE = { error: 'Ticketing engine not yet enabled', status: 'stub' };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request;
  void params;
  // TODO: Initiate ticket transfer to another user/email
  return NextResponse.json(STUB_RESPONSE, { status: 501 });
}
