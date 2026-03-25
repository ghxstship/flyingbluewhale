import type { GuideConfig } from './types';

const temporary: GuideConfig = {
  id: 'temporary',
  tier: 6,
  title: 'TEMPORARY ACCESS',
  classification: 'INTERNAL — TEMPORARY ACCESS ONLY',
  scope: 'Logistics, Deliveries, Suppliers',
  icon: '🦩',
  callTime: 'Per your contact — confirm before arrival',
  hours: 'As scheduled — escort required at all times',

  preArrival: [
    'Confirm your delivery window or access time with your GHXSTSHIP contact.',
    'Bring valid photo ID and any required permits or certifications.',
    'Wear high-vis vest, closed-toe shoes, and long pants.',
    'All vehicles must display a temporary vehicle pass (provided at check-in).',
    'No weapons, alcohol, or drugs on site — zero tolerance.',
  ],
  vehicleRoute: 'Enter via E 4th Ave and follow event signage. Coordinate your specific entry point with your escort in advance.',
  parking: 'Park only in designated areas as directed by your escort. Follow signage from E 4th Ave and confirm your parking zone before arriving.',
  rideshare: 'The rideshare loop is on E 32nd St and E 2nd Ave, eastbound only — no left turns. Have your driver follow signage to the designated drop-off zone. Your escort will meet you at the drop-off.',
  transit: 'MetroRail Green Line to Hialeah Station (125 E 21st St). From the platform, take the pedestrian bridge over the tracks to the north side. Your escort can meet you at the pedestrian bridge exit if arranged in advance.',
  wayfinding: 'However you arrive, your escort will meet you at the designated check-in point. Do not enter the site without an escort.',
  credentials: 'Check in at the Production Gate with valid photo ID. You will receive a Temporary wristband. Your escort will accompany you at all times on site.',
  entrance: 'Production Gate — E 32nd St (escort required).',
  additionalNotes: [
    'You must be escorted at all times. Do not wander the site.',
    'Temporary credentials do not grant access to any guest, VIP, crew, or backstage areas.',
    'Complete your work and exit promptly. Extended access is not permitted.',
    'All tools and equipment must be removed upon departure.',
  ],

  scheduleAltContent: 'Your delivery window or access time has been confirmed by your GHXSTSHIP contact. Arrive on time and check in at the Production Gate.',

  buildSchedule: [
    { date: 'As Scheduled', time: 'As Scheduled', activity: 'Delivery window — check with your GHXSTSHIP contact' },
    { date: 'As Scheduled', time: 'As Scheduled', activity: 'Inspection window — by appointment only' },
    { date: 'As Scheduled', time: 'As Scheduled', activity: 'Contractor access — escort required' },
  ],

  showAltContent: 'Show day operations are managed by the production team. Temporary access is typically not available during show hours (6:00 PM – 2:00 AM) unless pre-arranged with the Production Office.',

  venueAmenities: [
    'Restrooms — Your escort will direct you to the nearest available facility.',
    'Water Fountains — Located near most grandstand restrooms.',
    'Medical — EMTs and paramedics are on site. Alert your escort if you need help.',
  ],

  safetyAltContent: [
    'Wear your high-vis vest and closed-toe shoes at all times on site.',
    'Follow your escort\'s instructions without exception.',
    'Do not enter any area without your escort present.',
    'Report any safety concern to your escort immediately.',
    'Speed limit on site: 5 MPH for all vehicles.',
    'No smoking except in designated areas.',
  ],

  commsAltContent: [
    'Your escort is your point of contact while on site.',
    'If you need anything, ask your escort — they have radio access to all departments.',
    'In an emergency, follow your escort\'s instructions immediately.',
  ],

  contactsIntro: 'Your escort is your primary contact while on site.',

  emergencyAltContent: [
    'If you hear an alarm or emergency announcement, stop work immediately.',
    'Follow your escort to the nearest exit.',
    'If you cannot find your escort, go to the nearest exit and proceed to the parking lot.',
    'Do not re-enter the site until your escort confirms it is safe.',
    'If someone is injured, call out for help — crew members are nearby.',
    'Do not attempt to fight fires or handle emergencies — exit and let the crew respond.',
  ],

  fireSafety: [
    { item: 'Fire Extinguisher', spec: 'Located throughout the venue — staff will use if needed' },
    { item: 'Exit Signs', spec: 'Illuminated exit signs at every exit — follow them in an emergency' },
    { item: 'Emergency Lighting', spec: 'All exits and corridors stay lit, even in a power outage' },
    { item: 'Evacuation Route', spec: 'Follow your escort to the nearest exit' },
    { item: 'Assembly Point', spec: 'Parking Zone C — follow your escort' },
  ],

  roleFAQ: [
    { question: 'Where do I check in?', answer: 'Production Gate on E 32nd St. Have your photo ID ready.' },
    { question: 'Do I need an escort?', answer: 'Yes. You must be escorted at all times. Do not enter the site without your escort.' },
    { question: 'Where can I park?', answer: 'Your escort will direct you to a temporary parking area. Do not park in Crew Parking or guest lots.' },
    { question: 'Can I access the event areas?', answer: 'No. Temporary credentials do not grant access to guest, VIP, crew, or backstage areas.' },
    { question: 'What if I need to come back?', answer: 'Each visit requires a new check-in and escort. Contact your GHXSTSHIP contact to schedule.' },
    { question: 'What if I have a problem with my delivery?', answer: 'Tell your escort. They\'ll coordinate with the Production Office.' },
    { question: 'Where are the restrooms?', answer: 'Your escort will direct you to the nearest available facility.' },
    { question: 'What\'s the speed limit on site?', answer: '5 MPH for all vehicles. No exceptions.' },
  ],
  roleFAQTitle: 'Temporary Access FAQ',

  contactDirectory: [
    { type: 'header', label: 'On-Site' },
    { type: 'entry', label: 'Production Gate', phone: 'E 32nd St', notes: 'Check-in point for all temporary access' },
    { type: 'entry', label: 'Production Office', phone: 'Clubhouse 3F', notes: 'Escalation for delivery or access issues' },
    { type: 'header', label: 'Emergency' },
    { type: 'entry', label: 'Police / Fire / EMS', phone: '911', notes: 'Life-threatening emergencies' },
    { type: 'entry', label: 'Poison Control', phone: '1-800-222-1222', notes: '24/7 hotline' },
    { type: 'header', label: 'Well-Being' },
    { type: 'entry', label: 'Crisis Text Line', phone: 'Text HOME to 741741', notes: '24/7 crisis support' },
    { type: 'entry', label: 'SAMHSA Helpline', phone: '1-800-662-4357', notes: 'Substance abuse & mental health' },
  ],
};

export default temporary;
