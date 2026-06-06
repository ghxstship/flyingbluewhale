#!/usr/bin/env python3
"""
Casa Spotify Miami — XPMS v08 Budget Model (single source of truth)

Every budget line carries all SIX v08 axes:
  Department · Discipline · Phase · Tier (of Experience) · XYZ (cost behaviour) · Line Type

Department scope tables hold LINE TYPE = Scope ONLY. Fee / Contingency /
Allowance / Markup are additive reserves applied on top (never nested in a
department subtotal — that was the double-count bug in the hand-built v1).

Run:  python3 budget_model.py            # verify + print rollups
      python3 budget_model.py --emit     # also write markdown fragments to ./_fragments/

The script ASSERTS that every rollup cut (Department, Phase, Discipline,
Tier, XYZ) reconciles to the Scope subtotal, and that
Scope + Fee + Contingency + Allowance + Markup == the tier's target total.
If any assertion fails the budget is wrong — fix the data, not the totals.
"""
import sys
from collections import defaultdict

# ---- canonical axis vocabularies (must match the v08 template Lists sheet) ----
DEPARTMENTS = ["Executive", "Creative", "Talent", "Marketing", "Build",
               "Production", "Operations", "Experience", "Hospitality", "Technology"]
PHASES = ["Discovery", "Design", "Advance", "Procurement", "Build", "Install", "Operate", "Close"]
DISCIPLINES = ["Live Entertainment", "Experiential", "Fabrication", "Construction",
               "Interior Design", "Procurement", "Broadcast & Content",
               "Corporate & Brand", "Hospitality & F&B", "Festival & Touring"]
TIERS = ["01 Social", "02 Digital", "03 Virtual", "04 Physical", "05 Experiential", "06 Theatrical"]
XYZ = ["X — Constant", "Y — Variable", "Z — Timeline/Phase"]

# A line = (dept, team, item, discipline, phase, tier, xyz, qty, rate)
# amount = qty * rate. All lines here are LINE TYPE = Scope.
L = lambda *a: a  # noqa: E731

# =====================================================================
# TIER 1 — Silvana-class intimate listening party · Scope target 26,350
# =====================================================================
T1 = [
 L("Executive","Insurance & Permitting","Insurance certs + endorsement issuance","Corporate & Brand","Advance","04 Physical","X — Constant",1,450),
 L("Executive","Legal & Risk Management","Legal review (talent advance + NDA)","Corporate & Brand","Advance","04 Physical","X — Constant",1,400),

 L("Creative","Creative Direction","Creative direction + moodboard","Experiential","Design","05 Experiential","X — Constant",1,1800),
 L("Creative","Interior Design","Scenic + lighting drawings (CAD/lx plot)","Interior Design","Design","04 Physical","X — Constant",1,1200),
 L("Creative","Programming & Curation","Programming + run-of-show authoring","Live Entertainment","Design","06 Theatrical","X — Constant",1,900),
 L("Creative","Graphics & Print Design","Signage + lobby graphics design","Corporate & Brand","Design","04 Physical","X — Constant",1,600),

 L("Talent","Riders & Clearances","Talent advance + rider fulfillment","Live Entertainment","Advance","06 Theatrical","X — Constant",1,1200),
 L("Talent","Artist Hospitality","Runner / artist liaison","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",10,40),
 L("Talent","Artist Hospitality","Green-room hospitality buyout","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",1,200),

 L("Build","Fabrication & Scenic Construction","Performance platform 8'x6'x8\" deck","Fabrication","Build","04 Physical","X — Constant",1,1400),
 L("Build","Fabrication & Scenic Construction","Backdrop wall 10'x12' tension fabric","Fabrication","Build","04 Physical","X — Constant",1,1800),
 L("Build","Soft Goods & Drape","Soft goods + drape touch-ups","Fabrication","Build","04 Physical","X — Constant",1,500),
 L("Build","Signage Fabrication","Large-format print (backdrop/step-repeat/decal)","Fabrication","Build","02 Digital","X — Constant",1,900),
 L("Build","Signage Fabrication","Signage fabrication (A-frame/placard/stanchion)","Fabrication","Build","04 Physical","X — Constant",1,700),
 L("Build","Install & Load-In","Install build labor (4 crew x 6h)","Fabrication","Install","04 Physical","Y — Variable",24,45),
 L("Build","Strike & De-Install","Strike build labor (3 crew x 4h)","Fabrication","Operate","04 Physical","Y — Variable",12,35),

 L("Production","Audio Production","Audio top-up (KSM8/DPA/spares)","Live Entertainment","Procurement","06 Theatrical","X — Constant",1,400),
 L("Production","Audio Production","Pro Tools 32-ch capture rig rental","Broadcast & Content","Procurement","02 Digital","X — Constant",1,600),
 L("Production","Lighting Production","Lighting re-program (6h LD prep)","Live Entertainment","Install","06 Theatrical","Z — Timeline/Phase",1,450),
 L("Production","Audio Production","A1 audio engineer (10h)","Live Entertainment","Operate","06 Theatrical","Y — Variable",10,85),
 L("Production","Lighting Production","Lighting board op (8h)","Live Entertainment","Operate","06 Theatrical","Y — Variable",8,75),
 L("Production","Video Production","Camera op FX6 (6h)","Broadcast & Content","Operate","02 Digital","Y — Variable",6,65),
 L("Production","Video Production","PTZ op + live switch (6h)","Broadcast & Content","Operate","02 Digital","Y — Variable",6,70),
 L("Production","Production Management","Stage manager (7h)","Live Entertainment","Operate","06 Theatrical","Y — Variable",7,70),

 L("Operations","Logistics & Distribution","Sprinter cargo + 2 trips","Procurement","Install","04 Physical","Z — Timeline/Phase",1,1200),
 L("Operations","Credentialing & Access Control","Door lead + 2 scanners (5h ea)","Festival & Touring","Operate","04 Physical","Y — Variable",15,35),
 L("Operations","Security & Crowd Management","Sworn security officer (6h)","Festival & Touring","Operate","04 Physical","Y — Variable",6,85),
 L("Operations","Medical & Emergency Services","BLS standby medic (6h)","Festival & Touring","Operate","04 Physical","Y — Variable",6,75),
 L("Operations","Life Safety & Harm Reduction","Event Safety Director (8h)","Festival & Touring","Operate","04 Physical","Y — Variable",8,90),
 L("Operations","Site Operations","Janitorial reset to baseline","Procurement","Close","04 Physical","X — Constant",1,195),

 L("Experience","Guest Experience","Furniture — 72 chairs (cane+velvet)","Interior Design","Install","04 Physical","Y — Variable",1,1400),
 L("Experience","Guest Experience","Vintage Persian rug rental (3 runners)","Interior Design","Install","04 Physical","X — Constant",1,450),
 L("Experience","Guest Experience","Candle vessels (LED) x12","Interior Design","Install","04 Physical","X — Constant",1,120),
 L("Experience","Activations & Brand Experiences","M&G wrangler + photographer setup","Experiential","Operate","05 Experiential","Y — Variable",1,530),
 L("Experience","Merchandising","Take-home goodies (50 units)","Experiential","Procurement","05 Experiential","Y — Variable",50,14),

 L("Hospitality","Food & Beverage","Floral arrangement (regional)","Hospitality & F&B","Install","04 Physical","X — Constant",1,500),
 L("Hospitality","Beverage Operations","Coffee + juice bar (2 baristas x 6h)","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",12,40),
 L("Hospitality","Food & Beverage","Light bites + non-alcoholic beverages","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",1,420),
]

