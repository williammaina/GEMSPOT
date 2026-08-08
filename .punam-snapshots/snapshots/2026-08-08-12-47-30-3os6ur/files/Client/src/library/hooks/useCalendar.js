/**
 * Calendar helpers — Google Calendar (web) + Apple / Outlook (.ics download).
 */
function parseLooseDate(eventDetails = {}) {
  const {
    startDate,
    start_date,
    endDate,
    end_date,
    date,
    day,
    month,
    year,
    time,
  } = eventDetails;

  if (startDate || start_date) {
    const d = new Date(startDate || start_date);
    if (!Number.isNaN(d.getTime())) {
      const endRaw = endDate || end_date;
      const end = endRaw ? new Date(endRaw) : new Date(d.getTime() + 2 * 60 * 60 * 1000);
      return {
        start: d,
        end: Number.isNaN(end.getTime()) ? new Date(d.getTime() + 2 * 60 * 60 * 1000) : end,
      };
    }
  }

  let base = null;
  if (date) {
    const tryDate = new Date(date);
    if (!Number.isNaN(tryDate.getTime())) base = tryDate;
  }
  if (!base && day && month) {
    const y = year || new Date().getFullYear();
    base = new Date(`${month} ${day}, ${y}`);
  }
  if (!base || Number.isNaN(base.getTime())) {
    base = new Date();
    base.setDate(base.getDate() + 1);
    base.setHours(18, 0, 0, 0);
  }

  if (time && typeof time === 'string') {
    const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const ap = (m[3] || '').toUpperCase();
      if (ap === 'PM' && h < 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      base.setHours(h, min, 0, 0);
    }
  }

  return { start: base, end: new Date(base.getTime() + 2 * 60 * 60 * 1000) };
}

function toUtcStamp(date) {
  // YYYYMMDDTHHMMSSZ
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcs(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function foldLine(line) {
  // ICS lines should be <= 75 octets; simple fold for long DESCRIPTION
  if (line.length <= 74) return line;
  const parts = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length) {
    parts.push(' ' + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join('\r\n');
}

export function useCalendar() {
  const buildEventTimes = (eventDetails) => parseLooseDate(eventDetails);

  /** Open Google Calendar create-event in a new tab */
  const syncEvent = (eventDetails) => {
    if (!eventDetails || typeof window === 'undefined') return false;

    const title = eventDetails.title || eventDetails.name || 'GemSpot KE event';
    const location = eventDetails.location || eventDetails.venue_name || '';
    const description = [
      eventDetails.description || '',
      location ? `Venue: ${location}` : '',
      eventDetails.price != null || eventDetails.ticket_price != null
        ? `Tickets: ${eventDetails.price ?? eventDetails.ticket_price}`
        : '',
      'Shared via GemSpot KE',
    ]
      .filter(Boolean)
      .join('\n');

    const { start, end } = parseLooseDate(eventDetails);
    const dates = `${toUtcStamp(start)}/${toUtcStamp(end)}`;

    const url =
      'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${encodeURIComponent(dates)}` +
      `&details=${encodeURIComponent(description)}` +
      `&location=${encodeURIComponent(location)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  };

  /**
   * Download a standards-compliant .ics file for Apple Calendar, Outlook,
   * Outlook.com, Thunderbird, etc.
   */
  const downloadIcs = (eventDetails) => {
    if (!eventDetails || typeof window === 'undefined') return false;

    const title = eventDetails.title || eventDetails.name || 'GemSpot KE event';
    const location = eventDetails.location || eventDetails.venue_name || '';
    const description = [
      eventDetails.description || '',
      location ? `Venue: ${location}` : '',
      eventDetails.host_name || eventDetails.host?.name
        ? `Hosted by: ${eventDetails.host_name || eventDetails.host?.name}`
        : '',
      'Shared via GemSpot KE — https://gemspot.ke',
    ]
      .filter(Boolean)
      .join('\\n');

    const { start, end } = parseLooseDate(eventDetails);
    const uid = `gemspot-${eventDetails.id || eventDetails.event_id || Date.now()}@gemspot.ke`;
    const stamp = toUtcStamp(new Date());

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GemSpot KE//Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toUtcStamp(start)}`,
      `DTEND:${toUtcStamp(end)}`,
      foldLine(`SUMMARY:${escapeIcs(title)}`),
      foldLine(`DESCRIPTION:${escapeIcs(description.replace(/\\n/g, '\n'))}`),
      foldLine(`LOCATION:${escapeIcs(location)}`),
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    const blob = new Blob([lines.join('\r\n')], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'gemspot-event'}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  };

  /** Outlook web compose (optional third option) */
  const openOutlookWeb = (eventDetails) => {
    if (!eventDetails || typeof window === 'undefined') return false;
    const title = eventDetails.title || eventDetails.name || 'GemSpot KE event';
    const location = eventDetails.location || eventDetails.venue_name || '';
    const { start, end } = parseLooseDate(eventDetails);
    // Outlook deep link uses ISO-ish path
    const url =
      'https://outlook.live.com/calendar/0/deeplink/compose?' +
      `subject=${encodeURIComponent(title)}` +
      `&startdt=${encodeURIComponent(start.toISOString())}` +
      `&enddt=${encodeURIComponent(end.toISOString())}` +
      `&location=${encodeURIComponent(location)}` +
      `&body=${encodeURIComponent(eventDetails.description || 'GemSpot KE event')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  };

  return {
    syncEvent,
    downloadIcs,
    openOutlookWeb,
    buildEventTimes,
  };
}
