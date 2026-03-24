import type { CredentialRow, ResourceLocation, EvacuationRoute, FAQPair } from './types';

export const EVENT = {
  title: 'Black Coffee + Carlita + Kaz James',
  subtitle: 'Open Air at the Racetrack',
  series: 'Miami Music Week 2026',
  presenter: 'Club Space Miami',
  date: 'Saturday, March 28, 2026',
  venue: 'Hialeah Park Casino — Racetrack Grounds',
  address: '100 E 32nd St, Hialeah, FL 33013',
  phone: '(305) 885-8000',
  capacity: '10,000',
  producer: 'GHXSTSHIP Industries',
  projectCode: 'MMW26-HP',
  sitePlan: 'https://app.cartamaps.com/share/fb788ebb-8b41-4838-b631-4d51097b3e77',
  contact: 'sos@ghxstship.pro',
};

export const SET_TIMES = [
  { time: '7:00 – 9:30 PM', artist: 'Kaz James' },
  { time: '9:30 – 11:30 PM', artist: 'Carlita' },
  { time: '11:30 PM – 2:00 AM', artist: 'Black Coffee', note: 'Headline' },
];

export const KEY_TIMES = [
  { time: '5:00 PM', label: 'Box Office Opens' },
  { time: '5:30 PM', label: 'VIP Table Early Admission' },
  { time: '6:00 PM', label: 'VIP + VIP Table Doors' },
  { time: '6:30 PM', label: 'GA Doors' },
  { time: '1:30 AM', label: 'Last Call' },
  { time: '2:00 AM', label: 'Bars Close' },
  { time: '2:30 AM', label: 'Venue Close' },
];

export const TRANSIT_INFO = {
  metroRail: 'MetroRail Green Line to Hialeah Station (125 E 21st St). About 15–20 minute walk north on Palm Ave. Runs 5 AM to midnight. $2.25 per trip.',
  triRail: 'Tri-Rail connects at Hialeah Market Station — transfer to MetroRail Green Line.',
  bus: 'Bus Route 37 stops at Palm Ave & W 28th St, about a 5-minute walk. Hialeah Flamingo and Marlin circulators also cover the area.',
  freebee: 'Freebee offers free on-demand rides within Hialeah via the app.',
  warning: 'MetroRail shuts down around midnight and this event runs until 2 AM. Have a rideshare plan for the way home.',
};

export const CREDENTIAL_MATRIX: CredentialRow[] = [
  { credential: 'Production (T1)', backstage: true, prodOffice: true, fohTech: true, vipArea: true, gaArea: true, crewPark: true, guestPark: false },
  { credential: 'Operations (T2)', backstage: true, prodOffice: true, fohTech: true, vipArea: true, gaArea: true, crewPark: true, guestPark: false, note: 'Backstage limited to security and medical response' },
  { credential: 'F&B (T3)', backstage: false, prodOffice: true, fohTech: true, vipArea: true, gaArea: true, crewPark: true, guestPark: false },
  { credential: 'Artist/Touring', backstage: true, prodOffice: false, fohTech: true, vipArea: true, gaArea: true, crewPark: false, guestPark: true },
  { credential: 'Industry', backstage: false, prodOffice: false, fohTech: false, vipArea: true, gaArea: true, crewPark: false, guestPark: true },
  { credential: 'VIP Table', backstage: false, prodOffice: false, fohTech: false, vipArea: true, gaArea: true, crewPark: false, guestPark: true },
  { credential: 'VIP', backstage: false, prodOffice: false, fohTech: false, vipArea: true, gaArea: true, crewPark: false, guestPark: true },
  { credential: 'GA', backstage: false, prodOffice: false, fohTech: false, vipArea: false, gaArea: true, crewPark: false, guestPark: true },
  { credential: 'Temporary (T6)', backstage: false, prodOffice: false, fohTech: false, vipArea: false, gaArea: false, crewPark: false, guestPark: false },
];

export const RESOURCE_LOCATIONS: ResourceLocation[] = [
  { resource: 'AED Defibrillator', location: 'Production Office (Clubhouse 2F)', zone: 'Indoor' },
  { resource: 'AED Defibrillator', location: 'GA Entrance gate', zone: 'Outdoor' },
  { resource: 'AED Defibrillator', location: 'VIP Entrance (Fountain Terrace)', zone: 'Outdoor' },
  { resource: 'AED Defibrillator', location: 'Medical Tent (Paddock)', zone: 'Covered' },
  { resource: 'First Aid Kit', location: 'Every staffed position', zone: 'All zones' },
  { resource: 'Medical Tent', location: 'Paddock area — EMTs + paramedics', zone: 'Covered' },
  { resource: 'Fire Extinguisher (ABC)', location: 'Every 75 feet throughout footprint', zone: 'All zones' },
  { resource: 'Fire Extinguisher (ABC)', location: 'Every bar, kitchen, backstage, electrical panel', zone: 'Service areas' },
  { resource: 'Fire Alarm Pull Station', location: 'Every exit in Clubhouse + Casino', zone: 'Indoor' },
  { resource: 'Spill Kit', location: 'Each bar + cleaning staging + Production Office', zone: 'Service/Ops' },
  { resource: 'Narcan (Naloxone)', location: 'Medical Tent + roving medical', zone: 'All zones' },
  { resource: 'Earplugs (free)', location: 'Medical Tent + Info Booth', zone: 'Guest areas' },
  { resource: 'Water Refill Station', location: 'GA Entrance, VIP area, Paddock', zone: 'Guest areas' },
];

