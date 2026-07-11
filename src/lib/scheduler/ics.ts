/**
 * Minimal RFC 5545 ICS builder for scheduler booking emails (kit 27).
 * Pure module — the booking confirmation attaches the result via the
 * email sender's `attachments` payload.
 */

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function icsStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildIcs(input: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  organizerEmail?: string;
  organizerName?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  url?: string;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ATLVS//Scheduler//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${icsEscape(input.uid)}`,
    `DTSTAMP:${icsStamp(new Date(input.start))}`,
    `DTSTART:${icsStamp(input.start)}`,
    `DTEND:${icsStamp(input.end)}`,
    `SUMMARY:${icsEscape(input.summary)}`,
  ];
  if (input.description) lines.push(`DESCRIPTION:${icsEscape(input.description)}`);
  if (input.location) lines.push(`LOCATION:${icsEscape(input.location)}`);
  if (input.url) lines.push(`URL:${icsEscape(input.url)}`);
  if (input.organizerEmail) {
    lines.push(`ORGANIZER;CN=${icsEscape(input.organizerName ?? input.organizerEmail)}:mailto:${input.organizerEmail}`);
  }
  if (input.attendeeEmail) {
    lines.push(
      `ATTENDEE;CN=${icsEscape(input.attendeeName ?? input.attendeeEmail)};RSVP=TRUE:mailto:${input.attendeeEmail}`,
    );
  }
  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
