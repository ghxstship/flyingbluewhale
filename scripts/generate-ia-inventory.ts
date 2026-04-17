import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const APP_DIR = path.join(process.cwd(), 'src', 'app');
const OUT_FILE = path.join(process.cwd(), 'scratch', 'ia-map.json');

// Interface defining the collected node
interface NodeIA {
  identity: {
    name: string;
    level: string;
    parent: string | null;
    path: string;
  };
  capabilities: string[];
  relationships: {
    upstream: string[];
    downstream: string[];
    imports: string[];
  };
  rbac: {
    visibleTo: string[];
  };
  children: NodeIA[];
}

// Global inventory map
const inventory: Record<string, NodeIA> = {};

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      fileList = walkDir(path.join(dir, file), fileList);
    } else {
      if (file === 'page.tsx' || file === 'layout.tsx') {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

function extractDetails(sourceFile: ts.SourceFile): {
  capabilities: string[];
  imports: string[];
  rbac: string[];
} {
  const capabilities = new Set<string>();
  const imports = new Set<string>();
  const rbac = new Set<string>();

  function visit(node: ts.Node) {
    // Collect Imports
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const importPath = node.moduleSpecifier.text;
        if (!importPath.startsWith('react') && !importPath.startsWith('next')) {
          imports.add(importPath);
        }
      }
    }

    // Collect API / Capabilities (Fetch, apiOk, Submit functions)
    if (ts.isCallExpression(node)) {
      const expressionText = node.expression.getText(sourceFile);
      if (expressionText === 'fetch') {
        capabilities.add('Data Fetching (Client/Server)');
      } else if (expressionText.includes('.select') || expressionText.includes('supabase.')) {
        capabilities.add('Database Read (Supabase)');
      } else if (expressionText.includes('.insert') || expressionText.includes('.update') || expressionText.includes('.delete')) {
        capabilities.add('Database Mutation (Supabase)');
      } else if (expressionText.includes('apiOk') || expressionText.includes('apiError')) {
        capabilities.add('API Response Generation');
      }
    }

    // Identify RBAC / auth guards
    if (ts.isIdentifier(node)) {
      const text = node.getText(sourceFile);
      if (text === 'withAuth') rbac.add('Authenticated');
      if (text.includes('Admin')) rbac.add('Admin');
      if (text.includes('Staff')) rbac.add('Staff');
      if (text.includes('Vendor')) rbac.add('Vendor');
      if (text.includes('Artist')) rbac.add('Artist');
      if (text.includes('Client')) rbac.add('Client');
      if (text.includes('Field_Crew')) rbac.add('Field_Crew');
    }

    // Actions
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = node.tagName.getText(sourceFile);
      if (name === 'form' || name === 'Form') capabilities.add('Form Submission');
      if (name === 'button' || name === 'Button') capabilities.add('Action Trigger');
      if (name === 'Link') capabilities.add('Navigation');
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    capabilities: Array.from(capabilities),
    imports: Array.from(imports),
    rbac: Array.from(rbac),
  };
}

function processFiles() {
  const files = walkDir(APP_DIR);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = file.replace(APP_DIR, '');
    const cleanRoute = relativePath.replace(/\\/g, '/').replace('/page.tsx', '').replace('/layout.tsx', '') || '/';
    
    // Group logic based on routing
    let platform = 'Shared';
    if (cleanRoute.includes('(platform)')) platform = 'ATLVS';
    else if (cleanRoute.includes('(mobile)')) platform = 'COMPVSS';
    else if (cleanRoute.includes('(portal)')) platform = 'GVTEWAY';
    else if (cleanRoute.includes('(personal)')) platform = 'Personal';

    let nodeLevel = file.endsWith('layout.tsx') ? 'Layout' : 'Page';

    const sourceFile = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const { capabilities, imports, rbac } = extractDetails(sourceFile);

    const nodeName = file.endsWith('layout.tsx') 
      ? `${cleanRoute === '/' ? 'Root' : cleanRoute.split('/').pop()} Layout` 
      : `${cleanRoute === '/' ? 'Home' : cleanRoute.split('/').pop()} Page`;

    const identity = {
      name: nodeName,
      level: nodeLevel,
      parent: platform,
      path: cleanRoute
    };

    if (!inventory[platform]) {
      inventory[platform] = {
        identity: { name: platform, level: 'Platform', parent: 'Root', path: `/${platform.toLowerCase()}` },
        capabilities: [],
        relationships: { upstream: [], downstream: [], imports: [] },
        rbac: { visibleTo: [] },
        children: []
      };
    }

    const nodeIA: NodeIA = {
      identity,
      capabilities: capabilities.length ? capabilities : ['Static Render'],
      relationships: {
        upstream: [],
        downstream: [],
        imports: imports
      },
      rbac: {
        visibleTo: rbac.length ? rbac : ['Public / Inherited']
      },
      children: []
    };

    inventory[platform].children.push(nodeIA);
  }

  // Ensure scratch directory exists
  if (!fs.existsSync(path.dirname(OUT_FILE))) {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(inventory, null, 2));
  console.log(`IA Map generated at ${OUT_FILE}`);
}

processFiles();
