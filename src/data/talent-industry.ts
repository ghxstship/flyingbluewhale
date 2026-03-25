import type { GuideConfig } from './types';

const talentIndustry: GuideConfig = {
  id: 'talent-industry',
  tier: 4,
  title: 'TALENT & INDUSTRY',
  classification: 'CONFIDENTIAL — ARTIST & INDUSTRY ACCESS',
  scope: 'Artists, Touring Parties, Management, Agents, Industry Guests, Media',
  icon: '🦩',
  callTime: 'Per your Liaison — check your advance email',
  hours: 'Event: 6:00 PM – 1:00 AM',

  preArrival: [
    'Your Artist Liaison will confirm your arrival time, vehicle instructions, and credential pickup.',
    'Bring valid photo ID — required for credentialing.',
    'Review your advance email for green room details and schedule.',
    'Pack anything you need for the evening — re-entry is not permitted.',
    'If you have dietary needs or allergies, notify your Liaison in advance.',
  ],
  vehicleRoute:
    'Your Liaison will provide specific arrival instructions in advance. Artists with arranged vehicles arrive via E 32nd St with Liaison escort to backstage.',
  parking:
    'Artist and industry vehicles enter via E 4th Ave and follow event signage. Your Liaison will coordinate your specific parking area.',
  rideshare:
    'The rideshare loop is on E 32nd St and E 2nd Ave, eastbound only — no left turns. Have your driver follow signage to the designated drop-off zone. Your Liaison will meet you at the drop-off.',
  transit:
    'MetroRail Green Line to Hialeah Station (125 E 21st St). From the platform, take the pedestrian bridge over the tracks to the north side, then follow event signage through the parking lot. Your Liaison can meet you at the station if arranged in advance.',
  wayfinding:
    'Your Liaison will meet you at your arrival point — whether that\'s the rideshare drop-off, parking area, or pedestrian bridge — and escort you directly to the Green Room or VIP area.',
  credentials:
    'Your Liaison will have your credential ready upon arrival. Artist/Touring wristband provides backstage, stage, VIP, and GA access. Industry credential provides VIP and GA access.',
  entrance:
    'Artists: Production Gate (E 32nd St) with Liaison escort. Industry: VIP Entrance (Fountain Terrace).',
  additionalNotes: [
    'Your Liaison is your single point of contact for everything — requests, questions, issues.',
    'Wi-Fi: GHXSTSHIP-PROD (password from your Liaison) — production network, not for streaming.',
    'The Green Room is climate-controlled with catering, beverages, and lounge seating.',
    'Photography in backstage areas is restricted — ask your Liaison before posting.',
  ],

  scheduleAltContent:
    'Your schedule is managed by your Artist Liaison. Key milestones will be communicated directly to you. If you have questions about timing, contact your Liaison — not the Production Office.',

  showTimeline: [
    { time: '04:00 PM', activity: 'Green Room open — catering available' },
    { time: '06:00 PM', activity: 'Doors open — all guests' },
    { time: '07:00 PM', activity: 'Kaz James — set begins' },
    { time: '09:30 PM', activity: 'Carlita — set begins' },
    { time: '11:30 PM', activity: 'Black Coffee — set begins (Headline)' },
    { time: '01:00 AM', activity: 'Music ends — event close' },
  ],

  venueAmenities: [
    'Green Room — Climate-controlled backstage lounge with catering and beverages.',
    'VIP Access — Full access to the Fountain Terrace VIP area with premium bars.',
    'Water Fountains — Located near most grandstand restrooms.',
    'Restrooms — Accessible in all VIP and backstage areas.',
    'Medical — EMTs and paramedics staffed throughout the event.',
    'Earplugs — Free at First Aid stations.',
  ],

  safetyAltContent: [
    'Your safety is our priority. Your Liaison is your first point of contact for any concern.',
    'If you feel unsafe at any time, tell your Liaison or any crew member immediately.',
    'If you hear an emergency announcement, follow your Liaison\'s instructions.',
    'The Medical Tent is staffed with EMTs and paramedics throughout the event.',
    'If someone near you needs medical help, alert your Liaison or call out to any crew member.',
  ],

  accessibilityItems: [
    { feature: 'ADA Entrance', detail: 'Accessible entrance at GA gate with ramp and level pathway' },
    { feature: 'ADA Viewing', detail: 'Designated accessible viewing area in GA and VIP with companion seating' },
    { feature: 'ADA Restrooms', detail: 'Accessible restroom units in GA, VIP, and Clubhouse' },
    { feature: 'Service Animals', detail: 'Service animals welcome in all public areas per ADA guidelines' },
    { feature: 'Assistance', detail: 'Staff trained for ADA assistance — ask any team member or visit Guest Services' },
  ],

  commsAltContent: [
    'All communication is routed through your Artist Liaison — you do not need a radio.',
    'If you need something, ask your Liaison. They have direct radio access to all departments.',
    'In an emergency, any crew member in a high-vis vest can help you.',
    'Your Liaison\'s phone number is in your advance email. Save it before you arrive.',
  ],
  contactsIntro: 'Your Liaison is your primary contact. For anything else:',

  emergencyAltContent: [
    'If you hear "Code" followed by a color on a radio or announcement, it means an emergency protocol is active.',
    'Your Liaison will guide you to safety. Stay with them and follow their instructions.',
    'If you cannot find your Liaison, go to the nearest crew member in a high-vis vest.',
    'If you need to evacuate, your Liaison will escort you to the Assembly Point (Parking Zone C).',
    'Do not re-enter the venue after an evacuation until your Liaison confirms it is safe.',
  ],

  fireSafety: [
    { item: 'Fire Extinguisher (ABC)', spec: 'Located throughout the venue — every 75 feet' },
    { item: 'Fire Alarm Pull Station', spec: 'At every exit in Clubhouse + Casino (indoor use)' },
    { item: 'Emergency Lighting', spec: 'All exits and corridors are illuminated' },
    { item: 'Exit Signage', spec: 'Illuminated exit signs at every exit' },
    { item: 'Evacuation Assembly', spec: 'Parking Zone C — your Liaison will guide you' },
  ],

  roleFAQ: [
    {
      question: 'Where is the Green Room?',
      answer:
        'Your Liaison will escort you. It\'s backstage in a climate-controlled area with catering and lounge seating.',
    },
    {
      question: 'What\'s the Wi-Fi?',
      answer:
        'Network: GHXSTSHIP-PROD. Your Liaison will provide the password. Production network — not for streaming.',
    },
    {
      question: 'Is there catering?',
      answer:
        'Yes. The Green Room has catering and beverages. If you have dietary needs, notify your Liaison in advance.',
    },
    {
      question: 'What if I need medical attention?',
      answer:
        'Tell your Liaison immediately. The Medical Tent has EMTs and paramedics. For emergencies, any crew member can call for help.',
    },
    {
      question: 'How many people are in my touring party credential?',
      answer:
        'Per your advance agreement. Your Liaison has the approved list. Additional guests must be arranged in advance.',
    },
    {
      question: 'What happens after my set?',
      answer:
        'Your Liaison will coordinate. You\'re welcome to enjoy the event from VIP, return to the Green Room, or depart. Vehicle arrangements through your Liaison.',
    },
    {
      question: 'What if there\'s an emergency?',
      answer:
        'Stay with your Liaison. They have a radio and will guide you. If separated, find any crew member in a high-vis vest.',
    },
    {
      question: 'What time is sound check?',
      answer:
        'Per your advance schedule. Your Liaison will confirm timing and escort you to the stage.',
    },
  ],
  roleFAQTitle: 'Artist & Industry FAQ',

  contactDirectory: [
    { type: 'header', label: 'Your Liaison' },
    {
      type: 'entry',
      label: 'Artist Liaison',
      phone: 'In your advance email',
      notes: 'Your single point of contact for everything',
    },
    { type: 'header', label: 'Venue' },
    {
      type: 'entry',
      label: 'Hialeah Park Casino',
      phone: '(305) 885-8000',
      notes: 'Main venue line',
    },
    { type: 'header', label: 'Event Producer' },
    {
      type: 'entry',
      label: 'GHXSTSHIP Industries',
      phone: 'sos@ghxstship.pro',
      notes: 'Executive Producer',
    },
    { type: 'header', label: 'Emergency Services' },
    {
      type: 'entry',
      label: 'Police / Fire / EMS',
      phone: '911',
      notes: 'Life-threatening emergencies',
    },
    {
      type: 'entry',
      label: 'Poison Control',
      phone: '1-800-222-1222',
      notes: '24/7 hotline',
    },
    { type: 'header', label: 'Well-Being' },
    {
      type: 'entry',
      label: 'Crisis Text Line',
      phone: 'Text HOME to 741741',
      notes: '24/7 crisis support',
    },
    {
      type: 'entry',
      label: 'SAMHSA Helpline',
      phone: '1-800-662-4357',
      notes: 'Substance abuse & mental health',
    },
  ],
};

export default talentIndustry;
