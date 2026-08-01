/**
 * Google Calendar + Apple/Outlook-friendly .ics download
 */

function parseLooseDate(eventDetails) {
  const { startDate, endDate, date, time, day, month, year } = eventDetails || {};

  if (startDate) {
    const d = new Date(startDate);
    if (!Number.isNaN(d.getTime())) {
      const end = endDate ? new Date(endDate) : new Date(d.getTime() + 2 * 60 * 60 * 1000);
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

function toGCalStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function toIcsStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcs(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function useCalendar() {
  const buildEventTimes = (eventDetails) => parseLooseDate(eventDetails);

  const syncEvent = (eventDetails) => {
    if (!eventDetails || typeof window === 'undefined') return false;

    const title = eventDetails.title || eventDetails.name || 'GemSpot KE event';
    const location = eventDetails.location || eventDetails.venue_name || '';
    const description = [
      eventDetails.description || '',
      location ? `Venue: ${location}` : '',
      eventDetails.price ? `Tickets: ${eventDetails.price}` : '',
      'Shared via GemSpot KE',
    ]
      .filter(Boolean)
      .join('\n');

    const { start, end } = buildEventTimes(eventDetails);
    const dates = `${toGCalStamp(start)}/${toGCalStamp(end)}`;

    const url =
      'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      `&text=${encodeURIComponent(title)}` +
      `&details=${encodeURIComponent(description)}` +
      `&location=${encodeURIComponent(location)}` +
      `&dates=${encodeURIComponent(dates)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  };

  /** Download .ics for Apple Calendar / Outlook */
  const downloadIcs = (eventDetails) => {
    if (!eventDetails || typeof window === 'undefined') return false;

    const title = eventDetails.title || eventDetails.name || 'GemSpot KE event';
    const location = eventDetails.location || eventDetails.venue_name || '';
    const description = eventDetails.description || 'Shared via GemSpot KE';
    const { start, end } = buildEventTimes(eventDetails);

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GemSpot KE//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:gemspot-${eventDetails.id || Date.now()}@gemspot.ke`,
      `DTSTAMP:${toIcsStamp(new Date())}`,
      `DTSTART:${toIcsStamp(start)}`,
      `DTEND:${toIcsStamp(end)}`,
      `SUMMARY:${escapeIcs(title)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `LOCATION:${escapeIcs(location)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${String(title).slice(0, 40).replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    return true;
  };

  return { syncEvent, downloadIcs };
}
