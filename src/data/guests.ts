import type { GuideConfig } from './types';

const guests: GuideConfig = {
  id: 'guests',
  tier: 5,
  title: 'GUESTS',
  classification: '',
  scope: 'GA, VIP, VIP Table Reservations',
  icon: '🦩',
  callTime: 'Doors at 6:00 PM',
  hours: '6:00 PM – 1:00 AM',

  // ── Before You Arrive ──────────────────────────────────────────────
  preArrival: [
    'Charge your phone — you\'ll need it for your ticket and rideshare home.',
    'Grab your ID. GA is 18+ and VIP is 21+ — no exceptions. Driver\'s license, passport, or state ID.',
    'Check the weather — this is an outdoor event on the racetrack grounds.',
    'Wear comfortable shoes. Grass and gravel are part of the charm, but stilettos are not your friend here.',
    'Small bags only (12" × 6" × 12" max). Clear bags get you through the line faster.',
    'Sealed, empty water bottles are welcome — free water fountains are available inside.',
  ],
  vehicleRoute: 'Enter via E 4th Ave and follow event signage to parking. Parking attendants will direct you to the right lot.',
  parking: 'Guest parking is in the main Hialeah Park lots off E 4th Ave. Follow signage and parking attendants to your spot. Arrive early — lots fill up.',
  rideshare: 'The rideshare loop is on E 32nd St and E 2nd Ave, eastbound only — no left turns. Have your driver follow signage to the designated drop-off zone. From the drop-off, follow the signs toward the entrance — it\'s a short walk.',
  transit: 'MetroRail Green Line to Hialeah Station (125 E 21st St). From the platform, take the pedestrian bridge over the tracks to the north side, then follow event signage through the parking lot to the entrances. Runs 5 AM to midnight. $2.25 per trip. Heads up: MetroRail shuts down around midnight and this event runs until 1 AM. Have a rideshare plan for the way home.',
  wayfinding: 'However you arrive — by car, rideshare, or transit — follow the event signage to the entrance gates. Look for the staff in high-visibility vests — they\'ll point you in the right direction. Have your ticket ready on your phone (a screenshot works).',
  credentials: 'You\'ll receive a wristband at the gate. VIP and VIP Table holders will be directed to the VIP Entrance.',
  entrance: 'GA: Main entrance gate. VIP + VIP Table: VIP Entrance.',
  additionalNotes: [
    'This is a no re-entry event. Once you leave, you can\'t come back in.',
    'Free water fountains are available near most grandstand restrooms.',
    'Free earplugs are available at First Aid stations.',
    'ATMs are inside the Casino building and near the Clubhouse entrance.',
  ],

  // ── Show Day ───────────────────────────────────────────────────────
  scheduleAltContent: 'Here\'s your evening at a glance. Arrive early, find your spot, and let the music take you.',

  showTimeline: [
    { time: '6:00 PM', activity: 'Doors open — welcome to the Racetrack' },
    { time: '7:00 PM', activity: 'Kaz James' },
    { time: '9:30 PM', activity: 'Carlita' },
    { time: '11:30 PM', activity: 'Black Coffee (Headline)' },
    { time: '12:45 AM', activity: 'Last call — bars close' },
    { time: '1:00 AM', activity: 'Music ends' },
    { time: '2:00 AM', activity: 'Venue close — time to head home' },
  ],

  venueAmenities: [
    'Water Fountains — Located near most grandstand restrooms. Bring your reusable bottle.',
    'Earplugs — Free earplugs available at First Aid stations. Your hearing matters.',
    'ATMs — Located inside the Casino building and near the Clubhouse entrance.',
    'Restrooms — Available in the GA area, VIP area, and Clubhouse. ADA-accessible units in all locations.',
    'Guest Services — Adjacent to the VIP Entrance for questions, lost items, and ADA assistance.',
    'Covered Areas — The Paddock and Clubhouse balcony offer shelter from sun and weather.',
    'Smoking Areas — Designated areas in the Paddock and near the Crew Parking perimeter. No smoking inside any building or in the main GA/VIP areas.',
    'Food & Drink — Full bar service with craft cocktails, beer, wine, and non-alcoholic options. GA is 18+, alcohol service is 21+ with valid ID. VIP Table holders receive dedicated bottle service.',
    'Charging — Portable chargers are welcome. Keep your phone charged for your ticket and rideshare home.',
  ],

  // ── Safety ─────────────────────────────────────────────────────────
  safetyAltContent: [
    'We\'ve got a full team looking out for you — security, medical, and event staff are everywhere.',
    'If you need help, find any staff member. They\'ll take care of you.',
    'EMTs and paramedics are on-site all night at the Medical Tent in the Paddock.',
    'AEDs and first aid kits are positioned throughout the venue.',
    'Free earplugs are available at First Aid stations — your hearing matters.',
  ],

  accessibilityItems: [
    { feature: 'ADA Entrance', detail: 'Accessible entrance at GA gate with ramp and level pathway' },
    { feature: 'ADA Viewing', detail: 'Designated accessible viewing area in GA and VIP with companion seating' },
    { feature: 'ADA Restrooms', detail: 'Accessible restroom units in GA, VIP, and Clubhouse' },
    { feature: 'Service Animals', detail: 'Service animals welcome in all public areas per ADA guidelines' },
    { feature: 'Assistance', detail: 'Need anything? Ask any staff member or visit Guest Services adjacent to the VIP Entrance.' },
  ],

  // ── Communications ─────────────────────────────────────────────────
  commsAltContent: [
    'We\'re here to help. If you need anything, find a staff member — they\'re the ones in high-visibility vests.',
    'Guest Services is adjacent to the VIP Entrance — your go-to for questions, lost items, and general help.',
    'For medical help, tell any staff member or security guard — they\'ll call it in immediately.',
    'If you need ADA assistance, visit the Guest Services or ask any staff member.',
  ],

  contactsIntro: 'We\'re here to help. Here\'s how to reach us:',

  // ── Emergency ──────────────────────────────────────────────────────
  emergencyAltContent: [
    'If you hear an emergency announcement, stay calm and follow the instructions.',
    'Look for staff members in high-visibility vests — they\'ll direct you to safety.',
    'If you need to evacuate, follow staff to the Assembly Point in Parking Zone C.',
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
    { item: 'Assembly Point', spec: 'Parking Zone C — follow staff in an emergency' },
  ],

  // ── Sustainability ─────────────────────────────────────────────────
  sustainabilityItems: [
    { initiative: 'Water Fountains', detail: 'Free water fountains reduce single-use plastic. Bring your reusable bottle.' },
    { initiative: 'Recycling', detail: 'Recycling bins are paired with every trash bin. Please separate your waste.' },
    { initiative: 'Local Sourcing', detail: 'Our bars feature locally sourced ingredients and Florida-based craft beverages where possible.' },
  ],

  // ── Contacts ───────────────────────────────────────────────────────
  contactDirectory: [
    { type: 'header', label: 'During the Event' },
    { type: 'entry', label: 'Guest Services', phone: 'Adjacent to VIP Entrance', notes: 'Questions, lost items, ADA assistance' },
    { type: 'entry', label: 'Medical Tent', phone: 'Paddock area', notes: 'EMTs + paramedics on-site all night' },
    { type: 'header', label: 'Emergency' },
    { type: 'entry', label: 'Police / Fire / EMS', phone: '911', notes: 'Life-threatening emergencies' },
    { type: 'entry', label: 'Poison Control', phone: '1-800-222-1222', notes: '24/7 hotline' },
    { type: 'header', label: 'Well-Being' },
    { type: 'entry', label: 'Crisis Text Line', phone: 'Text HOME to 741741', notes: '24/7 crisis support' },
    { type: 'entry', label: 'SAMHSA Helpline', phone: '1-800-662-4357', notes: 'Substance abuse & mental health' },
  ],
};

export default guests;
