import type { CredentialRow, ResourceLocation, EvacuationRoute, FAQPair } from './types';

export const EVENT = {
  title: 'Black Coffee + Carlita + Kaz James + Canela B2B Fiin',
  subtitle: 'Open Air at the Racetrack',
  series: 'Miami Music Week 2026',
  presenter: 'Club Space Miami',
  date: 'Saturday, March 28, 2026',
  venue: 'Hialeah Park Casino',
  address: '100 E 32nd St, Hialeah, FL 33013',
  phone: '(305) 885-8000',
  capacity: '10,000',
  producer: 'G H X S T S H I P  INDUSTRIES LLC',
  projectCode: 'MMW26-HP',
  sitePlan: 'https://app.cartamaps.com/share/fb788ebb-8b41-4838-b631-4d51097b3e77',
  contact: 'sos@ghxstship.pro',
  eventLinks: [
    { label: 'Official Event Page', url: 'https://www.clubspace.com/club-space-presents-black-coffee' },
    { label: 'Tickets', url: 'https://dice.fm/event/7dpg36-black-coffee-carlita-kaz-james-at-the-racetrack-mmw-26-28th-mar-club-space-miami-miami-hialeah-park-casino-hialeah-tickets?lng=en-US' },
  ],
  socials: {
    instagram: 'https://www.instagram.com/ghxstship.tours',
    linkedin: 'https://www.linkedin.com/company/ghxstship',
    youtube: 'https://www.youtube.com/@ghxstship',
    website: 'https://ghxstship.tours',
  },
};

export const SET_TIMES = [
  { time: '6:00 – 7:30 PM', artist: 'Canela B2B Fiin' },
  { time: '7:30 – 9:00 PM', artist: 'Kaz James' },
  { time: '9:00 – 10:30 PM', artist: 'Carlita' },
  { time: '10:30 PM – 1:00 AM', artist: 'Black Coffee', note: 'Headline' },
];

export const SCHEDULE = [
  { label: 'Load-in Start', datetime: '3/23 8:00 AM' },
  { label: 'Load-in End', datetime: '3/28 3:00 PM' },
  { label: 'Event Start', datetime: '3/28 6:00 PM' },
  { label: 'Event End', datetime: '3/29 1:00 AM' },
  { label: 'Load Out Start', datetime: '3/29 2:00 AM' },
  { label: 'Load Out End', datetime: '3/31 6:00 PM' },
];

export const DAILY_HOURS = '8:00 AM – 6:00 PM';

export const TRANSIT_INFO = {
  metroRail: 'MetroRail Green Line to Hialeah Station (125 E 21st St). About 15–20 minute walk north on Palm Ave. Runs 5 AM to midnight. $2.25 per trip.',
  triRail: 'Tri-Rail connects at Hialeah Market Station — transfer to MetroRail Green Line.',
  bus: 'Bus Route 37 stops at Palm Ave & W 28th St, about a 5-minute walk. Hialeah Flamingo and Marlin circulators also cover the area.',
  freebee: 'Freebee offers free on-demand rides within Hialeah via the app.',
  warning: 'MetroRail shuts down around midnight and this event runs until 1 AM. Have a rideshare plan for the way home.',
};

export const CREDENTIAL_MATRIX: CredentialRow[] = [
  { credential: 'Core + Escort', commandCenter: true, backOfHouse: true, stage: true, backstage: true, vipStageTableNorth: true, vipStageTableSouth: true, vipBackstage: true, vipClubhouse: true, vipDanceFloor: true, grandstandsGA: true },
  { credential: 'Production', commandCenter: true, backOfHouse: true, stage: true, backstage: true, vipStageTableNorth: true, vipStageTableSouth: true, vipBackstage: true, vipClubhouse: true, vipDanceFloor: true, grandstandsGA: true },
  { credential: 'Crew', commandCenter: false, backOfHouse: true, stage: true, backstage: true, vipStageTableNorth: false, vipStageTableSouth: false, vipBackstage: false, vipClubhouse: false, vipDanceFloor: true, grandstandsGA: true },
  { credential: 'Artist', commandCenter: false, backOfHouse: true, stage: true, backstage: true, vipStageTableNorth: false, vipStageTableSouth: false, vipBackstage: false, vipClubhouse: true, vipDanceFloor: true, grandstandsGA: true },
  { credential: 'Backstage', commandCenter: false, backOfHouse: false, stage: false, backstage: true, vipStageTableNorth: true, vipStageTableSouth: true, vipBackstage: true, vipClubhouse: true, vipDanceFloor: true, grandstandsGA: true },
  { credential: 'Stage Table North', commandCenter: false, backOfHouse: false, stage: false, backstage: false, vipStageTableNorth: true, vipStageTableSouth: false, vipBackstage: false, vipClubhouse: true, vipDanceFloor: true, grandstandsGA: true },
  { credential: 'Stage Table South', commandCenter: false, backOfHouse: false, stage: false, backstage: false, vipStageTableNorth: false, vipStageTableSouth: true, vipBackstage: false, vipClubhouse: true, vipDanceFloor: true, grandstandsGA: true },
  { credential: 'Grandstand Table', commandCenter: false, backOfHouse: false, stage: false, backstage: false, vipStageTableNorth: false, vipStageTableSouth: false, vipBackstage: true, vipClubhouse: false, vipDanceFloor: true, grandstandsGA: true },
  { credential: 'VIP', commandCenter: false, backOfHouse: false, stage: false, backstage: false, vipStageTableNorth: false, vipStageTableSouth: false, vipBackstage: false, vipClubhouse: true, vipDanceFloor: true, grandstandsGA: true },
];