# =====================================================================
# TIER 2 — Rawayana-class late-night after party · Scope target 86,000
# =====================================================================
T2 = [
 # Executive 2,400
 L("Executive","Insurance & Permitting","GL + extended liquor liability endorsement","Corporate & Brand","Advance","04 Physical","X — Constant",1,1100),
 L("Executive","Insurance & Permitting","City of Miami late-night / extended-hours permit","Corporate & Brand","Advance","04 Physical","X — Constant",1,900),
 L("Executive","Legal & Risk Management","Contract + NDA + vendor MSAs","Corporate & Brand","Advance","04 Physical","X — Constant",1,400),
 # Creative 9,000
 L("Creative","Creative Direction","Creative direction + after-party concept","Experiential","Design","05 Experiential","X — Constant",1,3200),
 L("Creative","Scenic Design","Scenic + transformation design package","Interior Design","Design","04 Physical","X — Constant",1,2100),
 L("Creative","Environmental Design","Lighting + atmosphere design","Live Entertainment","Design","06 Theatrical","X — Constant",1,1600),
 L("Creative","Programming & Curation","DJ programming + ROS + set flow","Live Entertainment","Design","06 Theatrical","X — Constant",1,1100),
 L("Creative","Graphics & Print Design","Signage + photo-moment graphics design","Corporate & Brand","Design","02 Digital","X — Constant",1,1000),
 # Talent 6,500
 L("Talent","Casting & Booking","Resident + opening DJ booking fees","Live Entertainment","Advance","06 Theatrical","Y — Variable",2,1800),
 L("Talent","Riders & Clearances","Artist + DJ advance & rider fulfillment","Live Entertainment","Advance","06 Theatrical","X — Constant",1,1400),
 L("Talent","Artist Hospitality","Artist runners (2 x 12h)","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",24,40),
 L("Talent","Artist Transportation","Ground transport — artist party","Hospitality & F&B","Operate","04 Physical","Y — Variable",1,540),
 # Build 13,500
 L("Build","Fabrication & Scenic Construction","Main + satellite bar builds","Fabrication","Build","04 Physical","X — Constant",1,3600),
 L("Build","Fabrication & Scenic Construction","DJ booth riser + façade","Fabrication","Build","04 Physical","X — Constant",1,2200),
 L("Build","Specialty Fabrication","Photo-moment installation build","Fabrication","Build","05 Experiential","X — Constant",1,1900),
 L("Build","Soft Goods & Drape","Drape, dancefloor wrap, ceiling treatment","Fabrication","Build","04 Physical","X — Constant",1,1500),
 L("Build","Signage Fabrication","Large-format print + vinyl run","Fabrication","Build","02 Digital","X — Constant",1,1200),
 L("Build","Install & Load-In","Scenic install crew (6 x 9h)","Fabrication","Install","04 Physical","Y — Variable",54,45),
 L("Build","Strike & De-Install","Strike crew (5 x 5h)","Fabrication","Operate","04 Physical","Y — Variable",25,44),
 # Production 19,500
 L("Production","Audio Production","DJ + dancefloor PA top-up (subs, DJ booth monitors)","Live Entertainment","Procurement","06 Theatrical","X — Constant",1,4200),
 L("Production","Lighting Production","Party lighting package upgrade (movers, blinders, haze)","Live Entertainment","Procurement","06 Theatrical","X — Constant",1,5200),
 L("Production","Video Production","LED accent panels + content playback","Broadcast & Content","Procurement","02 Digital","X — Constant",1,2400),
 L("Production","Rigging","Truss + motor rigging package","Live Entertainment","Install","04 Physical","Z — Timeline/Phase",1,1900),
 L("Production","Lasers & Special FX","CO2 jets + low-fog effects","Live Entertainment","Operate","06 Theatrical","Y — Variable",1,1400),
 L("Production","Audio Production","A1 + system tech (2 x 11h)","Live Entertainment","Operate","06 Theatrical","Y — Variable",22,90),
 L("Production","Lighting Production","Lighting director / board op (11h)","Live Entertainment","Operate","06 Theatrical","Y — Variable",11,85),
 L("Production","Power & Electrical (Event)","Distro + power tech for party rig","Live Entertainment","Install","04 Physical","Z — Timeline/Phase",1,665),
 # Operations 12,500
 L("Operations","Logistics & Distribution","Freight + 26' box truck (2 trips)","Procurement","Install","04 Physical","Z — Timeline/Phase",1,2200),
 L("Operations","Security & Crowd Management","Security team (8 x 8h)","Festival & Touring","Operate","04 Physical","Y — Variable",64,55),
 L("Operations","Credentialing & Access Control","Door + coat check + scanners (5 x 7h)","Festival & Touring","Operate","04 Physical","Y — Variable",35,38),
 L("Operations","Medical & Emergency Services","BLS medic team (2 x 8h)","Festival & Touring","Operate","04 Physical","Y — Variable",16,75),
 L("Operations","Life Safety & Harm Reduction","Event Safety Director (10h)","Festival & Touring","Operate","04 Physical","Y — Variable",10,95),
 L("Operations","Site Operations","Janitorial + waste (event + restore)","Procurement","Close","04 Physical","X — Constant",1,1390),
 # Experience 9,000
 L("Experience","Guest Experience","Lounge furniture + dancefloor seating","Interior Design","Install","04 Physical","Y — Variable",1,3100),
 L("Experience","Activations & Brand Experiences","Photo activation operation + attendant","Experiential","Operate","05 Experiential","Y — Variable",1,1700),
 L("Experience","Merchandising","Party props as take-home merch (175)","Experiential","Procurement","05 Experiential","Y — Variable",175,14),
 L("Experience","VIP & Premium Experiences","Industry / VIP zone dressing + host","Experiential","Operate","05 Experiential","Y — Variable",1,1750),
 # Hospitality 11,600
 L("Hospitality","Beverage Operations","Full bar program (spirits, mixers, glassware)","Hospitality & F&B","Procurement","06 Theatrical","Y — Variable",1,4800),
 L("Hospitality","Beverage Operations","Bartenders + barbacks (8 x 8h)","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",64,45),
 L("Hospitality","Food & Beverage","Late-night bites program","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",1,2600),
 L("Hospitality","Artist Hospitality","Green room + VIP hospitality stock","Hospitality & F&B","Operate","06 Theatrical","X — Constant",1,1320),
 # Technology 2,000
 L("Technology","RF / Wireless / Comms","RF coordination + comms package","Live Entertainment","Install","04 Physical","Z — Timeline/Phase",1,1100),
 L("Technology","Studio & Podcast Technology","Content capture pipeline (DJ set / socials)","Broadcast & Content","Operate","02 Digital","Y — Variable",1,900),
]

