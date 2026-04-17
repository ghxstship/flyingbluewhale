import os

modules = [
  'clients', 'leads', 'pipeline', 'campaigns', 'proposals',
  'equipment', 'fabrication', 'logistics', 'finance', 'budgets',
  'expenses', 'invoices', 'profitability', 'compliance',
  'crew', 'people', 'workloads', 'time', 'goals'
]

base_path = 'src/app/(platform)/console'

for mod in modules:
    mod_path = os.path.join(base_path, mod)
    os.makedirs(mod_path, exist_ok=True)
    
    page_path = os.path.join(mod_path, 'page.tsx')
    if not os.path.exists(page_path):
        name = ''.join(word.capitalize() for word in mod.split('-')) + 'Page'
        content = f"""import {{ ModuleHeader }} from '@/components/layout/ModuleHeader';

export default function {name}() {{
  return (
    <>
      <ModuleHeader title="{mod.replace('-', ' ').title()}" subtitle="Module incoming from Red Sea Lion ERP migration." />
      <div className="p-6">
        <div className="card p-8 border-dashed border-border flex items-center justify-center text-text-tertiary">
          This module is currently being ported to the ATLVS unified command center.
        </div>
      </div>
    </>
  );
}}
"""
        with open(page_path, 'w') as f:
            f.write(content)

print("Scaffolding complete.")
