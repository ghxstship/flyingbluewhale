import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api/api-response';

const STUB_RESPONSE = { error: 'Ticketing engine not yet enabled', status: 'stub' };

export async function POST(request: NextRequest) {
  void request;
  // TODO: Validate promo/comp code, return discount details and applicable tiers
  return NextResponse.json(STUB_RESPONSE, { status: 501 });
}