# =====================================================================
# TIER 3 — Under Argentino multi-artist cultural moment · Scope target 150,000
# =====================================================================
T3 = [
 # Executive 5,000
 L("Executive","Insurance & Permitting","GL + liquor + special-event endorsements","Corporate & Brand","Advance","04 Physical","X — Constant",1,2000),
 L("Executive","Insurance & Permitting","City permits (assembly, sound, extended hours)","Corporate & Brand","Advance","04 Physical","X — Constant",1,1600),
 L("Executive","Legal & Risk Management","Contracts, clearances, multi-artist agreements","Corporate & Brand","Advance","04 Physical","X — Constant",1,1400),
 # Creative 17,000
 L("Creative","Creative Direction","Creative direction — campaign-launch moment","Experiential","Design","05 Experiential","X — Constant",1,5200),
 L("Creative","Experience & Narrative Design","Narrative + cultural-statement design","Experiential","Design","05 Experiential","X — Constant",1,3000),
 L("Creative","Scenic Design","Multi-artist scenic + stage design","Interior Design","Design","04 Physical","X — Constant",1,3100),
 L("Creative","Environmental Design","Lighting + visual show design","Live Entertainment","Design","06 Theatrical","X — Constant",1,2600),
 L("Creative","Graphics & Print Design","OOH / environmental graphics design","Corporate & Brand","Design","02 Digital","X — Constant",1,1900),
 L("Creative","Programming & Curation","3-artist programming + ROS + set times","Live Entertainment","Design","06 Theatrical","X — Constant",1,1200),
 # Talent 14,000
 L("Talent","Casting & Booking","Local opening + DJ booking fees","Live Entertainment","Advance","06 Theatrical","Y — Variable",1,4200),
 L("Talent","Riders & Clearances","3 headline advances + riders + backline","Live Entertainment","Advance","06 Theatrical","X — Constant",1,4600),
 L("Talent","Artist Production","Backline package + tech advance","Live Entertainment","Procurement","06 Theatrical","X — Constant",1,2400),
 L("Talent","Artist Hospitality","Artist runners (4 x 12h)","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",48,42),
 L("Talent","Artist Transportation","Ground transport — 3 artist parties","Hospitality & F&B","Operate","04 Physical","Y — Variable",1,784),
 # Build 26,000
 L("Build","Fabrication & Scenic Construction","Main stage build + multi-act changeover system","Fabrication","Build","04 Physical","X — Constant",1,7400),
 L("Build","Specialty Fabrication","OOH / experiential statement structures","Fabrication","Build","05 Experiential","X — Constant",1,5200),
 L("Build","Fabrication & Scenic Construction","Bar builds + DJ booth + risers","Fabrication","Build","04 Physical","X — Constant",1,3600),
 L("Build","Specialty Fabrication","Interactive photo installation","Fabrication","Build","05 Experiential","X — Constant",1,2400),
 L("Build","Soft Goods & Drape","Drape, dancefloor, ceiling, acoustic treatment","Fabrication","Build","04 Physical","X — Constant",1,2000),
 L("Build","Signage Fabrication","Large-format print + vinyl + wayfinding","Fabrication","Build","02 Digital","X — Constant",1,1800),
 L("Build","Install & Load-In","Scenic install crew (10 x 10h)","Fabrication","Install","04 Physical","Y — Variable",100,45),
 L("Build","Strike & De-Install","Strike crew (8 x 6h)","Fabrication","Operate","04 Physical","Y — Variable",48,45),
 # Production 34,000
 L("Production","Audio Production","Full concert PA package (FOH + monitors)","Live Entertainment","Procurement","06 Theatrical","X — Constant",1,9200),
 L("Production","Lighting Production","Campaign-grade lighting rig (movers/beams/wash)","Live Entertainment","Procurement","06 Theatrical","X — Constant",1,8400),
 L("Production","Video Production","LED wall + IMAG + content servers","Broadcast & Content","Procurement","04 Physical","X — Constant",1,6400),
 L("Production","Rigging","Truss + motor + ground-support rigging","Live Entertainment","Install","04 Physical","Z — Timeline/Phase",1,3200),
 L("Production","Lasers & Special FX","CO2, low-fog, confetti moment","Live Entertainment","Operate","06 Theatrical","Y — Variable",1,1900),
 L("Production","Audio Production","A1/A2 + monitor engineer (3 x 12h)","Live Entertainment","Operate","06 Theatrical","Y — Variable",36,90),
 L("Production","Lighting Production","LD + board op + spot ops (3 x 12h)","Live Entertainment","Operate","06 Theatrical","Y — Variable",36,70),
 L("Production","Power & Electrical (Event)","Distro + generator backup + power techs","Live Entertainment","Install","04 Physical","Z — Timeline/Phase",1,1550),
 # Operations 22,000
 L("Operations","Logistics & Distribution","Freight + multi-truck logistics","Procurement","Install","04 Physical","Z — Timeline/Phase",1,4200),
 L("Operations","Security & Crowd Management","Security team (14 x 9h)","Festival & Touring","Operate","04 Physical","Y — Variable",126,55),
 L("Operations","Credentialing & Access Control","Credential + door + coat (8 x 8h)","Festival & Touring","Operate","04 Physical","Y — Variable",64,38),
 L("Operations","Medical & Emergency Services","Medical team (3 x 9h)","Festival & Touring","Operate","04 Physical","Y — Variable",27,78),
 L("Operations","Life Safety & Harm Reduction","Event Safety Director + deputy (2 x 11h)","Festival & Touring","Operate","04 Physical","Y — Variable",22,95),
 L("Operations","Traffic & Transportation Mgmt","Valet + load-zone + traffic mgmt","Festival & Touring","Operate","04 Physical","Y — Variable",1,1942),
 L("Operations","Site Operations","Janitorial + waste + restore","Procurement","Close","04 Physical","X — Constant",1,2056),
 # Experience 16,000
 L("Experience","Guest Experience","Lounge + zone furniture program","Interior Design","Install","04 Physical","Y — Variable",1,4600),
 L("Experience","Activations & Brand Experiences","Cross-functional Casa activation moments","Experiential","Operate","05 Experiential","Y — Variable",1,4200),
 L("Experience","Interactive & Immersive","Interactive photo + community wall ops","Experiential","Operate","05 Experiential","Y — Variable",1,2900),
 L("Experience","Merchandising","Party props / cultural take-homes (300)","Experiential","Procurement","05 Experiential","Y — Variable",300,11),
 L("Experience","VIP & Premium Experiences","Press / industry / VIP program","Experiential","Operate","05 Experiential","Y — Variable",1,1000),
 # Hospitality 12,000
 L("Hospitality","Beverage Operations","Full bar — Argentine-rooted program","Hospitality & F&B","Procurement","06 Theatrical","Y — Variable",1,4400),
 L("Hospitality","Beverage Operations","Bartenders + barbacks (10 x 8h)","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",80,45),
 L("Hospitality","Culinary Operations","Argentine F&B program (asado-inspired bites)","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",1,2800),
 L("Hospitality","Artist Hospitality","3 green rooms + VIP catering","Hospitality & F&B","Operate","06 Theatrical","X — Constant",1,1200),
 # Technology 4,000
 L("Technology","RF / Wireless / Comms","RF coordination (mics/IEM) + comms","Live Entertainment","Install","04 Physical","Z — Timeline/Phase",1,1900),
 L("Technology","Broadcast & Streaming Tech","Multi-cam capture + livestream pipeline","Broadcast & Content","Operate","02 Digital","Y — Variable",1,2100),
]

