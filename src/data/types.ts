export interface ScheduleEntry {
  date: string;
  time: string;
  activity: string;
}

export interface TimelineEntry {
  time: string;
  activity: string;
}

export interface PPEEntry {
  gear: string;
  spec: string;
  who: string;
}

export interface RadioChannel {
  channel: string;
  assignment: string;
  notes: string;
}

export interface CodeWord {
  code: string;
  meaning: string;
}

export interface COCEntry {
  role: string;
  responsibility: string;
  radio: string;
}

export interface EmergencySOP {
  title: string;
  code: string;
  steps: string[];
  note: string;
}

export interface ContactSection {
  type: "header" | "entry";
  label: string;
  phone?: string;
  notes?: string;
}

export interface FAQPair {
  question: string;
  answer: string;
}

export interface CredentialRow {
  credential: string;
  commandCenter: boolean;
  backOfHouse: boolean;
  stage: boolean;
  backstage: boolean;
  vipStageTableNorth: boolean;
  vipStageTableSouth: boolean;
  vipBackstage: boolean;
  vipClubhouse: boolean;
  vipDanceFloor: boolean;
  grandstandsGA: boolean;
  note?: string;
}

export interface ResourceLocation {
  resource: string;
  location: string;
  zone: string;
}

export interface EvacuationRoute {
  from: string;
  route: string;
  destination: string;
}

export interface FireSafetyItem {
  item: string;
  spec: string;
}

export interface LifeSafetyItem {
  item: string;
  spec: string;
}

export interface AccessibilityItem {
  feature: string;
  detail: string;
}

export interface SustainabilityItem {
  initiative: string;
  detail: string;
}

export interface GuideConfig {
  id: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  classification: string;
  scope: string;
  icon: string;
  callTime: string;
  hours: string;

  // Page 2 - Before You Arrive
  preArrival: string[];
  vehicleRoute: string;
  parking: string;
  rideshare: string;
  transit: string;
  wayfinding: string;
  credentials: string;
  entrance: string;
  additionalNotes: string[];

  // Page 3 - Build & Strike
  buildSchedule?: ScheduleEntry[];
  strikeSchedule?: ScheduleEntry[];
  scheduleAltContent?: string;

  // Page 4 - Show Day
  showTimeline?: TimelineEntry[];
  showAltContent?: string;
  venueAmenities?: string[];

  // Page 5 - Safety
  ppeTable?: PPEEntry[];
  safetyRules?: string[];
  safetyAltContent?: string[];
  accessibilityItems?: AccessibilityItem[];

  // Page 6 - Communications
  radioChannels?: RadioChannel[];
  codeWords?: CodeWord[];
  radioProtocol?: string;
  chainOfCommand?: COCEntry[];
  commsAltContent?: string[];
  contactsIntro?: string;

  // Page 7 - Emergency
  emergencySOPs?: EmergencySOP[];
  emergencyAltContent?: string[];
  securityPolicies?: string[];

  // Page 8 - Resources
  fireSafety?: FireSafetyItem[];
  lifeSafety?: LifeSafetyItem[];

  // Page 9 - Guest FAQ intro
  guestFAQIntro?: string;

  // Page 10 - Role FAQ + Contacts
  roleFAQ?: FAQPair[];
  roleFAQTitle?: string;
  contactDirectory: ContactSection[];
  sustainabilityItems?: SustainabilityItem[];
}
