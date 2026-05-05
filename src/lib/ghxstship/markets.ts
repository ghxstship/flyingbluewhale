import type { Market } from "./types";

/**
 * Geographic spread — four anchor markets, eight satellite markets.
 * Anchors get full local presence and dedicated fabrication capacity;
 * satellites are serviced from anchors with deep venue and permit
 * familiarity, lighter local footprint.
 */
export const MARKETS: Market[] = [
  {
    slug: "miami",
    name: "Miami",
    type: "anchor",
    blurb:
      "Design District anchor. F1 / Art Basel / MMW corridor. Caribbean and LatAm gateway. Cruise capital of the world.",
    anchors: [
      "Hard Rock Stadium",
      "Faena District",
      "Design Miami",
      "Art Basel",
      "Ultra Music Festival",
      "Carnival, Royal Caribbean, Norwegian, MSC, Virgin Voyages HQ",
      "F1 Miami GP",
      "FIFA WC 2026 host",
    ],
  },
  {
    slug: "new-york-city",
    name: "New York City",
    type: "anchor",
    blurb:
      "Fashion, cultural, financial, and Broadway anchor. Transatlantic gateway. The institutional capital of the catalog.",
    anchors: [
      "Met, MoMA, Whitney, Lincoln Center, Carnegie Hall",
      "Broadway",
      "US Open",
      "NYC Marathon",
      "MetLife Stadium (FIFA WC 2026 Final)",
      "Fashion Week",
    ],
  },
  {
    slug: "chicago",
    name: "Chicago",
    type: "anchor",
    blurb:
      "Midwest hub for conference, brand, theatre, and stadium activation. McCormick Place is the second-largest convention center in North America.",
    anchors: [
      "McCormick Place",
      "Lyric Opera",
      "Steppenwolf",
      "Goodman Theatre",
      "Art Institute, MCA",
      "United Center, Wrigley, Soldier Field",
    ],
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    type: "anchor",
    blurb:
      "Entertainment, brand, studio, theme park, and themed entertainment anchor. Pacific Rim gateway. Olympics 2028 host.",
    anchors: [
      "Disneyland, Universal Hollywood, Six Flags Magic Mountain",
      "LACMA, MOCA, Hammer, Getty, Disney Hall",
      "Hollywood Bowl",
      "SoFi Stadium",
      "Crypto.com Arena",
      "Olympics 2028, Super Bowl, FIFA WC 2026",
    ],
  },
  {
    slug: "orlando",
    name: "Orlando",
    type: "satellite",
    servicedFrom: "miami",
    blurb:
      "Theme park capital. Port Canaveral cruise hub. OCCC convention center. The global theme park capital — Disney, Universal, SeaWorld.",
    anchors: [
      "Walt Disney World",
      "Universal Orlando",
      "SeaWorld",
      "Port Canaveral",
      "Orange County Convention Center",
    ],
  },
  {
    slug: "nashville",
    name: "Nashville",
    type: "satellite",
    servicedFrom: "chicago",
    blurb: "Music industry, country touring, emerging brand activation.",
    anchors: ["Bridgestone Arena", "Ryman Auditorium", "Nissan Stadium", "Music Row"],
  },
  {
    slug: "austin",
    name: "Austin",
    type: "satellite",
    servicedFrom: "los-angeles",
    blurb: "SXSW, ACL, F1 US GP at Circuit of The Americas, tech-conference circuit.",
    anchors: ["Circuit of The Americas", "Zilker Park (ACL)", "Austin Convention Center", "Moody Center", "SXSW"],
  },
  {
    slug: "atlanta",
    name: "Atlanta",
    type: "satellite",
    servicedFrom: "miami",
    blurb: "Film/TV production, music, sports, Southeast conference. Tyler Perry Studios.",
    anchors: [
      "Mercedes-Benz Stadium",
      "Tyler Perry Studios",
      "State Farm Arena",
      "High Museum",
      "Alliance Theatre",
      "FIFA WC 2026 host",
    ],
  },
  {
    slug: "minneapolis",
    name: "Minneapolis",
    type: "satellite",
    servicedFrom: "chicago",
    blurb: "Corporate HQ density (3M, Target, Best Buy, US Bank). Super Bowl LII legacy. Final Four rotation.",
    anchors: ["US Bank Stadium", "Target Center", "Mall of America"],
  },
  {
    slug: "denver",
    name: "Denver",
    type: "satellite",
    servicedFrom: "los-angeles",
    blurb: "Outdoor lifestyle. Red Rocks. Mountain West conference. Aspen-adjacent UHNW.",
    anchors: ["Red Rocks Amphitheatre", "Empower Field", "Ball Arena", "Aspen / Vail UHNW corridor"],
  },
  {
    slug: "las-vegas",
    name: "Las Vegas",
    type: "satellite",
    servicedFrom: "los-angeles",
    blurb:
      "F1, EDC, conference (CES, NAB), Sphere, residency, nightlife capital. The whale-tier casino and F1 paddock club anchor of the Mountain West.",
    anchors: [
      "Sphere",
      "Allegiant Stadium",
      "T-Mobile Arena",
      "Las Vegas Convention Center",
      "Hakkasan, Marquee, Omnia, Tao, Zouk",
      "F1 Las Vegas GP",
      "Super Bowl LVIII legacy",
    ],
  },
  {
    slug: "seattle",
    name: "Seattle",
    type: "satellite",
    servicedFrom: "los-angeles",
    blurb: "Tech HQ density (Microsoft, Amazon, Starbucks, Boeing). PNW lifestyle. Alaska cruise hub.",
    anchors: ["Lumen Field", "Climate Pledge Arena", "T-Mobile Park", "Pier 91 cruise terminal"],
  },
];

export const MARKET_BY_SLUG = Object.fromEntries(MARKETS.map((m) => [m.slug, m])) as Record<Market["slug"], Market>;
export const ANCHOR_MARKETS = MARKETS.filter((m) => m.type === "anchor");
export const SATELLITE_MARKETS = MARKETS.filter((m) => m.type === "satellite");