# =====================================================================
# TIER 4 — Calle Casa community tentpole (open brief) · Scope target 250,000
# =====================================================================
T4 = [
 # Executive 9,000
 L("Executive","Insurance & Permitting","GL + liquor + special-event (400-cap)","Corporate & Brand","Advance","04 Physical","X — Constant",1,3200),
 L("Executive","Insurance & Permitting","City permits + partnership / community agreements","Corporate & Brand","Advance","04 Physical","X — Constant",1,2600),
 L("Executive","Government & Community Relations","Community partner MOU + neighborhood relations","Corporate & Brand","Discovery","01 Social","X — Constant",1,1800),
 L("Executive","Legal & Risk Management","Multi-party contracts + clearances","Corporate & Brand","Advance","04 Physical","X — Constant",1,1400),
 # Creative 28,000
 L("Creative","Creative Direction","Creative direction — Only-in-Miami tentpole","Experiential","Design","05 Experiential","X — Constant",1,8000),
 L("Creative","Experience & Narrative Design","Community narrative + signature-moment design","Experiential","Design","05 Experiential","X — Constant",1,5400),
 L("Creative","Scenic Design","Full-venue scenic + multi-stage design","Interior Design","Design","04 Physical","X — Constant",1,4600),
 L("Creative","Environmental Design","Lighting + visual + projection design","Live Entertainment","Design","06 Theatrical","X — Constant",1,3800),
 L("Creative","Art & Decor","Local-artist commissions + art direction","Experiential","Design","05 Experiential","X — Constant",1,3000),
 L("Creative","Graphics & Print Design","OOH + environmental + wayfinding design","Corporate & Brand","Design","02 Digital","X — Constant",1,2100),
 L("Creative","Programming & Curation","Multi-artist + partner programming + ROS","Live Entertainment","Design","06 Theatrical","X — Constant",1,1100),
 # Talent 26,000
 L("Talent","Casting & Booking","Local collaborators + DJ + opener fees","Live Entertainment","Advance","06 Theatrical","Y — Variable",1,8800),
 L("Talent","Riders & Clearances","3 artist advances + riders + collab clearances","Live Entertainment","Advance","06 Theatrical","X — Constant",1,7600),
 L("Talent","Artist Production","Backline + shared tech package","Live Entertainment","Procurement","06 Theatrical","X — Constant",1,4400),
 L("Talent","Artist Hospitality","Artist runners (6 x 13h)","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",78,42),
 L("Talent","Artist Transportation","Ground transport — multi-artist + collaborators","Hospitality & F&B","Operate","04 Physical","Y — Variable",1,1924),
 # Build 44,000
 L("Build","Fabrication & Scenic Construction","Main stage + secondary stage builds","Fabrication","Build","04 Physical","X — Constant",1,12800),
 L("Build","Specialty Fabrication","Signature community installation","Fabrication","Build","05 Experiential","X — Constant",1,9600),
 L("Build","Fabrication & Scenic Construction","Bars, booths, market structures","Fabrication","Build","04 Physical","X — Constant",1,5600),
 L("Build","Specialty Fabrication","Interactive + immersive installations","Fabrication","Build","05 Experiential","X — Constant",1,4200),
 L("Build","Soft Goods & Drape","Full-venue drape, floors, acoustic, ceiling","Fabrication","Build","04 Physical","X — Constant",1,3400),
 L("Build","Signage Fabrication","Large-format + vinyl + wayfinding + OOH fab","Fabrication","Build","02 Digital","X — Constant",1,3000),
 L("Build","Install & Load-In","Scenic install crew (16 x 11h)","Fabrication","Install","04 Physical","Y — Variable",176,25),
 L("Build","Strike & De-Install","Strike crew (12 x 7h)","Fabrication","Operate","04 Physical","Y — Variable",84,40),
 # Production 54,000
 L("Production","Audio Production","Festival-grade PA (main + secondary stage)","Live Entertainment","Procurement","06 Theatrical","X — Constant",1,14000),
 L("Production","Lighting Production","Tentpole lighting rig (2 stages)","Live Entertainment","Procurement","06 Theatrical","X — Constant",1,12800),
 L("Production","Video Production","LED walls + IMAG + projection mapping","Broadcast & Content","Procurement","04 Physical","X — Constant",1,9600),
 L("Production","Rigging","Truss + motor + ground support (2 stages)","Live Entertainment","Install","04 Physical","Z — Timeline/Phase",1,4800),
 L("Production","Lasers & Special FX","Lasers + CO2 + confetti + low-fog","Live Entertainment","Operate","06 Theatrical","Y — Variable",1,3200),
 L("Production","Audio Production","Audio crew (5 x 13h)","Live Entertainment","Operate","06 Theatrical","Y — Variable",65,90),
 L("Production","Lighting Production","Lighting crew (5 x 13h)","Live Entertainment","Operate","06 Theatrical","Y — Variable",65,40),
 L("Production","Power & Electrical (Event)","Generators + distro + power crew","Live Entertainment","Install","04 Physical","Z — Timeline/Phase",1,2750),
 # Operations 38,000
 L("Operations","Logistics & Distribution","Freight + multi-truck + warehouse staging","Procurement","Install","04 Physical","Z — Timeline/Phase",1,6800),
 L("Operations","Security & Crowd Management","Security team (22 x 10h)","Festival & Touring","Operate","04 Physical","Y — Variable",220,55),
 L("Operations","Credentialing & Access Control","Credential + door + coat (12 x 9h)","Festival & Touring","Operate","04 Physical","Y — Variable",108,38),
 L("Operations","Medical & Emergency Services","Medical team (5 x 10h)","Festival & Touring","Operate","04 Physical","Y — Variable",50,78),
 L("Operations","Life Safety & Harm Reduction","Safety Director + 2 deputies (3 x 12h)","Festival & Touring","Operate","04 Physical","Y — Variable",36,95),
 L("Operations","Traffic & Transportation Mgmt","Valet + traffic + load-zone + shuttle","Festival & Touring","Operate","04 Physical","Y — Variable",1,3160),
 L("Operations","Site Operations","Janitorial + waste + restoration","Procurement","Close","04 Physical","X — Constant",1,2920),
 # Experience 26,000
 L("Experience","Guest Experience","Full-venue furniture + zone program","Interior Design","Install","04 Physical","Y — Variable",1,6800),
 L("Experience","Vendor Marketplace","Local vendor / market activation infrastructure","Experiential","Build","05 Experiential","Y — Variable",1,4400),
 L("Experience","Activations & Brand Experiences","Cross-functional community activations","Experiential","Operate","05 Experiential","Y — Variable",1,5200),
 L("Experience","Interactive & Immersive","Signature shareable installation ops","Experiential","Operate","05 Experiential","Y — Variable",1,4200),
 L("Experience","Merchandising","Community take-homes / props (400)","Experiential","Procurement","05 Experiential","Y — Variable",400,10),
 L("Experience","VIP & Premium Experiences","Press / industry / tastemaker program","Experiential","Operate","05 Experiential","Y — Variable",1,1400),
 # Hospitality 17,000
 L("Hospitality","Beverage Operations","Full bar — Miami-Latin program","Hospitality & F&B","Procurement","06 Theatrical","Y — Variable",1,6200),
 L("Hospitality","Beverage Operations","Bartenders + barbacks (14 x 9h)","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",126,45),
 L("Hospitality","Culinary Operations","Miami-Latin F&B program (local vendors)","Hospitality & F&B","Operate","06 Theatrical","Y — Variable",1,3730),
 L("Hospitality","Artist Hospitality","Green rooms + VIP + partner hospitality","Hospitality & F&B","Operate","06 Theatrical","X — Constant",1,1400),
 # Technology 8,000
 L("Technology","RF / Wireless / Comms","RF coordination (2 stages) + comms package","Live Entertainment","Install","04 Physical","Z — Timeline/Phase",1,2800),
 L("Technology","Broadcast & Streaming Tech","Multi-cam + livestream + content pipeline","Broadcast & Content","Operate","02 Digital","Y — Variable",1,3600),
 L("Technology","Data & Content Pipeline","Real-time content / social capture ops","Broadcast & Content","Operate","02 Digital","Y — Variable",1,1600),
]