export const RESOURCE_LOCATIONS: ResourceLocation[] = [
  { resource: 'AED Defibrillator', location: 'Command Center (Clubhouse 3F), Production Office, GA Entrance gate, VIP Entrance, Medical (north station)', zone: 'All zones' },
  { resource: 'First Aid & Medical', location: 'North station near food vendors, south station between VIP Dance Floor and VIP Clubhouse — EMTs + paramedics staffed', zone: 'All zones' },
  { resource: 'Fire Extinguisher (ABC)', location: 'Every 75 feet throughout footprint, every bar, kitchen, backstage, and electrical panel', zone: 'All zones' },
  { resource: 'Fire Alarm Pull Station', location: 'Every exit in Clubhouse + Casino', zone: 'Indoor' },
  { resource: 'Spill Kit', location: 'Each bar, cleaning staging, Production Office', zone: 'Service/Ops' },
  { resource: 'Narcan (Naloxone)', location: 'Medical stations + roving medical', zone: 'All zones' },
  { resource: 'Earplugs (free)', location: 'First Aid stations', zone: 'All zones' },
  { resource: 'Water Fountains', location: 'Located near most grandstand restrooms throughout the venue', zone: 'All zones' },
];

export const EVACUATION_ROUTES: EvacuationRoute[] = [
  { from: 'Dance Floor (GA)', route: 'South through GA Entrance gate toward E 4th Ave', destination: 'Parking Zone C' },
  { from: 'Grandstands (GA)', route: 'Descend nearest stairway to ground level, south toward E 4th Ave', destination: 'Parking Zone C' },
  { from: 'VIP Dance Floor', route: 'West through VIP Entrance, south along venue perimeter', destination: 'Parking Zone C' },
  { from: 'VIP Clubhouse', route: 'Nearest Clubhouse exit to exterior, south along venue perimeter', destination: 'Parking Zone C' },
  { from: 'Casino', route: 'Nearest Casino exit per venue fire plan, south toward E 4th Ave', destination: 'Parking Zone C' },
  { from: 'Clubhouse 3F (Crew)', route: 'Down nearest stairway, exit Clubhouse, south along venue perimeter', destination: 'Parking Zone C' },
];

