import type { GuideConfig } from './types';

const guests: GuideConfig = {
  id: 'guests',
  tier: 5,
  title: 'GUESTS',
  classification: '',
  scope: 'GA, VIP, VIP Table Holders',
  icon: '🦩',
  callTime: 'Doors at 6:30 PM (VIP at 6:00 PM · VIP Table at 5:30 PM)',
  hours: '6:00 PM – 2:00 AM',

  // ── Before You Arrive ──────────────────────────────────────────────
  preArrival: [
    'Charge your phone — you\'ll need it for your ticket and rideshare home.',
    'Grab your ID. This is 21+, no exceptions. Driver\'s license, passport, or state ID.',
    'Check the weather — this is an outdoor event on the racetrack grounds.',
    'Wear comfortable shoes. Grass and gravel are part of the charm, but stilettos are not your friend here.',
    'Small bags only (12" × 6" × 12" max). Clear bags get you through the line faster.',
    'Sealed, empty water bottles are welcome — we have free refill stations inside.',
  ],
  vehicleRoute: 'Enter via E 4th Ave and follow event signage to parking.',
  parking: 'Guest parking is in the main Hialeah Park lots. Enter via E 4th Ave. Parking attendants will direct you. Arrive early — lots fill up.',
  rideshare: 'The rideshare loop is on E 32nd St and E 2nd Ave, eastbound only — no left turns. Have your driver follow signage to the designated drop-off zone. Follow the signs from the drop-off area to the entrance.',
  transit: 'MetroRail Green Line to Hialeah Station (125 E 21st St). About 15–20 minute walk north on Palm Ave. Runs 5 AM to midnight. $2.25 per trip. Heads up: MetroRail shuts down around midnight and this event runs until 2 AM. Have a rideshare plan for the way home.',
  wayfinding: 'Follow the event signage from parking or the rideshare zone. The entrance is clearly marked. Look for the staff in pink — they\'ll point you in the right direction.',
  credentials: 'Have your ticket ready on your phone (screenshot works). You\'ll receive a wristband at the gate. VIP and VIP Table holders will be directed to the VIP entrance at the Fountain Terrace.',
  entrance: 'GA: Main entrance gate. VIP + VIP Table: Fountain Terrace entrance.',
  additionalNotes: [
    'This is a no re-entry event. Once you leave, you can\'t come back in.',
    'Free water refill stations are at the GA Entrance, VIP area, and Paddock.',
    'Free earplugs are available at the Medical Tent and Info Booth.',
    'ATMs are inside the Casino building and near the Clubhouse entrance.',
  ],

  // ── Show Day ───────────────────────────────────────────────────────
  scheduleAltContent: 'Here\'s your evening at a glance. Arrive early, find your spot, and let the music take you.',

  showTimeline: [
    { time: '5:30 PM', activity: 'VIP Table early admission' },
    { time: '6:00 PM', activity: 'VIP + VIP Table doors open' },
    { time: '6:30 PM', activity: 'GA doors open — welcome to the Racetrack' },
    { time: '7:00 PM', activity: 'Kaz James' },
    { time: '9:30 PM', activity: 'Carlita' },
    { time: '11:30 PM', activity: 'Black Coffee (Headline)' },
    { time: '1:30 AM', activity: 'Last call' },
    { time: '2:00 AM', activity: 'Music ends — bars close' },
    { time: '2:30 AM', activity: 'Venue close — time to head home' },
  ],

  venueAmenities: [
    'Free water refill stations (GA Entrance, VIP area, Paddock)',
    'Free earplugs (Medical Tent + Info Booth)',
    'ATMs (Casino building + Clubhouse entrance)',
    'Restrooms (GA area, VIP area, Clubhouse)',
    'Info Booth (near GA Entrance)',
    'Covered areas (Paddock, Clubhouse balcony)',
    'Smoking areas (Paddock, Crew Parking perimeter)',
    'ADA-accessible entrances, viewing areas, and restrooms',
  ],

  // ── Safety ─────────────────────────────────────────────────────────
  safetyAltContent: [
    'We\'ve got a full team looking out for you — security, medical, and event staff are everywhere.',
    'If you need help, find any staff member. They\'ll take care of you.',
    'EMTs and paramedics are on-site all night at the Medical Tent in the Paddock.',
    'AEDs and first aid kits are positioned throughout the venue.',
    'Free earplugs are available at the Medical Tent and Info Booth — your hearing matters.',
  ],

  accessibilityItems: [
    { feature: 'ADA Entrance', detail: 'Accessible entrance at GA gate with ramp and level pathway' },
    { feature: 'ADA Viewing', detail: 'Designated accessible viewing area in GA and VIP with companion seating' },
    { feature: 'ADA Restrooms', detail: 'Accessible restroom units in GA, VIP, and Clubhouse' },
    { feature: 'Service Animals', detail: 'Service animals welcome in all public areas per ADA guidelines' },
    { feature: 'Assistance', detail: 'Need anything? Ask any staff member or visit the Info Booth near the GA Entrance.' },
  ],

  // ── Communications ─────────────────────────────────────────────────
  commsAltContent: [
    'We\'re here to help. If you need anything, find a staff member — they\'re the ones in pink or high-vis.',
    'The Info Booth near the GA Entrance is your go-to for questions, lost items, and general help.',
    'For medical help, tell any staff member or security guard — they\'ll call it in immediately.',
    'If you need ADA assistance, visit the Info Booth or ask any staff member.',
  ],

  contactsIntro: 'We\'re here to help. Here\'s how to reach us:',

  // ── Emergency ──────────────────────────────────────────────────────
  emergencyAltContent: [
    'If you hear an emergency announcement, stay calm and follow the instructions.',
    'Look for staff members in pink or high-vis vests — they\'ll direct you to safety.',
    'If you need to evacuate, follow staff to the Assembly Point in Parking Lot Zone C.',
    'Do not re-enter the venue after an evacuation until staff confirms it\'s safe.',
    'If you see something concerning, tell the nearest staff member or security guard.',
    'If someone near you needs medical help, alert any staff member — medical response is fast.',
    'Your safety is our top priority. We\'ve planned for every scenario so you can enjoy the night.',
  ],

  securityPolicies: [
    'Bag check at entry — small bags only (12" × 6" × 12" max)',
    'No weapons, sharp objects, illegal substances, or professional cameras',
    'No outside food or beverages (sealed empty water bottles OK)',
    'No re-entry',
    'Wristband must be worn and visible at all times',
    'Security has final say on entry — please respect their decisions',
  ],

  // ── Resources ──────────────────────────────────────────────────────
  fireSafety: [
    { item: 'Fire Extinguisher', spec: 'Located throughout the venue — staff will use if needed' },
    { item: 'Exit Signs', spec: 'Illuminated exit signs at every exit — follow them in an emergency' },
    { item: 'Emergency Lighting', spec: 'All exits and corridors stay lit, even in a power outage' },
    { item: 'Covered Shelter', spec: 'Clubhouse and Casino are designated shelter areas for severe weather' },
    { item: 'Assembly Point', spec: 'Parking Lot Zone C — follow staff in an emergency' },
  ],

  // ── Sustainability ─────────────────────────────────────────────────
  sustainabilityItems: [
    { initiative: 'Water Stations', detail: 'Free refill stations reduce single-use plastic. Bring your reusable bottle.' },
    { initiative: 'Recycling', detail: 'Recycling bins are paired with every trash bin. Please separate your waste.' },
    { initiative: 'Local Sourcing', detail: 'Our bars feature locally sourced ingredients and Florida-based craft beverages where possible.' },
    { initiative: 'Carbon Offset', detail: 'GHXSTSHIP Industries purchases carbon offsets for all production travel and freight.' },
  ],

  // ── Contacts ───────────────────────────────────────────────────────
  contactDirectory: [
    { type: 'header', label: 'During the Event' },
    { type: 'entry', label: 'Info Booth', phone: 'Near GA Entrance', notes: 'Questions, lost items, ADA assistance' },
    { type: 'entry', label: 'Medical Tent', phone: 'Paddock area', notes: 'EMTs + paramedics on-site all night' },
    { type: 'header', label: 'After the Event' },
    { type: 'entry', label: 'GHXSTSHIP Industries', phone: 'sos@ghxstship.pro', notes: 'Lost items, feedback, general inquiries' },
    { type: 'header', label: 'Emergency' },
    { type: 'entry', label: 'Police / Fire / EMS', phone: '911', notes: 'Life-threatening emergencies' },
    { type: 'entry', label: 'Poison Control', phone: '1-800-222-1222', notes: '24/7 hotline' },
    { type: 'header', label: 'Well-Being' },
    { type: 'entry', label: 'Crisis Text Line', phone: 'Text HOME to 741741', notes: '24/7 crisis support' },
    { type: 'entry', label: 'SAMHSA Helpline', phone: '1-800-662-4357', notes: 'Substance abuse & mental health' },
  ],
};

export default guests;
