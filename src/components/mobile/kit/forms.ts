/* COMPVSS Field — mobile form system. Data-driven full-screen forms used across
   the PWA (advance requests, reports, swaps, time off, jobs, marketplace, etc.).
   Ported verbatim from the prototype's FORMS config map. */

export type FormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "combo"
  | "seg"
  | "switch"
  | "date"
  | "time"
  | "number"
  | "photo"
  | "file"
  // Freehand signature + typed fallback, captured as a PNG File. Field
  // sign-off (briefing acknowledgement, delivery receipt, daily-log
  // sign-out) had no mobile surface at all: SignaturePad shipped but was
  // mounted only in the offer/msa/personal shells.
  | "sign"
  | "avatar";

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  requiredFor?: string[];
  options?: string[];
  placeholder?: string;
  default?: string;
  half?: boolean;
  hint?: string;
};

export type FormDef = {
  title: string;
  icon: string;
  submit: string;
  intro?: string;
  kicker?: string;
  fields: FormField[];
};

export type Forms = Record<string, FormDef>;

// Field types: text, textarea, select, seg, switch, date, time, number, photo, file
export const FORMS: Forms = {
  advance: {
    title: "Advance Request", icon: "ClipboardList", submit: "Submit Request",
    intro: "Request gear, credentials or services for an upcoming shift.",
    fields: [
      { id: "cat", label: "Category", type: "select", required: true, options: ["Credential", "Radio", "Earpiece", "Meal Voucher", "Parking", "Other"] },
      { id: "type", label: "Item / Type", type: "text", placeholder: "e.g. Motorola R7", required: true },
      { id: "qty", label: "Quantity", type: "number", default: "1", half: true },
      { id: "needed", label: "Needed By", type: "date", half: true },
      { id: "special", label: "Special Requests", type: "textarea", placeholder: "Sizing, channel, dietary, etc." },
      { id: "purpose", label: "Operational Purpose", type: "textarea", placeholder: "Why is this needed for the operation?", requiredFor: ["Credential", "Radio", "Other"] },
      { id: "notes", label: "Additional Notes", type: "textarea", placeholder: "Anything else ops should know…" },
    ],
  },
  incident: {
    title: "Incident Report", icon: "TriangleAlert", submit: "Submit Report",
    intro: "Safety, security or medical event.",
    fields: [
      { id: "severity", label: "Severity", type: "seg", options: ["High", "Medium", "Low"], default: "Medium", required: true },
      { id: "injury", label: "Injuries Involved", type: "switch" },
      { id: "where", label: "Location", type: "text", placeholder: "e.g. Gate 3 · NE corner", required: true },
      { id: "when", label: "Time Of Incident", type: "time" },
      { id: "what", label: "What Happened", type: "textarea", placeholder: "Describe the incident…", required: true },
      { id: "action", label: "Immediate Action Taken", type: "textarea", placeholder: "What did you do?" },
      { id: "photo", label: "Photos", type: "photo" },
      { id: "anon", label: "Submit Anonymously", type: "switch" },
    ],
  },
  lostfound: {
    title: "Lost & Found", icon: "Search", submit: "Submit Report",
    intro: "Log a found or missing item.",
    fields: [
      { id: "kind", label: "Type", type: "seg", options: ["Found", "Lost"], default: "Found", required: true },
      { id: "item", label: "Item", type: "text", placeholder: "e.g. Black backpack", required: true },
      { id: "where", label: "Location", type: "text", placeholder: "Where it was found / lost", required: true },
      { id: "what", label: "Description", type: "textarea", placeholder: "Color, brand, contents…", required: true },
      { id: "holding", label: "Now Held At", type: "text", placeholder: "e.g. Gate office" },
      { id: "photo", label: "Photos", type: "photo" },
    ],
  },
  maintenance: {
    title: "Maintenance Report", icon: "Wrench", submit: "Submit Report",
    intro: "Broken gear, hazard or repair need.",
    fields: [
      { id: "severity", label: "Priority", type: "seg", options: ["Urgent", "Medium", "Low"], default: "Medium", required: true },
      { id: "asset", label: "Asset / Equipment", type: "text", placeholder: "e.g. Forklift #3" },
      { id: "where", label: "Location", type: "text", placeholder: "Where is it?", required: true },
      { id: "what", label: "Issue", type: "textarea", placeholder: "Describe the problem…", required: true },
      { id: "hazard", label: "Safety Hazard", type: "switch" },
      { id: "photo", label: "Photos", type: "photo" },
    ],
  },
  event: {
    title: "Add Event", icon: "CalendarPlus", submit: "Create Event",
    intro: "Schedule a shift, meeting, training or run-of-show item.",
    fields: [
      { id: "title", label: "Title", type: "text", placeholder: "e.g. Stage L · Changeover", required: true },
      { id: "type", label: "Type", type: "select", options: ["Shift", "Meeting", "Training", "Run of show"], default: "Shift", required: true },
      { id: "date", label: "Date", type: "date", half: true, required: true },
      { id: "start", label: "Start", type: "time", half: true, required: true },
      { id: "location", label: "Location", type: "text", placeholder: "e.g. Wynwood Main" },
      { id: "crew", label: "Assign Crew", type: "text", placeholder: "Names (optional)" },
      { id: "notes", label: "Notes", type: "textarea", placeholder: "Details, agenda or cues…" },
    ],
  },
  swap: {
    title: "Request A Swap", icon: "ArrowLeftRight", submit: "Send Request",
    fields: [
      { id: "shift", label: "Your Shift", type: "select", required: true, options: ["Stage L · Changeover · 19:30", "Gate 3 · Scan & Admit · 16:00", "Load-out Crew · 23:45"] },
      { id: "reason", label: "Reason", type: "seg", options: ["Personal", "Conflict", "Sick"], default: "Personal" },
      { id: "cover", label: "Suggested Cover", type: "text", placeholder: "Crew member (optional)" },
      { id: "notes", label: "Notes", type: "textarea", placeholder: "Add context for ops…" },
    ],
  },
  timeoff: {
    title: "Time Off Request", icon: "CalendarOff", submit: "Submit Request",
    fields: [
      { id: "from", label: "From", type: "date", half: true, required: true },
      { id: "to", label: "To", type: "date", half: true, required: true },
      { id: "type", label: "Type", type: "select", options: ["Unpaid", "Vacation", "Sick", "Personal"], default: "Unpaid" },
      { id: "notes", label: "Notes", type: "textarea", placeholder: "Reason (optional)" },
    ],
  },
  task: {
    // Prototype debris cleaned out when this was finally mounted at
    // /m/tasks/new: the assignee select offered "Cy R." / "Lo M." /
    // "Load-out crew" — invented people, not a real roster read — and
    // `due` was typed `time`, so a due DATE could only ever be an hour.
    // Field tasks assign to the caller (see createFieldTask); reassignment
    // is a console concern.
    title: "New Task", icon: "ListPlus", submit: "Create Task",
    intro: "Assigned to you. Reassign from the console if it belongs to someone else.",
    fields: [
      { id: "title", label: "Task", type: "text", placeholder: "What needs doing?", required: true },
      { id: "priority", label: "Priority", type: "seg", options: ["High", "Medium", "Low"], default: "Medium" },
      { id: "due", label: "Due", type: "date" },
      { id: "notes", label: "Details", type: "textarea", placeholder: "Anything the next person needs to know…" },
    ],
  },
  access: {
    title: "Request Access", icon: "KeyRound", submit: "Submit Request",
    intro: "Ask an admin to enable this permission on your pass.",
    fields: [
      { id: "duration", label: "Duration", type: "seg", options: ["This shift", "This project", "Permanent"], default: "This project" },
      { id: "reason", label: "Reason", type: "textarea", placeholder: "Why do you need this access?", required: true },
      { id: "supervisor", label: "Approving Lead", type: "select", options: ["Mara Voss", "Ops Desk", "Security Lead"] },
    ],
  },
  message: {
    title: "New Message", icon: "PenSquare", submit: "Send",
    fields: [
      { id: "to", label: "To", type: "combo", required: true, placeholder: "Search channel or person…", options: ["# gate-ops", "# all-crew", "# stage-l", "Mara Voss", "Cy Reyes", "Lo Marín", "Ops Desk"] },
      { id: "body", label: "Message", type: "textarea", placeholder: "Write a message…", required: true },
    ],
  },
  handover: {
    title: "Shift Handover", icon: "Repeat", submit: "Submit Handover",
    intro: "End-of-shift report. Passes status, open items and assets to the next crew.",
    fields: [
      { id: "relief", label: "Handing Off To", type: "select", required: true, options: ["Next shift lead", "Priya N. · Crew", "Dane O. · Crew", "Unassigned · Ops to fill"] },
      { id: "status", label: "Post Status", type: "seg", options: ["All Clear", "Watch Items", "Issues"], default: "All Clear", required: true },
      { id: "summary", label: "Shift Summary", type: "textarea", placeholder: "What happened, headcounts, incidents…", required: true },
      { id: "open", label: "Open Items For Next Crew", type: "textarea", placeholder: "Anything outstanding to hand off" },
      { id: "assets", label: "Assets / Keys Passed", type: "text", placeholder: "Radios, credentials, keys returned or passed" },
      { id: "photo", label: "Photos", type: "photo" },
    ],
  },
  reqinfo: {
    title: "Request More Info", icon: "MessageCircleQuestion", submit: "Send Request",
    intro: "Ask the submitter for more detail. They'll be notified to update their request.",
    fields: [
      { id: "fields", label: "What's Needed", type: "textarea", placeholder: "e.g. Attach the operational purpose and return date", required: true },
      { id: "due", label: "Respond By", type: "time" },
    ],
  },
  reassign: {
    title: "Reassign Approver", icon: "UserCog", submit: "Reassign",
    intro: "Route this approval to a different approver.",
    fields: [
      { id: "to", label: "Reassign To", type: "select", required: true, options: ["Mara Voss · Ops Manager", "Safety Officer", "Finance", "Security Lead"] },
      { id: "reason", label: "Reason", type: "textarea", placeholder: "Why reassign?" },
    ],
  },
  expense: {
    title: "Expense Report", icon: "Receipt", submit: "Submit Expense",
    intro: "Submit an expense for reimbursement against this project.",
    fields: [
      { id: "category", label: "Category", type: "select", required: true, options: ["Travel", "Lodging", "Meals", "Fuel", "Supplies", "Equipment", "Other"] },
      { id: "amount", label: "Amount (USD)", type: "text", placeholder: "0.00", required: true, half: true },
      { id: "date", label: "Date", type: "time", half: true },
      { id: "merchant", label: "Merchant", type: "text", placeholder: "Where was it spent?", required: true },
      { id: "receipt", label: "Receipt", type: "photo" },
      { id: "billable", label: "Billable To Client", type: "switch" },
      { id: "notes", label: "Notes", type: "textarea", placeholder: "Add context for finance…" },
    ],
  },
  note: {
    title: "Add Note", icon: "StickyNote", submit: "Save Note",
    intro: "A general note logged to the project record.",
    fields: [
      { id: "topic", label: "Topic", type: "text", placeholder: "Short title", required: true },
      { id: "note", label: "Note", type: "textarea", placeholder: "What's the note?", required: true },
    ],
  },
  shiftnote: {
    title: "Add Shift Note", icon: "StickyNote", submit: "Save Note",
    intro: "Notes attach to this time entry for reporting, compliance or performance.",
    fields: [
      { id: "author", label: "Author", type: "seg", options: ["You", "As Manager"], default: "You", required: true },
      { id: "note", label: "Note", type: "textarea", placeholder: "What happened on this shift?", required: true },
    ],
  },
  invite: {
    title: "Send Invite", icon: "UserPlus", submit: "Send Invite",
    intro: "Invite someone to an organization or project. They'll get an access code to join.",
    fields: [
      { id: "scope", label: "Invite To", type: "seg", options: ["Organization", "Project"], default: "Project", required: true },
      { id: "target", label: "Which", type: "select", required: true, options: ["GHXSTSHIP", "Miami Music Week", "Wynwood Main", "Stage L Build"] },
      { id: "role", label: "Role", type: "select", required: true, options: ["Crew", "Lead", "Vendor", "Guest", "Admin"] },
      { id: "method", label: "Send Via", type: "seg", options: ["Email", "Text", "Link"], default: "Email", required: true },
      { id: "recipient", label: "Recipient", type: "text", placeholder: "Email or phone", required: true },
      { id: "note", label: "Message", type: "textarea", placeholder: "Add a note (optional)" },
    ],
  },
  support: {
    title: "Contact Admin", icon: "LifeBuoy", submit: "Send",
    intro: "Reach your project admin for access issues, errors or update needs.",
    fields: [
      { id: "topic", label: "Topic", type: "select", required: true, options: ["Access / permissions", "Asset issue", "App error", "Schedule", "Other"] },
      { id: "urgent", label: "Urgent", type: "switch" },
      { id: "msg", label: "Message", type: "textarea", placeholder: "Describe what you need…", required: true },
    ],
  },
  job: {
    title: "Post A Job", icon: "Briefcase", submit: "Post Job",
    fields: [
      { id: "role", label: "Role", type: "text", placeholder: "e.g. Stagehand", required: true },
      { id: "rate", label: "Rate", type: "text", placeholder: "$/hr", half: true },
      { id: "when", label: "Date", type: "date", half: true },
      { id: "loc", label: "Location", type: "text", placeholder: "Venue / area" },
      { id: "desc", label: "Description", type: "textarea", required: true },
    ],
  },
  listing: {
    title: "New Listing", icon: "Tag", submit: "Post Listing",
    fields: [
      { id: "item", label: "Item", type: "text", placeholder: "What are you selling?", required: true },
      { id: "price", label: "Price", type: "text", placeholder: "$", half: true },
      { id: "cond", label: "Condition", type: "select", half: true, options: ["New", "Like new", "Used", "For parts"] },
      { id: "photo", label: "Photos", type: "photo" },
      { id: "desc", label: "Description", type: "textarea" },
    ],
  },
  post: {
    title: "New Post", icon: "PenSquare", submit: "Post",
    fields: [
      { id: "channel", label: "Channel", type: "select", options: ["Crew feed", "Gate & Access", "Stage L"], default: "Crew feed" },
      { id: "body", label: "Message", type: "textarea", placeholder: "Share with the crew…", required: true },
      { id: "photo", label: "Attach Photos", type: "photo" },
    ],
  },
};
