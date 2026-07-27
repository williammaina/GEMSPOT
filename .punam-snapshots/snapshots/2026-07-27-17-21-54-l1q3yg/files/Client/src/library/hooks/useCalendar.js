function toIsoCalendarDate(value) {
  if (!value) return null;

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function offsetDate(baseDate, minutes = 120) {
  const clone = new Date(baseDate.getTime());
  clone.setMinutes(clone.getMinutes() + minutes);
  return clone;
}

export function useCalendar() {
  const syncEvent = (eventDetails) => {
    if (!eventDetails || typeof window === 'undefined') return;

    const {
      title = 'GemSpot KE event',
      location = '',
      description = '',
      startDate,
      endDate,
      date,
      time,
    } = eventDetails;

    const detailsBody = [description, location ? `Venue: ${location}` : null, time ? `Time: ${time}` : null]
      .filter(Boolean)
      .join('\n');

    const text = encodeURIComponent(title);
    const details = encodeURIComponent(detailsBody || `Join us at ${location}`);
    const loc = encodeURIComponent(location);

    const start = toIsoCalendarDate(startDate || date);
    const end = toIsoCalendarDate(endDate);
    const dates = start
      ? `${start}/${end || toIsoCalendarDate(offsetDate(new Date(startDate || date || Date.now())))}`
      : '';

    const googleCalUrl = [
      'https://calendar.google.com/calendar/render?action=TEMPLATE',
      `text=${text}`,
      `details=${details}`,
      `location=${loc}`,
      dates ? `dates=${encodeURIComponent(dates)}` : '',
    ]
      .filter(Boolean)
      .join('&');

    window.open(googleCalUrl, '_blank', 'noopener,noreferrer');
  };

  return { syncEvent };
}
