type PartStat = "ACCEPTED" | "DECLINED" | "TENTATIVE";

interface BuildIcsReplyOptions {
  uid: string;
  sequence: number;
  dtStart: string;
  dtEnd: string;
  organizerEmail: string;
  organizerName?: string;
  attendeeEmail: string;
  attendeeName?: string;
  partstat: PartStat;
  summary: string;
  description?: string;
  location?: string;
  tzid?: string;
  prodId?: string;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

function foldIcsLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) return line;

  const chunks: string[] = [];
  let rest = line;

  chunks.push(rest.slice(0, maxLen));
  rest = rest.slice(maxLen);

  while (rest.length > 0) {
    chunks.push(" " + rest.slice(0, maxLen - 1));
    rest = rest.slice(maxLen - 1);
  }

  return chunks.join("\r\n");
}

function currentDtStamp(): string {
  return (
    new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z"
  );
}

function buildIcsReplyContent(opts: BuildIcsReplyOptions): string {
  const {
    uid,
    sequence,
    dtStart,
    dtEnd,
    organizerEmail,
    organizerName,
    attendeeEmail,
    attendeeName,
    partstat,
    summary,
    description,
    location,
    tzid,
    prodId = "-//YourApp//EN",
  } = opts;

  const dtStampField = `DTSTAMP:${currentDtStamp()}`;

  const dtStartField = tzid
    ? `DTSTART;TZID=${tzid}:${dtStart}`
    : `DTSTART:${dtStart}`;

  const dtEndField = tzid
    ? `DTEND;TZID=${tzid}:${dtEnd}`
    : `DTEND:${dtEnd}`;

  const organizerField = organizerName
    ? `ORGANIZER;CN=${escapeIcsText(organizerName)}:mailto:${organizerEmail}`
    : `ORGANIZER:mailto:${organizerEmail}`;

  const attendeeField = attendeeName
    ? `ATTENDEE;PARTSTAT=${partstat};CN=${escapeIcsText(attendeeName)};ROLE=REQ-PARTICIPANT:mailto:${attendeeEmail}`
    : `ATTENDEE;PARTSTAT=${partstat};ROLE=REQ-PARTICIPANT:mailto:${attendeeEmail}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    `PRODID:${prodId}`,
    "VERSION:2.0",
    "METHOD:REPLY",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SEQUENCE:${sequence}`,
    dtStampField,
    dtStartField,
    dtEndField,
    organizerField,
    attendeeField,
    `SUMMARY:${escapeIcsText(summary)}`,
  ];

  if (location) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }

  if (description) {
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldIcsLine).join("\r\n");
}
