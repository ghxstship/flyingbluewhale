const fs = require('fs');
const path = require('path');

const modules = [
  'clients', 'leads', 'pipeline', 'campaigns', 'proposals',
  'equipment', 'fabrication', 'logistics', 'finance', 'budgets',
  'expenses', 'invoices', 'profitability', 'compliance',
  'crew', 'people', 'workloads', 'time', 'goals'
];

const basePath = path.join(__dirname, '../src/app/(platform)/console');

modules.forEach(mod => {
  const modPath = path.join(basePath, mod);
  if (!fs.existsSync(modPath)) {
    fs.mkdirSync(modPath, { recursive: true });
  }
  
  const pagePath = path.join(modPath, 'page.tsx');
  if (!fs.existsSync(pagePath)) {
    const componentName = mod.charAt(0).toUpperCase() + mod.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase()) + 'Page';
    const content = `import { ModuleHeader } from '@/components/layout/ModuleHeader';

export default function ${componentName}() {
  return (
    <>
      <ModuleHeader title="${mod.charAt(0).toUpperCase() + mod.slice(1).replace('-', ' ')}" subtitle="Module incoming from Red Sea Lion ERP migration." />
      <div className="p-6">
        <div className="card p-8 border-dashed border-border flex items-center justify-center text-text-tertiary">
          This module is currently being ported to the ATLVS unified command center.
        </div>
      </div>
    </>
  );
}
`;
    fs.writeFileSync(pagePath, content);
  }
});

console.log('Scaffolding complete.');