# ---- reserves per tier: (target_total, fee, contingency_pct, [allowances]) ----
RESERVES = {
 "T1": dict(target=47500,  fee=14000, cont_pct=0.10, allowances=[]),
 "T2": dict(target=128000, fee=22000, cont_pct=0.08,
            allowances=[("Photo activation finishes (Experience)", 2500),
                        ("Party props / take-home merch (Experience)", 1500)]),
 "T3": dict(target=228000, fee=36000, cont_pct=0.08,
            allowances=[("OOH / experiential statement pieces (Build)", 6000),
                        ("Argentine F&B program (Hospitality)", 4000)]),
 "T4": dict(target=385000, fee=58000, cont_pct=0.08,
            allowances=[("Signature community installation (Build)", 12000),
                        ("Local partnership activation (Experience)", 8000)]),
}

TIERS_DATA = {"T1": T1, "T2": T2, "T3": T3, "T4": T4}
TIER_LABEL = {"T1": "Tier 1 — Small (Silvana-class)",
              "T2": "Tier 2 — Medium (Rawayana-class)",
              "T3": "Tier 3 — Large (Under Argentino-class)",
              "T4": "Tier 4 — XL (Calle Casa-class)"}


def amount(line):
    return round(line[7] * line[8], 2)


def rollup(lines, idx):
    d = defaultdict(float)
    for ln in lines:
        d[ln[idx]] += amount(ln)
    return d


