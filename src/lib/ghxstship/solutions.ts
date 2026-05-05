import type { Solution } from "./types";

/**
 * Nineteen targeted industry solutions — Axis E of the XPMS v1.0 schema.
 * Each solution pillar is the canonical landing page for that industry vertical
 * and links to every service that anchors the work.
 */
export const SOLUTIONS: Solution[] = [
  {
    slug: "concerts-festivals-tours",
    name: "Concerts, Festivals & Tours",
    definition:
      "End-to-end live music production at scale — single-night concerts, multi-day music festivals, residencies, and multi-city touring operations across amphitheaters, arenas, festival sites, theatres, and independent venues.",
    anchoredServices: [
      1, 2, 3, 6, 8, 9, 10, 11, 14, 15, 22, 23, 24, 25, 27, 43, 44, 46, 48, 51, 56, 67, 70, 71, 75, 76, 80, 82, 86, 87,
      88, 91, 95, 100,
    ],
    phaseEmphasis: "Phase 02 Concept (show design), Phase 05 Build (build), Phase 06 Show (live operations).",
    apsEmphasis:
      "L1 Project (tour container), L4 Activation (the show), L5 Component (stage / audio / lighting / video).",
    tierEmphasis: "04 Physical, 05 Experiential, 06 Theatrical.",
    geoStrongholds:
      "Las Vegas (residencies, EDC, Sphere, F1), Nashville (country / Americana touring), Austin (ACL, SXSW), Miami (MMW, Ultra), Los Angeles (festival circuit + arena).",
  },
  {
    slug: "immersive-experiences",
    name: "Immersive Experiences",
    definition:
      "Narrative-driven, environment-rich, often interactive experiences — themed walkthrough exhibitions, immersive theatre, themed entertainment, branded immersive activations, and exhibition-format immersive art.",
    anchoredServices: [2, 3, 9, 10, 14, 17, 28, 49, 50, 51, 56, 65, 71, 72, 73, 75, 91, 95, 96, 98, 102, 103],
    phaseEmphasis: "Phase 02 Concept (worldbuilding), Phase 05 Build (environment build), Phase 06 Show (operations).",
    apsEmphasis: "L3 Zone (environments), L4 Activation, L5 Component.",
    tierEmphasis: "04 Physical, 05 Experiential, 06 Theatrical, 03 Virtual where AR/VR is layered.",
    geoStrongholds:
      "Los Angeles (themed entertainment hub), New York City (immersive theatre), Las Vegas (Sphere, Area15), Miami (art-adjacent immersive).",
  },
  {
    slug: "theatrical-performances",
    name: "Theatrical Performances",
    definition:
      "Theatre and performance production — Broadway and regional theatre, dance, opera, musical theatre, and theatrical-format performance.",
    anchoredServices: [9, 10, 14, 20, 27, 43, 48, 49, 50, 51, 56, 60, 73, 91, 95, 100],
    phaseEmphasis: "Phase 02 Concept, Phase 05 Build (tech week), Phase 06 Show (run).",
    apsEmphasis: "L4, L5.",
    tierEmphasis: "06 Theatrical.",
    geoStrongholds: "New York City (Broadway), Chicago (Steppenwolf, Goodman), Los Angeles, Atlanta (Alliance).",
  },
  {
    slug: "brand-activations-popups",
    name: "Brand Activations & Pop-ups",
    definition:
      "Marketing activations — short-duration brand experiences, product launches, sampling activations, experiential marketing campaigns, and pop-up retail.",
    anchoredServices: [2, 3, 16, 17, 21, 22, 23, 26, 28, 29, 30, 31, 47, 49, 50, 51, 53, 54, 80, 84, 86, 100],
    phaseEmphasis: "Phase 02 Concept, Phase 05 Build, Phase 06 Show.",
    apsEmphasis: "L1 Project, L4 Activation.",
    tierEmphasis: "01 Social, 04 Physical, 05 Experiential.",
    geoStrongholds: "Miami (Art Basel, MMW, F1), New York City (fashion week), Los Angeles, Austin (SXSW), Atlanta.",
  },
  {
    slug: "art-cultural-installations",
    name: "Art & Cultural Installations",
    definition:
      "Project-format fine art and cultural production — museum exhibitions, public art commissions, biennials, art fairs, gallery installations.",
    anchoredServices: [2, 3, 17, 18, 49, 50, 51, 52, 56, 60, 65, 66, 92, 96, 98, 99, 103],
    phaseEmphasis: "Phase 02 Concept (curatorial), Phase 05 Build (fabrication + install).",
    apsEmphasis: "L3 Zone, L5 Component.",
    tierEmphasis: "04 Physical, 05 Experiential.",
    geoStrongholds: "Miami (Art Basel, Design Miami, Faena), New York City, Los Angeles, Chicago.",
  },
  {
    slug: "exotic-destinations",
    name: "Exotic Destinations",
    definition:
      "Production in remote or destination locations — private islands, yachts, deserts, jungles, mountains, exotic resorts, unconventional venues requiring full infrastructure import.",
    anchoredServices: [1, 2, 38, 39, 40, 41, 56, 58, 63, 68, 79, 90, 99, 107, 108, 111],
    phaseEmphasis: "Phase 01 Discovery, Phase 04 Advance, Phase 05 Build.",
    apsEmphasis: "L1, L2.",
    tierEmphasis: "04 Physical, 05 Experiential.",
    geoStrongholds:
      "Miami (Caribbean / LatAm gateway), Los Angeles (Pacific Rim), New York City (transatlantic), Las Vegas (Mojave / Mountain West).",
  },
  {
    slug: "corporate-private-events",
    name: "Corporate & Private Events",
    definition:
      "Internal and external corporate event production — leadership offsites, board meetings, sales kick-offs, employee appreciation, holiday parties, weddings, milestone birthdays, and private estate events with discretion as a core requirement.",
    anchoredServices: [1, 2, 16, 22, 23, 24, 27, 28, 30, 32, 38, 39, 45, 49, 58, 62, 63, 79, 107],
    phaseEmphasis: "All eight phases — corporate cycles compress all phases into 60 to 90 days.",
    apsEmphasis: "L1, L2, L3, L4.",
    tierEmphasis: "04 Physical, 05 Experiential.",
    geoStrongholds: "New York City, Chicago, Minneapolis (Fortune 500), Seattle (tech HQ), Los Angeles, Miami.",
  },
  {
    slug: "conferences-conventions-trade-shows",
    name: "Conferences, Conventions & Trade Shows",
    definition:
      "Multi-day, multi-track conference and convention production — keynotes, breakouts, exhibitor halls, sponsor activation, registration, attendee experience.",
    anchoredServices: [
      2, 4, 6, 8, 9, 10, 13, 14, 15, 17, 22, 24, 28, 29, 32, 33, 34, 36, 38, 39, 45, 49, 51, 53, 54, 78, 85, 87, 97,
    ],
    phaseEmphasis:
      "Phase 03 Develop (engineering at scale), Phase 05 Build (multi-day install), Phase 06 Show (live ops).",
    apsEmphasis: "L2 Event, L3 Zone, L4 Activation.",
    tierEmphasis: "04 Physical, 05 Experiential, 02 Digital (livestream).",
    geoStrongholds:
      "Las Vegas (CES, NAB), Chicago (McCormick Place — second-largest convention center in North America), Orlando (OCCC), Los Angeles, Atlanta, Miami.",
  },
  {
    slug: "luxury-retail-dining",
    name: "Luxury Retail & Dining",
    definition:
      "Production for luxury commerce — boutique launches, chef-led pop-ups, fashion week activations, wine and spirits launches, hotel openings, dining as destination.",
    anchoredServices: [2, 16, 22, 23, 25, 27, 28, 30, 49, 51, 53, 54, 80, 83, 84],
    phaseEmphasis: "Phase 02 Concept, Phase 05 Build, Phase 06 Show.",
    apsEmphasis: "L3 Zone, L4 Activation.",
    tierEmphasis: "04 Physical, 05 Experiential.",
    geoStrongholds: "New York City (luxury retail, fashion week), Miami, Los Angeles, Las Vegas.",
  },
  {
    slug: "health-wellness-events",
    name: "Health & Wellness Events",
    definition:
      "Wellness retreats, fitness activations, mental health programming, sound baths and meditation, biohacking conferences, longevity activations, wellness brand launches.",
    anchoredServices: [2, 3, 16, 22, 24, 26, 33, 49, 81, 93],
    phaseEmphasis: "Phase 02 Concept, Phase 05 Build, Phase 06 Show.",
    apsEmphasis: "L3 Zone, L4 Activation.",
    tierEmphasis: "04 Physical, 05 Experiential.",
    geoStrongholds:
      "Miami (retreat market), Los Angeles (wellness HQ), Denver (mountain retreat), Seattle (PNW wellness), Austin (biohacking).",
  },
  {
    slug: "academic-institutions",
    name: "Academic Institutions",
    definition:
      "Production for higher education and select K-12 — commencements, convocations, donor and alumni events, symposia, lecture series, athletic events, campus activations under university procurement and compliance.",
    anchoredServices: [2, 4, 6, 16, 17, 22, 24, 32, 34, 45, 46, 49, 51, 57, 58, 59, 60, 62, 69, 77, 102, 109],
    phaseEmphasis: "Phase 03 Develop (institutional procurement), Phase 05 Build, Phase 06 Show.",
    apsEmphasis: "L1, L2.",
    tierEmphasis: "04 Physical, 05 Experiential, 06 Theatrical.",
    geoStrongholds: "All twelve markets — research university density.",
  },
  {
    slug: "sporting-events-tournaments",
    name: "Sporting Events & Tournaments",
    definition:
      "Production for sporting events — pro and college tournaments, esports, motorsport, individual sport events (golf, tennis, F1, MMA), college athletics, sport-adjacent fan activations.",
    anchoredServices: [
      4, 6, 8, 9, 10, 11, 13, 14, 17, 19, 22, 24, 27, 32, 36, 39, 43, 44, 45, 46, 48, 49, 51, 53, 54, 60, 63, 76, 81,
      89, 94, 100, 101,
    ],
    phaseEmphasis: "Phase 03 Develop (broadcast + field-of-play), Phase 05 Build, Phase 06 Show.",
    apsEmphasis: "L1, L2, L3.",
    tierEmphasis: "02 Digital (broadcast), 04 Physical, 05 Experiential.",
    geoStrongholds:
      "Miami (F1, Hard Rock), Los Angeles (Olympics 2028, Super Bowl, World Cup), New York City (US Open, NYC Marathon), Chicago, Atlanta (CFP), Minneapolis.",
  },
  {
    slug: "film-tv-broadcast",
    name: "Film, TV & Broadcast",
    definition:
      "Production for film, television, and live broadcast — premieres, screenings, junkets, broadcast TV production, livestream events, awards shows, on-location production support.",
    anchoredServices: [2, 9, 10, 13, 14, 17, 21, 24, 32, 34, 38, 49, 51, 56, 60, 61, 74, 78, 94, 100],
    phaseEmphasis: "Phase 02 Concept, Phase 05 Build, Phase 06 Show.",
    apsEmphasis: "L4, L5.",
    tierEmphasis: "02 Digital, 06 Theatrical.",
    geoStrongholds:
      "Los Angeles (film / TV), New York City (broadcast / premiere), Atlanta (Tyler Perry Studios), Nashville, Austin.",
  },
  {
    slug: "amusement-theme-parks",
    name: "Amusement & Theme Parks",
    definition:
      "Production for theme parks, amusement parks, family entertainment centers, themed attractions — new ride / attraction launches, seasonal overlays, park-day operations, themed F&B venues.",
    anchoredServices: [3, 6, 9, 10, 14, 17, 22, 28, 30, 46, 49, 50, 51, 52, 56, 60, 70, 72, 75, 96, 98, 102, 104, 110],
    phaseEmphasis:
      "Phase 02 Concept (themed concept), Phase 03 Develop (ride / safety engineering), Phase 05 Build (fabrication + install), Phase 06 Show (park-day ops).",
    apsEmphasis:
      "L3 Zone (themed lands), L4 Activation (the ride / attraction), L5 Component (animatronic, ride vehicle, themed prop).",
    tierEmphasis: "04 Physical, 05 Experiential, 06 Theatrical.",
    geoStrongholds:
      "Orlando (the global theme park capital — Disney, Universal, SeaWorld), Los Angeles (Disneyland, Universal Hollywood, Six Flags Magic Mountain), Las Vegas (Area15, Sphere experiences), Atlanta (Six Flags Over Georgia), Chicago.",
  },
  {
    slug: "nightlife-entertainment-venues",
    name: "Nightlife & Entertainment Venues",
    definition:
      "Production and operations for nightclubs, day clubs, lounges, music venues, comedy clubs, bowling / entertainment hybrids, adult entertainment districts — design, build, technical, programming, talent booking, ongoing operational support.",
    anchoredServices: [
      2, 9, 10, 14, 16, 17, 22, 23, 25, 27, 28, 32, 46, 49, 51, 52, 56, 60, 71, 72, 75, 84, 86, 91, 105, 106,
    ],
    phaseEmphasis: "Phase 02 Concept (venue identity), Phase 05 Build, Phase 06 Show (nightly operations).",
    apsEmphasis: "L1 Project (the venue), L3 Zone (DJ booth, dance floor, VIP), L4 Activation (the night).",
    tierEmphasis: "04 Physical, 05 Experiential.",
    geoStrongholds:
      "Las Vegas (nightclub capital — Hakkasan, Marquee, Omnia, Tao, Zouk), Miami (LIV, E11even, Story, Space), New York City (Marquee NY, Lavo, House of Yes), Los Angeles (Academy LA, Sound, Avalon), Atlanta, Chicago.",
  },
  {
    slug: "premium-experiences-hospitality",
    name: "Premium Experiences & Hospitality",
    definition:
      "Ultra-premium and luxury hospitality production — private aviation experiences, yacht charters, exclusive member clubs, UHNW events, sponsor VIP activations at major events, and bespoke programming for clients with effectively unlimited budgets.",
    anchoredServices: [
      1, 2, 16, 18, 19, 21, 22, 23, 24, 27, 30, 38, 39, 45, 49, 58, 62, 63, 68, 76, 77, 78, 79, 80, 90, 107, 109,
    ],
    phaseEmphasis: "Phase 01 Discovery (bespoke design), Phase 05 Build, Phase 06 Show (white-glove activation).",
    apsEmphasis: "L1 Project, L4 Activation.",
    tierEmphasis: "04 Physical, 05 Experiential.",
    geoStrongholds:
      "Miami (private island / yacht corridor, Art Basel ultra-VIP), New York City (financial UHNW), Los Angeles, Las Vegas (whale-tier casino, F1 paddock club), Aspen-adjacent Denver, East Hampton-adjacent NYC.",
  },
  {
    slug: "art-cultural-institutions",
    name: "Art & Cultural Institutions",
    definition:
      "Long-term institutional partnerships with museums, foundations, performing arts centers, cultural centers, and arts non-profits — annual gala production, exhibition openings, capital campaign events, donor cultivation programs, institutional brand-building.",
    anchoredServices: [
      2, 16, 17, 18, 22, 24, 32, 34, 38, 45, 49, 50, 51, 53, 56, 57, 58, 60, 62, 65, 77, 92, 96, 98, 99, 103, 109,
    ],
    phaseEmphasis:
      "Phase 01 Discovery (relationship), Phase 02 Concept, Phase 05 Build, Phase 06 Show (gala / opening), Phase 08 Wrap (stewardship).",
    apsEmphasis: "L1 Project (institutional relationship spanning many events), L4 Activation.",
    tierEmphasis: "04 Physical, 05 Experiential.",
    geoStrongholds:
      "New York City (Met, MoMA, Whitney, Lincoln Center, Carnegie Hall), Los Angeles (LACMA, MOCA, Hammer, Getty, Geffen, Disney Hall), Chicago (Art Institute, MCA, Lyric Opera, CSO), Miami (PAMM, ICA Miami, Faena Forum), Atlanta (High Museum, Alliance).",
  },
  {
    slug: "cruise-lines-maritime",
    name: "Cruise Lines & Maritime",
    definition:
      "Production aboard cruise ships, maritime entertainment platforms, mega-yacht charters, large-vessel events — onboard show production, port-day shore-side activation, dry-dock refresh installation, maritime brand activation.",
    anchoredServices: [
      1, 2, 3, 8, 9, 10, 13, 14, 17, 22, 23, 24, 27, 38, 39, 40, 43, 44, 46, 49, 51, 56, 58, 60, 63, 68, 90, 91, 95, 99,
      107, 108, 111,
    ],
    phaseEmphasis:
      "Phase 01 Discovery (vessel feasibility), Phase 03 Develop (engineering against ship constraints), Phase 05 Build (dry-dock or in-service install), Phase 06 Show (sailing ops).",
    apsEmphasis:
      "L1 Project (cruise line / vessel), L2 Event (cruise / dry-dock window), L3 Zone (deck, theater, lido).",
    tierEmphasis: "04 Physical, 05 Experiential, 06 Theatrical (onboard shows).",
    geoStrongholds:
      "Miami (cruise capital — Carnival HQ, Royal Caribbean HQ, Norwegian, MSC, Virgin Voyages), Orlando (Port Canaveral — Disney, Carnival, Royal Caribbean), Seattle (PNW / Alaska hub), Los Angeles (Pacific Rim via San Pedro / Long Beach), New York City (transatlantic / Bermuda).",
  },
  {
    slug: "premium-sporting-experiences-fan-zones",
    name: "Premium Sporting Experiences & Fan Zones",
    definition:
      "The hospitality and fan-engagement ecosystem surrounding mega sporting events — F1 Paddock Club, Olympic Hospitality Houses, Super Bowl Experience, World Cup Fan Fests, Masters Hospitality Village, US Open Suites, NCAA Final Four Fan Fests, America's Cup Hospitality, host-city sponsor activation villages.",
    anchoredServices: [
      1, 2, 3, 6, 8, 9, 10, 13, 14, 16, 17, 19, 21, 22, 23, 24, 27, 30, 38, 39, 45, 46, 47, 49, 51, 53, 54, 58, 60, 63,
      70, 74, 76, 78, 81, 89, 94, 100, 101, 112, 113, 114,
    ],
    phaseEmphasis:
      "Phase 01 Discovery (host city accreditation), Phase 02 Concept, Phase 05 Build (multi-week build often inside clean-zone restrictions), Phase 06 Show (live event hospitality + fan zone).",
    apsEmphasis:
      "L1 Project (multi-year sponsor / federation relationship), L2 Event, L3 Zone (Paddock Club, Hospitality House, Fan Fest), L4 Activation.",
    tierEmphasis: "01 Social, 04 Physical, 05 Experiential, 02 Digital (broadcast).",
    geoStrongholds:
      "Miami (F1 Miami GP, FIFA WC 2026, Super Bowl rotation), Los Angeles (Olympics 2028, Super Bowl, FIFA WC 2026, US Open West Coast), Las Vegas (F1 Las Vegas GP, Super Bowl, Final Four), New York City (US Open, NYC Marathon, FIFA WC 2026 Final at MetLife), Atlanta (FIFA WC 2026, College Football Playoff), Chicago, Minneapolis (Super Bowl LII legacy, Final Four), Austin (F1 US GP at Circuit of The Americas), Orlando.",
  },
];

export const SOLUTION_BY_SLUG = Object.fromEntries(SOLUTIONS.map((s) => [s.slug, s])) as Record<
  Solution["slug"],
  Solution
>;
