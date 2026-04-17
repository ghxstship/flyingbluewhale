import re

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def parse_markdown(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find sections starting with "### 4."
    pattern = re.compile(r'### 4\.\d+\s+(.*?)\n(.*?)(?=### 4\.|\Z)', re.DOTALL)
    
    venues = []
    
    district_mappings = {
        'Wynwood (10)': ('Miami', 'wynwood'),
        'Design District (10)': ('Miami', 'design-district'),
        'Brickell (10)': ('Miami', 'brickell'),
        'Downtown Miami (10)': ('Miami', 'downtown-miami'),
        'Edgewater (10)': ('Miami', 'edgewater'),
        'Midtown (10)': ('Miami', 'midtown'),
        'Little Haiti (5) + Little River (5)': ('Miami', 'little-haiti'), # We'll need a fallback based on address
        'South Beach (10)': ('Miami Beach', 'south-beach'),
        'Mid Beach (7) + North Beach (3)': ('Miami Beach', 'mid-beach'),
        'Coconut Grove (10)': ('Miami', 'coconut-grove'),
        'Coral Gables (10)': ('Coral Gables', 'coral-gables'),
        'Doral (10)': ('Doral', 'doral'),
        'Hialeah (10)': ('Hialeah', 'hialeah'),
        'Key Biscayne + Virginia Key (10)': ('Key Biscayne', 'key-biscayne'),
        'Freedom Park District (10)': ('Miami', 'freedom-park')
    }

    def determine_loc_dist(address, section_title):
        if 'Little Haiti' in section_title and 'Little River' in section_title:
            if any(n in address for n in ['NW 79th St', 'NE 67th St', 'NE 61st St', 'NW Miami Ct', 'NW 2nd Ave']):
                return 'Miami', 'little-river'
            return 'Miami', 'little-haiti'
        if 'Mid Beach' in section_title and 'North Beach' in section_title:
            if '6801 Collins Ave' in address or '7275 Collins Ave' in address:
                return 'Miami Beach', 'north-beach'
            return 'Miami Beach', 'mid-beach'
        if 'Key Biscayne' in section_title and 'Virginia Key' in section_title:
            if 'Rickenbacker' in address or 'Virginia' in address or '33149' in address and ('Miami' in address.split(',')[-1]):
                return 'Miami', 'virginia-key'
            # Note: The seeds don't have a 'key-biscayne' district, it's just a locality!
            return 'Key Biscayne', None 
        return district_mappings.get(section_title, ('Miami', None))
    
    for match in pattern.finditer(content):
        section_title = match.group(1).strip()
        section_content = match.group(2).strip()
        
        for line in section_content.split('\n'):
            line = line.strip()
            if not line.startswith('|') or not line.endswith('|'):
                continue
            
            cols = [c.strip() for c in line.split('|')[1:-1]]
            if len(cols) != 11:
                continue
                
            num_str = cols[0]
            if not num_str.isdigit():
                continue
                
            num, name, address, vtype, cap, cap_range, phone, email, google, features, conf = cols
            
            addr_parts = address.split(',')
            addr_line_1 = addr_parts[0].strip()
            city_zip = addr_parts[-1].strip()
            zip_code = city_zip.split()[-1] if len(city_zip.split()) > 0 else ''
            
            locality_name, district_slug = determine_loc_dist(address, section_title)
            
            phone = phone if phone != '—' else None
            email = email if email != '—' else None
            google = google if google != '—' else None
            
            conf_map = {'H': 'high', 'M': 'medium', 'L': 'low'}
            conf_val = conf_map.get(conf, 'unverified')
            
            features_list = [f.strip() for f in features.split(',') if f.strip()]
            
            venues.append({
                'name': name,
                'slug': slugify(name),
                'venue_type_id': vtype,
                'address_line_1': addr_line_1,
                'postal_code': zip_code,
                'locality': locality_name,
                'district_slug': district_slug,
                'capacity_standing': int(cap) if cap.isdigit() else 'null',
                'capacity_range': cap_range,
                'phone': phone,
                'email': email,
                'google_rating': float(google) if google else 'null',
                'features': features_list,
                'confidence': conf_val
            })
            
    return venues

def generate_sql(venues):
    out = []
    out.append('set search_path = atlvs, public;\n')
    
    for v in venues:
        sql = f"""
DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='{v['locality']}';"""
  
        if v['district_slug']:
            sql += f"\n  select id into v_dist from districts where slug='{v['district_slug']}';"
        else:
            sql += "\n  v_dist := null;"
            
        sql += f"""
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='{v['venue_type_id']}';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    '{v['slug']}',
    '{v['name'].replace("'", "''")}',
    v_vt, '{v['address_line_1'].replace("'", "''")}', '{v['postal_code']}',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    {v['capacity_standing']}, '{v['capacity_range']}', true,
    '2026-04-16'::timestamptz, '{v['confidence']}'
  ) returning id into new_venue_id;
"""
        
        if v['email'] or v['phone']:
            email_clean = v['email'].replace(chr(34), '') if v['email'] else None
            email_val = f"'{email_clean}'" if email_clean else "null"
            phone_val = f"'{v['phone'].replace('-', '')}'" if v['phone'] else "null"
            if phone_val != "null" and not phone_val.startswith("'+"):
                phone_val = "'+1" + phone_val[1:]
                
            sql += f"""
  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', {email_val}, {phone_val}, true);
"""

        if v['google_rating'] != 'null':
            sql += f"""
  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', {v['google_rating']}, '2026-04-16'::timestamptz);
"""

        if v['features']:
            feature_list = ",".join(f"'{f}'" for f in v['features'])
            sql += f"""
  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ({feature_list});
"""

        sql += "END $$;\n"
        out.append(sql)
        
    return "\n".join(out)

if __name__ == "__main__":
    venues = parse_markdown("/Users/julianclarkson/Downloads/ATLVS_Venue_Database_Miami_Pilot.md")
    sql = generate_sql(venues)
    with open("/Users/julianclarkson/Documents/opus-one/supabase/migrations/20260417000003_atlvs_miami_pilot_data.sql", "w") as f:
        f.write(sql)
    print(f"Generated {len(venues)} venues.")
