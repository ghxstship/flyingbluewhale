const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const APP_DIR = path.join(process.cwd(), 'src');
const OUT_FILE = path.join(process.cwd(), 'scratch', 'ia-deep-map.json');

const inventory = {};

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      fileList = walkDir(filePath, fileList);
    } else {
       if (file.endsWith('.tsx') || file.endsWith('.ts')) {
         fileList.push(filePath);
       }
    }
  }
  return fileList;
}

// Check for RBAC / Action rules globally in file
function extractFileLevelLogic(sourceFile, filePath) {
  const capabilities = new Set();
  const rbac = new Set();
  
  const text = sourceFile.text;
  if(text.includes('fetch(')) capabilities.add('Data Fetching');
  if(text.includes('supabase.')) capabilities.add('Database Read (Supabase)');
  if(text.includes('.insert(') || text.includes('.update(') || text.includes('.delete(')) capabilities.add('Database Mutation');
  if(text.includes('apiOk(') || text.includes('apiError(')) capabilities.add('API Execution');
  
  if (text.includes('withAuth') || text.includes('redirect(')) rbac.add('Authenticated');
  ['Admin', 'Staff', 'Vendor', 'Artist', 'Client', 'Field_Crew'].forEach(role => {
    if (text.includes(role)) rbac.add(role);
  });

  // Edge Middleware Fallback logic
  if(filePath.includes('/console') || filePath.includes('/m/') || filePath.includes('/p/') || filePath.includes('/me') || filePath.includes('/projects')) {
      rbac.add('Authenticated');
  }
  
  return { capabilities: Array.from(capabilities), rbac: Array.from(rbac) };
}

// Recursively build a 5-level component tree based on JSX AST
function parseJsxTree(node, sourceFile, depth = 3) {
  // depth 3: Component, depth 4: Element, depth 5: Micro-Interaction
  const children = [];
  
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    let tagName = '';
    let props = [];
    
    if (ts.isJsxElement(node)) {
      tagName = node.openingElement.tagName.getText(sourceFile);
      props = node.openingElement.attributes.properties || [];
    } else {
      tagName = node.tagName.getText(sourceFile);
      props = node.attributes.properties || [];
    }
    
    const isComponent = /^[A-Z]/.test(tagName);
    const level = isComponent ? 'Component' : 'Element';
    const currentDepth = isComponent ? 3 : 4;
    
    const elementNode = {
      identity: { Name: tagName, Level: level },
      children: []
    };
    
    // Find Micro-interactions (depth 5) from props
    for (const prop of props) {
      if (ts.isJsxAttribute(prop)) {
        const propName = prop.name.getText(sourceFile);
        if (
          propName.startsWith('on') || 
          propName === 'whileHover' || 
          propName === 'whileTap' || 
          propName === 'animate' ||
          propName === 'action'
        ) {
           let val = "Dynamic Handler";
           if(prop.initializer && ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
             val = prop.initializer.expression.getText(sourceFile);
             // Truncate long inline functions
             if (val.length > 50) val = val.substring(0, 50) + "...";
           }
           elementNode.children.push({
             identity: { Name: propName, Level: "Micro-Interaction" },
             behavior: `Invokes: ${val}`
           });
        }
      }
    }
    
    // Parse nested JSX
    if (ts.isJsxElement(node)) {
      for (const child of node.children) {
        elementNode.children.push(...parseJsxTree(child, sourceFile, currentDepth + 1));
      }
    }
    
    children.push(elementNode);
  } else {
    ts.forEachChild(node, child => {
       children.push(...parseJsxTree(child, sourceFile, depth));
    });
  }
  
  return children;
}

function extractJsxComponents(sourceFile) {
  const uiTree = [];
  ts.forEachChild(sourceFile, node => {
    // Only parse exported functions/components (specifically default exports which represent the Page)
    if (ts.isExportAssignment(node) || (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword))) {
      const parsedElements = parseJsxTree(node, sourceFile);
      uiTree.push(...parsedElements);
    }
    if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const parsedElements = parseJsxTree(node, sourceFile);
      uiTree.push(...parsedElements);
    }
  });
  return uiTree;
}

function processFiles() {
  const files = walkDir(APP_DIR);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = file.replace(APP_DIR, '');
    const cleanRoute = '/' + relativePath.replace(/\\/g, '/').replace('/page.tsx', '').replace(/page\.tsx$/, '').replace('/layout.tsx', '').replace(/layout\.tsx$/, '').replace(/\.tsx$/, '').replace(/\.ts$/, '');
    const finalRoute = cleanRoute === '/' ? '/' : cleanRoute.replace(/\/$/, '');
    
    let platform = 'Shared Library';
    if (finalRoute.includes('(platform)')) platform = 'ATLVS';
    else if (finalRoute.includes('(mobile)')) platform = 'COMPVSS';
    else if (finalRoute.includes('(portal)')) platform = 'GVTEWAY';
    else if (finalRoute.includes('(personal)')) platform = 'Personal';
    else if (finalRoute.includes('/components/')) platform = 'Component Library';
    else if (finalRoute.includes('/hooks/')) platform = 'Hooks';
    else if (finalRoute.includes('/lib/')) platform = 'Core Utilities';

    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    
    const logic = extractFileLevelLogic(sourceFile, finalRoute);
    const jsxTree = extractJsxComponents(sourceFile);
    
    const isLayout = file.endsWith('layout.tsx');
    const isPage = file.endsWith('page.tsx');
    let nodeLevel = 'Component';
    if (isLayout) nodeLevel = 'Layout';
    if (isPage) nodeLevel = 'Page';
    if (file.endsWith('.ts')) nodeLevel = 'Utility module';

    const nodeName = `${finalRoute.split('/').pop() || 'Root'} ${nodeLevel}`;

    if (!inventory[platform]) {
      inventory[platform] = {
        identity: { Name: platform, Level: 'Platform', Parent: 'Root', Path: `/${platform.toLowerCase()}` },
        capabilities: [], rbac: { visibleTo: [] }, children: []
      };
    }

    // Collapse empty hierarchies or group components into "Sections" (Level 2)
    // To avoid millions of lines, we logically group top level return elements as Sections.
    const sections = [];
    for (const treeNode of jsxTree) {
      // Create a section wrapper for primary chunks
      sections.push({
         identity: { Name: `${treeNode.identity.Name} Section`, Level: 'Section' },
         children: [ treeNode ]
      });
    }

    inventory[platform].children.push({
      identity: { Name: nodeName, Level: nodeLevel, Parent: platform, Path: finalRoute },
      capabilities: logic.capabilities.length ? logic.capabilities : ['Static Module'],
      relationships: { upstream: [], downstream: [] },
      rbac: { visibleTo: logic.rbac.length ? logic.rbac : ['Public / Inherited'] },
      children: sections
    });
  }

  if (!fs.existsSync(path.dirname(OUT_FILE))) {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(inventory, null, 2));
  console.log(`Generated Deep IA Map at ${OUT_FILE}`);
}

processFiles();