export const EVACUATION_ROUTES: EvacuationRoute[] = [
  { from: 'GA / Paddock', route: 'East via GA Entrance → Parking Lot', destination: 'Zone C Assembly' },
  { from: 'VIP / Fountain Terrace', route: 'South via VIP Entrance → Parking Lot', destination: 'Zone C Assembly' },
  { from: 'Backstage / Stage', route: 'North via Production Gate → E 32nd St', destination: 'Zone C Assembly' },
  { from: 'Clubhouse (indoor)', route: 'Nearest marked exit → Parking Lot', destination: 'Zone C Assembly' },
  { from: 'Casino Building', route: 'Nearest exit per venue fire plan', destination: 'Casino Assembly' },
  { from: 'Parking Lot', route: 'Drive or walk to E 4th Ave exit', destination: 'Off-property' },
  { from: 'Crew Parking', route: 'East via E 4th Ave', destination: 'Off-property' },
];

export const GUEST_FAQ: FAQPair[] = [
  { question: 'What time do doors open?', answer: 'GA doors open at 6:30 PM. VIP and VIP Table holders may enter at 6:00 PM. VIP Table early admission begins at 5:30 PM.' },
  { question: 'What time does the music start?', answer: 'Kaz James opens at 7:00 PM. Carlita takes over at 9:30 PM. Black Coffee headlines from 11:30 PM until 2:00 AM.' },
  { question: 'Is this event 21+?', answer: 'Yes. This is a 21+ event. A valid government-issued photo ID is required for entry — no exceptions. Acceptable forms include a driver\'s license, passport, or state ID.' },
  { question: 'Is there a dress code?', answer: 'There is no formal dress code, but we encourage smart-casual attire. This is an outdoor event on racetrack grounds, so comfortable shoes are recommended. Stilettos and open-toe shoes can be challenging on grass and gravel surfaces.' },
  { question: 'What can I bring?', answer: 'You may bring a small clutch or bag (no larger than 12" × 6" × 12"). Clear bags are encouraged for faster entry. Sealed, empty reusable water bottles are allowed and can be filled at our free water refill stations inside the venue.' },
  { question: 'Are water bottles allowed?', answer: 'Sealed, empty reusable water bottles are welcome. We have free water refill stations at the GA Entrance, VIP area, and Paddock.' },
  { question: 'Can I leave and come back?', answer: 'No. This is a no re-entry event. Once you exit the venue, you will not be permitted to re-enter.' },
  { question: 'Where should my rideshare drop me off?', answer: 'Rideshare pickup and drop-off is on E 4th Ave at the marked event zone. Follow the signs from the drop-off area to the entrance — it\'s about a 3-minute walk.' },
  { question: 'Is there on-site parking?', answer: 'Yes. Guest parking is available in the main Hialeah Park lots. Enter via E 4th Ave. Parking attendants will direct you. Arrive early — lots fill up.' },
  { question: 'Is this event outdoors?', answer: 'Yes. The main event takes place on the Racetrack Grounds, which is an outdoor venue. Some covered areas are available (Paddock, Clubhouse balcony), but most of the experience is open-air. Check the weather forecast and dress accordingly.' },
  { question: 'Are there ATMs on site?', answer: 'Yes. ATMs are located inside the Casino building and near the Clubhouse entrance. Standard transaction fees apply.' },
  { question: 'What if I lose something?', answer: 'Visit the Info Booth near the GA Entrance during the event. After the event, contact sos@ghxstship.pro with a description of the lost item.' },
  { question: 'What if I need medical help?', answer: 'Find any staff member or security guard — they will call for medical support immediately. The Medical Tent with EMTs and paramedics is located in the Paddock area. AEDs and first aid kits are positioned throughout the venue.' },
  { question: 'Is the venue ADA accessible?', answer: 'Yes. ADA-accessible entrances, viewing areas, and restrooms are available. If you need accommodation, contact sos@ghxstship.pro before the event or ask any staff member on-site.' },
  { question: 'Can I bring a professional camera?', answer: 'Professional cameras, drones, GoPros, and recording equipment are not permitted. Phone cameras are welcome for personal use.' },
  { question: 'Is there a smoking area?', answer: 'Yes. Designated smoking areas are located in the Paddock and near the Crew Parking perimeter. Smoking is not permitted inside any building or in the main GA/VIP areas.' },
  { question: 'What items are prohibited?', answer: 'Prohibited items include: weapons or sharp objects, illegal substances, outside food or beverages, professional cameras or recording equipment, drones, laser pointers, fireworks or flares, large bags or backpacks, chairs or blankets, glass containers, and any item deemed a safety risk by security.' },
  { question: 'What happens if someone is too intoxicated?', answer: 'Our trained staff and security team will assess the situation compassionately. Guests who are visibly over-served will be offered water, a seat in a monitored area, and assistance arranging a safe ride home. Beverage service will be paused for that individual. We prioritize safety and dignity.' },
  { question: 'What\'s the difference between VIP and GA?', answer: 'GA gives you full access to the Racetrack Grounds, Paddock viewing area, and all GA bars and amenities. VIP includes everything in GA plus access to the Fountain Terrace VIP area with premium bars, elevated viewing, and dedicated restrooms. VIP Table holders receive a reserved table, bottle service, and a dedicated server in the Fountain Terrace.' },
  { question: 'How does VIP Table service work?', answer: 'VIP Table holders receive a reserved table in the Fountain Terrace with bottle service. Your dedicated server will be introduced upon arrival. Minimum spend requirements apply per your booking confirmation. Early admission begins at 5:30 PM so you can settle in before the music starts.' },
];

export const ASSEMBLY_POINT = 'Parking Lot Zone C';
export const EMS_STAGING = 'East Gate';
