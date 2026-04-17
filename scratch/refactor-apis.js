const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../src/app/api/v1');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const RE_GET = /(?:export\s+)?async\s+function\s+GET\s*\(\s*request\s*:\s*NextRequest\s*\)\s*\{([\s\S]*?)try\s*\{([\s\S]*?)\} catch\s*(?:\([^)]+\))?\s*\{[\s\S]*?\}\n\}/;

const RE_FN = /(?:export\s+)?async\s+function\s+(GET|POST|PATCH|DELETE)\s*\(\s*request\s*:\s*NextRequest\s*\)\s*\{([\s\S]*?)try\s*\{([\s\S]*?)\} catch\s*(?:\([^)]+\))?\s*\{[\s\S]*?\}\n\}/g;

const RE_NEXTRESPONSE = /return\s+NextResponse\.json\(\s*\{\s*data\s*(?:,\s*meta:\s*({[^}]+}))?\s*\}\s*(?:,\s*\{\s*status:\s*(\d+)\s*\}\s*)?\)/g;

const RE_ERROR = /return\s+NextResponse\.json\(\s*\{\s*error\s*:\s*([^}]+)\s*\}\s*,\s*\{\s*status:\s*(\d+)\s*\}\s*\)/g;

function sanitizeBlock(innerBody) {
  // Replace const supabase = await createClient(); with const supabase = await createClient();
  // But wait, the standard requireAuth provides it.
  // Actually, let's keep createClient() inside for now because it handles cookies per request.
  
  // Replace return NextResponse.json({ data, meta: ... }) with return success(data, meta);
  let b = innerBody.replace(RE_NEXTRESPONSE, (match, meta, status) => {
    let args = ['data'];
    if (meta) args.push(meta);
    else if (status) args.push('undefined');
    
    if (status) args.push(status);
    return `return success(${args.join(', ')});`;
  });

  // Replace error.message returns with return handleError(error)
  b = b.replace(/if\s*\(\s*error\s*\)\s*return\s+NextResponse\.json\(\{\s*error\s*:\s*error\.message\s*\}\s*,\s*\{\s*status:\s*400\s*\}\);/g, "if (error) return handleError(error);");
  
  // Replace other custom errors with return error(...)
  b = b.replace(RE_ERROR, (match, msg, status) => {
    return `return error(${msg}, ${status});`;
  });

  // Remove the `const { data: { user } } = await supabase.auth.getUser(); if (!user) return ` block since requireAuth handles it
  b = b.replace(/const\s+\{\s*data\s*:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\);\s*if\s*\(!user\)\s+return\s+error[^;]+;/g, '');

  return b.trim();
}

function processFile(filePath) {
  if (!filePath.endsWith('route.ts')) return;
  // skip the ones we already did
  if (filePath.includes('/projects/') || filePath.includes('/deliverables/') || filePath.includes('/allocations/') || filePath.includes('/credentials/orders/route.ts')) return;
  // skip docs or master endpoints
  // we do the rest

  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  let hasChanges = false;

  content = content.replace(RE_FN, (match, method, beforeTry, innerTry) => {
    hasChanges = true;
    let sanitized = sanitizeBlock(innerTry);
    
    return `export const ${method} = requireAuth(async (request: NextRequest) => {\n  ${sanitized}\n});`;
  });

  if (hasChanges) {
    if (!content.includes('requireAuth')) {
      content = `import { requireAuth } from '@/lib/api/guards';\nimport { success, error, handleError } from '@/lib/api/response';\n` + content;
    } else {
        // if imports not present
        if (!content.includes(`import { requireAuth`)) {
            content = `import { requireAuth } from '@/lib/api/guards';\nimport { success, error, handleError } from '@/lib/api/response';\n` + content;
        }
    }
    
    // remove NextResponse if not used
    if (!content.includes('NextResponse.')) {
        content = content.replace(/,\s*NextResponse/, '');
        content = content.replace(/NextResponse,\s*/, '');
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

walkDir(targetDir, processFile);
