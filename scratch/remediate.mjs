import fs from 'fs';
import path from 'path';

const routes = [
  'src/app/api/v1/tickets/tiers/route.ts',
  'src/app/api/v1/tickets/route.ts',
  'src/app/api/v1/tickets/[id]/transfer/route.ts',
  'src/app/api/v1/tickets/[id]/scan/route.ts',
  'src/app/api/v1/tickets/promo/validate/route.ts',
  'src/app/api/v1/check-in/scan/route.ts',
  'src/app/api/v1/master-schedule/conflicts/route.ts',
  'src/app/api/v1/master-schedule/route.ts',
  'src/app/api/v1/entity-assets/[id]/route.ts',
  'src/app/api/v1/documents/route.ts',
  'src/app/api/v1/credentials/orders/[id]/transition/route.ts',
];

function remediateEndpoint(code) {
  let modified = code;
  
  // Replace NextResponse.json with apiOk/apiError
  if (modified.includes('NextResponse.json')) {
    if (!modified.includes('api-response')) {
      modified = `import { withAuth, apiOk, apiError, apiCreated } from '@/lib/api/api-response';\n` + modified;
    }
  }

  // Rewrite NextResponse.json errors: return NextResponse.json({ error: 'xxx' }, { status: xyz }) -> return apiError('xxx', xyz)
  modified = modified.replace(/return NextResponse\.json\(\{\s*error:\s*([^}]+)\s*\}\s*,\s*\{\s*status:\s*(\d+)\s*\}\s*\);?/g, "return apiError($1, $2);");
  modified = modified.replace(/return NextResponse\.json\(\{\s*error:\s*([^}]+)\s*\}\);?/g, "return apiError($1);");
  
  // Rewrite NextResponse.json data: return NextResponse.json({ data... }) -> return apiOk(data...)
  modified = modified.replace(/return NextResponse\.json\(\{\s*data\s*\}\);?/g, "return apiOk(data);");
  modified = modified.replace(/return NextResponse\.json\(\{\s*data:\s*([^}]+)\s*\}\);?/g, "return apiOk($1);");

  // Rewrite NextResponse.json STUB => apiError
  modified = modified.replace(/return NextResponse\.json\(STUB_RESPONSE,\s*\{\s*status:\s*501\s*\}\);?/g, "return apiError('Not implemented', 501);");

  // withAuth refactoring
  modified = modified.replace(/export async function (GET|POST|PATCH|DELETE)\(request: NextRequest([^{]*)\)\s*\{([\s\S]*?)try\s*\{\s*([\s\S]*?)(?:const supabase = await createClient\(\);|)\s*(?:const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);|)\s*(?:if \(!user\) return apiError\('Unauthorized', 401\);|\s*)\s*([\s\S]*?)\} catch \{([^}]*)\}\s*\}/g, (match, method, args, preTry, internalBody, catchBlock) => {
    
    // Some routes have `void request;` etc inside them, we clean it.
    let cleanBody = internalBody.replace(/const supabase = await createClient\(\);?/g, '');
    cleanBody = cleanBody.replace(/const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);?/g, '');
    cleanBody = cleanBody.replace(/if \(\!user\) return apiError\('Unauthorized', 401\);?/g, '');

    return `export const ${method} = withAuth(async (request: NextRequest, user, supabase, context${args ? args.replace(',', ':').split(':')[1] || '' : ''}) => {${preTry}${cleanBody}});`;
  });

  return modified;
}

for (const fp of routes) {
  const absolutePath = path.resolve('/Users/julianclarkson/Documents/opus-one', fp);
  if (!fs.existsSync(absolutePath)) continue;
  const original = fs.readFileSync(absolutePath, 'utf8');
  let transformed = remediateEndpoint(original);
  if (original !== transformed) {
    fs.writeFileSync(absolutePath, transformed, 'utf8');
    console.log(`Remediated: ${fp}`);
  }
}
