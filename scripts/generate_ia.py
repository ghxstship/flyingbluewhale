import os
import json
import re

APP_DIR = os.path.join(os.getcwd(), 'src', 'app')
OUT_FILE = os.path.join(os.getcwd(), 'scratch', 'ia-map.json')

inventory = {}

def extract_details(content):
    capabilities = set()
    rbac = set()
    
    # Simple regex based capability matching
    if re.search(r'\bfetch\(', content): capabilities.add("Data Fetching (Client/Server)")
    if re.search(r'\bapiOk\(|\bapiError\(', content): capabilities.add("API Response Generation")
    if '.select(' in content or 'supabase.' in content: capabilities.add("Database Read (Supabase)")
    if '.insert(' in content or '.update(' in content or '.delete(' in content: capabilities.add("Database Mutation")
    
    if '<form' in content or '<Form' in content: capabilities.add("Form Submission")
    if '<button' in content or '<Button' in content: capabilities.add("Action Trigger")
    if '<Link' in content: capabilities.add("Navigation")
        
    # RBAC matching
    if 'withAuth' in content: rbac.add("Authenticated")
    roles = ['Admin', 'Staff', 'Vendor', 'Artist', 'Client', 'Field_Crew']
    for role in roles:
        if role in content:
            rbac.add(role)
            
    return list(capabilities), list(rbac)

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    rel_path = os.path.relpath(file_path, APP_DIR)
    # Convert slashes and remove filenames
    clean_route = '/' + rel_path.replace('\\', '/').replace('/page.tsx', '').replace('page.tsx', '').replace('/layout.tsx', '').replace('layout.tsx', '')
    if clean_route == '/': clean_route = '/'
    
    platform = 'Shared'
    if '(platform)' in clean_route: platform = 'ATLVS'
    elif '(mobile)' in clean_route: platform = 'COMPVSS'
    elif '(portal)' in clean_route: platform = 'GVTEWAY'
    elif '(personal)' in clean_route: platform = 'Personal'
        
    node_level = 'Layout' if file_path.endswith('layout.tsx') else 'Page'
    
    parts = [p for p in clean_route.split('/') if p]
    base_name = 'Root' if not parts else parts[-1]
    name = f"{base_name} {'Layout' if node_level == 'Layout' else 'Page'}"
    
    capabilities, rbac = extract_details(content)
    
    if platform not in inventory:
        inventory[platform] = {
            "identity": { "name": platform, "level": "Platform", "parent": "Root", "path": f"/{platform.lower()}" },
            "capabilities": [],
            "relationships": { "upstream": [], "downstream": [] },
            "rbac": { "visibleTo": [] },
            "children": []
        }
        
    inventory[platform]["children"].append({
        "identity": {
            "name": name,
            "level": node_level,
            "parent": platform,
            "path": clean_route
        },
        "capabilities": capabilities if capabilities else ["Static Render"],
        "relationships": {
            "upstream": [],
            "downstream": []
        },
        "rbac": {
            "visibleTo": rbac if rbac else ["Public / Inherited"]
        },
        "children": []
    })

def main():
    for root, dirs, files in os.walk(APP_DIR):
        for file in files:
            if file in ['page.tsx', 'layout.tsx']:
                process_file(os.path.join(root, file))
                
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2)
        
    print(f"Generated {OUT_FILE}")

if __name__ == '__main__':
    main()
