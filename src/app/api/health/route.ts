import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check DB connectivity
    const { error } = await supabase.from('projects').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { status: 'error' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { status: 'error' },
      { status: 503 }
    );
  }
}