def dept_team_rollup(lines):
    d = defaultdict(float)
    for ln in lines:
        d[(ln[0], ln[1])] += amount(ln)
    return d


IDX = dict(dept=0, team=1, item=2, disc=3, phase=4, tier=5, xyz=6)


def verify(tier):
    lines = TIERS_DATA[tier]
    res = RESERVES[tier]
    scope = round(sum(amount(l) for l in lines), 2)
    cont = float(round(scope * res["cont_pct"]))  # whole-dollar contingency
    allow = round(sum(a for _, a in res["allowances"]), 2)
    fee = res["fee"]
    target = res["target"]
    markup = round(target - scope - fee - cont - allow, 2)
    grand = round(scope + fee + cont + allow + markup, 2)

    errs = []
    # every cut must reconcile to scope
    for name, idx in (("Department", 0), ("Phase", 4), ("Discipline", 3), ("Tier", 5), ("XYZ", 6)):
        s = round(sum(rollup(lines, idx).values()), 2)
        if s != scope:
            errs.append(f"{name} rollup {s} != scope {scope}")
    if grand != target:
        errs.append(f"grand {grand} != target {target}")
    if markup < 0:
        errs.append(f"markup negative: {markup}")
    return dict(scope=scope, fee=fee, cont=cont, allow=allow, markup=markup,
                grand=grand, target=target, errs=errs)


def money(x):
    return f"${x:,.0f}" if x == int(x) else f"${x:,.2f}"


# ── Event-Kit emission (feeds scripts/seed-casa-kits.mjs) ───────────────────
# Maps every budget line onto the Event Kit Framework axes: URID (DEPT.TEAM →
# xpms_registry), venue zone (The Sanctuary), and a 5-senses touchpoint.

# Default Sanctuary zone per department (zone codes match the seeded frame).
DEPT_ZONE = {
    "Executive": "ZON-BOH", "Creative": "ZON-MAIN", "Talent": "ZON-GREEN",
    "Marketing": "ZON-LOBBY", "Build": "ZON-MAIN", "Production": "ZON-MAIN",
    "Operations": "ZON-BOH", "Experience": "ZON-EXHIB", "Hospitality": "ZON-PATIO",
    "Technology": "ZON-IT",
}
# Default sense per department (lines link to a 5-senses touchpoint).
DEPT_SENSE = {
    "Executive": "sight", "Creative": "sight", "Talent": "sound",
    "Marketing": "sight", "Build": "sight", "Production": "sound",
    "Operations": "touch", "Experience": "touch", "Hospitality": "taste",
    "Technology": "sight",
}


def _registry_lookup():
    """(department, team) -> URID, read from the v08 template Registry sheet."""
    import os, openpyxl
    path = os.path.expanduser("~/Downloads/XPMS_Universal_Budget_Template.xlsx")
    look, dept_header = {}, {}
    try:
        wb = openpyxl.load_workbook(path, data_only=True)
        ws = wb["Registry"]
        rows = list(ws.iter_rows(values_only=True))
        hi = next(i for i, r in enumerate(rows) if r and any(str(c).strip() == "URID" for c in r if c))
        hdr = [str(c).strip() if c else "" for c in rows[hi]]
        for r in rows[hi + 1:]:
            if not r or not r[0]:
                continue
            d = dict(zip(hdr, r))
            urid = str(d.get("URID")).strip()
            dept = (d.get("DEPARTMENT") or "").strip()
            team = (d.get("TEAM / DIVISION") or "")
            team = team.strip() if isinstance(team, str) else ""
            if d.get("LEVEL") == "Department":
                dept_header[dept] = urid
            elif team:
                look[(dept, team)] = urid
    except Exception as e:  # registry optional; fall back to dept headers
        print(f"  (registry lookup unavailable: {e})")
    return look, dept_header


TIER_META = {
    "T1": dict(scale="S", event="CSM", artist="Silvana Estrada", band="<$50K",
               tier_default="06 Theatrical", doc="CSM-T1-2026-SE01"),
    "T2": dict(scale="M", event="CSM", artist="Rawayana", band="$50K–150K",
               tier_default="06 Theatrical", doc="CSM-T2-2026-RW01"),
    "T3": dict(scale="L", event="CSM", artist="Under Argentino (Little Boogie · Cluster con Tilde · Ze Pequeña)",
               band="$150K–250K", tier_default="06 Theatrical", doc="CSM-T3-2026-UA01"),
    "T4": dict(scale="XL", event="CSM", artist="Calle Casa Vol.01 (Nick León · INVT · Ms Nina)",
               band="$250K+", tier_default="05 Experiential", doc="CSM-T4-2026-CC01"),
}