export const GUEST_FAQ: FAQPair[] = [
  { question: 'What time do doors open?', answer: 'Doors open at 6:00 PM for all guests — GA, VIP, and VIP Table holders.' },
  { question: 'What time does the music start?', answer: 'Canela B2B Fiin open at 6:00 PM. Kaz James takes over at 7:30 PM, followed by Carlita at 9:00 PM. Black Coffee headlines from 10:30 PM until 1:00 AM.' },
  { question: 'What are the age requirements?', answer: 'GA is 18+ and VIP is 21+. A valid government-issued photo ID is required for entry — no exceptions. Acceptable forms include a driver\'s license, passport, or state ID.' },
  { question: 'Is there a dress code?', answer: 'There is no formal dress code, but we encourage smart-casual attire. This is an outdoor event on racetrack grounds, so comfortable shoes are recommended. Stilettos and open-toe shoes can be challenging on grass and gravel surfaces.' },
  { question: 'What can I bring?', answer: 'You may bring a small clutch or bag (no larger than 12" × 6" × 12"). Clear bags are encouraged for faster entry. Sealed, empty reusable water bottles are welcome.' },
  { question: 'Are water bottles allowed?', answer: 'Sealed, empty reusable water bottles are welcome. Free water fountains are available near most grandstand restrooms.' },
  { question: 'Can I leave and come back?', answer: 'This is a no re-entry event for GA and VIP guests — once you exit the venue, you will not be permitted to re-enter. Artists and touring parties may leave and return with their Liaison.' },
  { question: 'Where should my rideshare drop me off?', answer: 'The rideshare loop is on E 32nd St and E 2nd Ave, eastbound only — no left turns. Have your driver follow signage to the designated drop-off zone. Follow the signs from the drop-off area to the entrance.' },
  { question: 'Is there on-site parking?', answer: 'Yes. Guest parking is available in the main Hialeah Park lots. Enter via E 4th Ave. Parking attendants will direct you. Arrive early — lots fill up.' },
  { question: 'Is this event outdoors?', answer: 'Yes. The main event takes place on the Racetrack Grounds, which is an outdoor venue. Some covered areas are available in the Clubhouse and Casino, but most of the experience is open-air. Check the weather forecast and dress accordingly.' },
  { question: 'Are there ATMs on site?', answer: 'Yes. ATMs are located inside the Casino building and near the Clubhouse entrance. Standard transaction fees apply.' },
  { question: 'What if I lose something?', answer: 'Visit Guest Services adjacent to the VIP Entrance during the event. After the event, contact info@clubspace.com with a description of the lost item.' },
  { question: 'What if I need medical help?', answer: 'Find any staff member or security guard — they will call for medical support immediately. Medical stations with EMTs and paramedics are located on the north side of the footprint and between the VIP Dance Floor and VIP Clubhouse. AEDs and first aid kits are positioned throughout the venue.' },
  { question: 'Is the venue ADA accessible?', answer: 'Yes. ADA-accessible entrances, viewing areas, and restrooms are available. If you need accommodation, contact info@clubspace.com before the event or ask any staff member in a high-visibility vest on-site.' },
  { question: 'Can I bring a professional camera?', answer: 'Professional cameras, drones, GoPros, and recording equipment are not permitted. Phone cameras are welcome for personal use.' },
  { question: 'Is there a smoking area?', answer: 'Yes. Designated smoking areas are located near the Crew Parking perimeter. Smoking is not permitted inside any building or in the GA or VIP areas.' },
  { question: 'What items are prohibited?', answer: 'Prohibited items include: weapons or sharp objects, illegal substances, outside food or beverages, professional cameras or recording equipment, drones, laser pointers, fireworks or flares, large bags or backpacks, chairs or blankets, glass containers, and any item deemed a safety risk by security.' },
  { question: 'What happens if someone is too intoxicated?', answer: 'Our trained staff and security team will assess the situation compassionately. Guests who are visibly over-served will be offered water, a seat in a monitored area, and assistance arranging a safe ride home. Beverage service will be paused for that individual. We prioritize safety and dignity. Note: alcohol service is limited to guests 21+ with valid ID.' },
  { question: 'What\'s the difference between VIP and GA?', answer: 'GA (18+) gives you full access to the Dance Floor, Grandstands, and all GA bars and amenities. VIP (21+) includes everything in GA plus access to the VIP Clubhouse and VIP Dance Floor with premium bars, elevated viewing, and dedicated restrooms. VIP Table holders receive a reserved table, bottle service, and a dedicated server.' },
  { question: 'How does VIP Table service work?', answer: 'VIP Table holders receive a reserved table in the VIP Clubhouse with bottle service. Your dedicated server will be introduced upon arrival. Minimum spend requirements apply per your booking confirmation. Doors open at 6:00 PM.' },
  { question: 'What if my wristband falls off?', answer: 'Visit Guest Services adjacent to the VIP Entrance. Bring your ID and ticket confirmation — they can issue a replacement. A replacement fee may apply.' },
  { question: 'What if my phone dies?', answer: 'Visit Guest Services with your photo ID. They can look up your ticket and issue a replacement wristband. We recommend screenshotting your ticket in advance as a backup.' },
  { question: 'Can my GA friends visit me in VIP?', answer: 'No. GA tickets do not grant access to VIP areas. You can meet your friends in the GA areas — your VIP credential gives you access to both GA and VIP.' },
];

export const ASSEMBLY_POINT = 'Parking Zone C (GA Lot)';
export const EMS_STAGING = 'E 4th Ave entrance';
