import type { GuideConfig } from './types';

const temporary: GuideConfig = {
  id: 'temporary',
  tier: 6,
  title: 'TEMPORARY ACCESS',
  classification: 'INTERNAL — TEMPORARY ACCESS ONLY',
  scope: 'Deliveries, Inspectors, Contractors, Vendors, Day-of Hires',
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
  vehicleRoute: 'Enter via the E 32nd St Production Gate. Follow escort instructions. Do not deviate from the assigned route.',
  parking: 'Temporary vehicles park only in designated areas as directed by your escort. Do not park in Crew Parking or guest lots.',
  rideshare: 'If arriving by rideshare, be dropped at the E 32nd St Production Gate. Do not use the guest entrance.',
  transit: 'Not recommended for temporary access. Drive or rideshare.',
  wayfinding: 'You will be met at the Production Gate by your escort. Do not enter the site without an escort.',
  credentials: 'Check in at the Production Gate with valid photo ID. You will receive a Temporary wristband. Your escort will accompany you at all times.',
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

  showAltContent: 'Show day operations are managed by the production team. Temporary access is typically not available during show hours (4:00 PM – 2:30 AM) unless pre-arranged with the Production Office.',

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
    { item: 'Assembly Point', spec: 'Parking Lot Zone C — follow your escort' },
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
    { type: 'entry', label: 'Production Office', phone: 'Clubhouse 2F', notes: 'Escalation for delivery or access issues' },
    { type: 'header', label: 'Event Producer' },
    { type: 'entry', label: 'GHXSTSHIP Industries', phone: 'sos@ghxstship.pro', notes: 'Pre-arrange access or schedule changes' },
    { type: 'header', label: 'Emergency' },
    { type: 'entry', label: 'Police / Fire / EMS', phone: '911', notes: 'Life-threatening emergencies' },
  ],
};

export default temporary;