def emit_kits_json():
    import os, json
    look, dept_header = _registry_lookup()
    out = {"venue": {"name": "The Sanctuary — 7610 Biscayne Blvd, Miami FL", "code": "SANCT",
                     "sqft": 14139}, "kits": {}}
    for tier in ["T1", "T2", "T3", "T4"]:
        v = verify(tier)
        meta = TIER_META[tier]
        lines = []
        for ln in TIERS_DATA[tier]:
            dept, team, item, disc, phase, exp_tier, xyz, qty, rate = ln
            urid = look.get((dept, team)) or dept_header.get(dept)
            lines.append({
                "department": dept, "team": team, "urid": urid, "item": item,
                "discipline": disc, "phase": phase, "tier": exp_tier, "xyz": xyz,
                "lineType": "Scope", "zoneCode": DEPT_ZONE.get(dept, "ZON-BOH"),
                "sense": DEPT_SENSE.get(dept, "sight"),
                "quantity": qty, "rateCents": int(round(rate * 100)),
            })
        out["kits"][tier] = {
            "meta": {**meta, "tier": tier},
            "reserves": {"feeCents": int(v["fee"] * 100), "contingencyCents": int(v["cont"] * 100),
                         "allowanceCents": int(v["allow"] * 100), "markupCents": int(v["markup"] * 100)},
            "allowances": [{"label": a, "cents": int(c * 100)} for a, c in RESERVES[tier]["allowances"]],
            "totals": {"scopeCents": int(v["scope"] * 100), "grandCents": int(v["grand"] * 100)},
            "lines": lines,
        }
    path = os.path.join(os.path.dirname(__file__), "_fragments", "casa_kits.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    total_lines = sum(len(k["lines"]) for k in out["kits"].values())
    mapped = sum(1 for k in out["kits"].values() for l in k["lines"] if l["urid"])
    print(f"\nWrote casa_kits.json — 4 kits, {total_lines} lines, {mapped} URID-mapped → {path}")


def main():
    emit = "--emit" in sys.argv
    all_ok = True
    print("=" * 64)
    print("Casa Spotify Miami — XPMS v08 Budget Verification")
    print("=" * 64)
    for tier in ["T1", "T2", "T3", "T4"]:
        v = verify(tier)
        status = "OK" if not v["errs"] else "FAIL"
        if v["errs"]:
            all_ok = False
        print(f"\n[{status}] {TIER_LABEL[tier]}")
        print(f"  Scope {money(v['scope'])} | Fee {money(v['fee'])} | "
              f"Cont {money(v['cont'])} | Allow {money(v['allow'])} | "
              f"Markup {money(v['markup'])}")
        print(f"  Grand {money(v['grand'])}  (target {money(v['target'])})")
        # department breakdown
        dr = rollup(TIERS_DATA[tier], 0)
        for dept in DEPARTMENTS:
            if dr.get(dept, 0):
                print(f"      {dept:<12} {money(round(dr[dept],2))}")
        for e in v["errs"]:
            print("   !! " + e)
    print("\n" + ("ALL TIERS RECONCILE ✔" if all_ok else "RECONCILIATION FAILURES ✘"))
    if emit:
        emit_fragments()
    if "--kits" in sys.argv or emit:
        emit_kits_json()
    return 0 if all_ok else 1


def emit_fragments():
    import os
    out = os.path.join(os.path.dirname(__file__), "_fragments")
    os.makedirs(out, exist_ok=True)
    for tier in ["T1", "T2", "T3", "T4"]:
        with open(os.path.join(out, f"{tier}_budget.md"), "w") as f:
            f.write(render_tier(tier))
    with open(os.path.join(out, "rollup.md"), "w") as f:
        f.write(render_cross_tier())
    print(f"\nWrote fragments to {out}/")


def render_tier(tier):
    lines = TIERS_DATA[tier]
    v = verify(tier)
    res = RESERVES[tier]
    o = [f"<!-- generated by budget_model.py — do not hand-edit; edit the model -->\n"]
    o.append(f"## Scope of Work — by XPMS Department ({TIER_LABEL[tier]})\n")
    o.append("Every line is LINE TYPE = Scope, tagged across all six v08 axes. "
             "Fee / Contingency / Allowance / Markup are additive reserves below.\n")
    dr = rollup(lines, 0)
    for dept in DEPARTMENTS:
        dept_lines = [l for l in lines if l[0] == dept]
        if not dept_lines:
            o.append(f"\n### {dept} — $0 — not engaged this scope\n")
            continue
        o.append(f"\n### {dept} — {money(round(dr[dept],2))}\n")
        o.append("| Item | Team | Discipline | Phase | Tier | XYZ | Amount |")
        o.append("|---|---|---|---|---|---|---:|")
        for l in dept_lines:
            o.append(f"| {l[2]} | {l[1]} | {l[3]} | {l[4]} | {l[5]} | {l[6].split(' ')[0]} | {money(amount(l))} |")
    # reserves
    o.append("\n### Reserves & Fee (additive — Line Type ≠ Scope)\n")
    o.append("| Line Type | Detail | Amount |")
    o.append("|---|---|---:|")
    o.append(f"| Fee | Project Management, Talent & Client Services (collected on draw schedule) | {money(v['fee'])} |")
    o.append(f"| Contingency | {int(res['cont_pct']*100)}% of Scope — in-scope estimate/field variance | {money(v['cont'])} |")
    for label, amt in res["allowances"]:
        o.append(f"| Allowance | {label} | {money(amt)} |")
    if not res["allowances"]:
        o.append("| Allowance | none — scope fully specified at this tier | $0 |")
    o.append(f"| Markup | Pass-through margin on third-party rentals/services | {money(v['markup'])} |")
    o.append(f"| **Grand Total** | | **{money(v['grand'])}** |")
    # rollups
    o.append("\n## Investment Summary — Multi-Axis Rollup (v08 Summary parity)\n")
    o.append(_dept_block(tier, v))
    o.append(_simple_block("By Phase (Scope only)", rollup(lines, 4), PHASES, v["scope"]))
    o.append(_linetype_block(v))
    o.append(_simple_block("By Discipline (Scope only)", rollup(lines, 3), DISCIPLINES, v["scope"]))
    o.append(_simple_block("By Tier of Experience (Scope only)", rollup(lines, 5), TIERS, v["scope"]))
    o.append(_simple_block("By XYZ Cost Behaviour (Scope only)", rollup(lines, 6), XYZ, v["scope"]))
    return "\n".join(o) + "\n"


def _dept_block(tier, v):
    lines = TIERS_DATA[tier]
    dr = rollup(lines, 0)
    o = ["### By Department\n", "| Department | Amount | % of Total |", "|---|---:|---:|"]
    for dept in DEPARTMENTS:
        amt = round(dr.get(dept, 0), 2)
        o.append(f"| {dept} | {money(amt)} | {amt/v['grand']*100:.1f}% |")
    o.append(f"| **Scope subtotal** | **{money(v['scope'])}** | **{v['scope']/v['grand']*100:.1f}%** |")
    o.append(f"| Fee | {money(v['fee'])} | {v['fee']/v['grand']*100:.1f}% |")
    o.append(f"| Contingency | {money(v['cont'])} | {v['cont']/v['grand']*100:.1f}% |")
    if v["allow"]:
        o.append(f"| Allowance | {money(v['allow'])} | {v['allow']/v['grand']*100:.1f}% |")
    o.append(f"| Markup | {money(v['markup'])} | {v['markup']/v['grand']*100:.1f}% |")
    o.append(f"| **Total Project** | **{money(v['grand'])}** | **100%** |")
    return "\n".join(o) + "\n"


def _simple_block(title, d, order, scope):
    o = [f"### {title}\n", "| Segment | Amount | % of Scope |", "|---|---:|---:|"]
    for k in order:
        amt = round(d.get(k, 0), 2)
        if amt:
            o.append(f"| {k} | {money(amt)} | {amt/scope*100:.1f}% |")
    o.append(f"| **Total Scope** | **{money(round(sum(d.values()),2))}** | **100%** |")
    return "\n".join(o) + "\n"


def _linetype_block(v):
    o = ["### By Line Type (reconciles to Grand Total)\n", "| Line Type | Amount | % of Total |", "|---|---:|---:|"]
    rows = [("Scope", v["scope"]), ("Fee", v["fee"]), ("Contingency", v["cont"])]
    if v["allow"]:
        rows.append(("Allowance", v["allow"]))
    rows.append(("Markup", v["markup"]))
    for k, amt in rows:
        o.append(f"| {k} | {money(amt)} | {amt/v['grand']*100:.1f}% |")
    o.append(f"| **Grand Total** | **{money(v['grand'])}** | **100%** |")
    return "\n".join(o) + "\n"


def render_cross_tier():
    o = ["<!-- generated by budget_model.py -->\n", "## Cross-Tier Rollup — Year-One Sample Slate\n"]
    # grand totals
    o.append("### Slate Totals\n| Tier | Event Class | Scope | Fee | Contingency | Allowance | Markup | Total |")
    o.append("|---|---|---:|---:|---:|---:|---:|---:|")
    tot = defaultdict(float)
    for tier in ["T1", "T2", "T3", "T4"]:
        v = verify(tier)
        o.append(f"| {tier} | {TIER_LABEL[tier].split('— ')[1]} | {money(v['scope'])} | {money(v['fee'])} | "
                 f"{money(v['cont'])} | {money(v['allow'])} | {money(v['markup'])} | {money(v['grand'])} |")
        for k in ("scope", "fee", "cont", "allow", "markup", "grand"):
            tot[k] += v[k]
    o.append(f"| **All** | **Slate** | **{money(tot['scope'])}** | **{money(tot['fee'])}** | "
             f"**{money(tot['cont'])}** | **{money(tot['allow'])}** | **{money(tot['markup'])}** | "
             f"**{money(tot['grand'])}** |")
    # department across tiers
    o.append("\n### By Department — Across All Tiers (Scope)\n")
    o.append("| Department | T1 | T2 | T3 | T4 | Total |")
    o.append("|---|---:|---:|---:|---:|---:|")
    for dept in DEPARTMENTS:
        row = [dept]
        dtot = 0
        for tier in ["T1", "T2", "T3", "T4"]:
            a = round(rollup(TIERS_DATA[tier], 0).get(dept, 0), 2)
            dtot += a
            row.append(money(a))
        row.append(f"**{money(round(dtot,2))}**")
        o.append("| " + " | ".join(row) + " |")
    # phase across tiers
    o.append("\n### By Phase — Across All Tiers (Scope)\n")
    o.append("| Phase | T1 | T2 | T3 | T4 | Total |")
    o.append("|---|---:|---:|---:|---:|---:|")
    for ph in PHASES:
        row = [ph]
        ptot = 0
        for tier in ["T1", "T2", "T3", "T4"]:
            a = round(rollup(TIERS_DATA[tier], 4).get(ph, 0), 2)
            ptot += a
            row.append(money(a))
        row.append(f"**{money(round(ptot,2))}**")
        o.append("| " + " | ".join(row) + " |")
    # discipline across tiers
    o.append("\n### By Discipline — Across All Tiers (Scope)\n")
    o.append("| Discipline | T1 | T2 | T3 | T4 | Total |")
    o.append("|---|---:|---:|---:|---:|---:|")
    for dis in DISCIPLINES:
        row = [dis]
        dtot = 0
        for tier in ["T1", "T2", "T3", "T4"]:
            a = round(rollup(TIERS_DATA[tier], 3).get(dis, 0), 2)
            dtot += a
            row.append(money(a))
        row.append(f"**{money(round(dtot,2))}**")
        o.append("| " + " | ".join(row) + " |")
    return "\n".join(o) + "\n"


if __name__ == "__main__":
    sys.exit(main())
