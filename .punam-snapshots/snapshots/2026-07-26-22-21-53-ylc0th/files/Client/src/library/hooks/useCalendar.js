export function useCalendar() {
  const syncEvent = (eventDetails) => {
    if (!eventDetails) return;

    // Constructs a Google Calendar Event URL
    const { title, date, location } = eventDetails;
    const text = encodeURIComponent(title);
    const details = encodeURIComponent(`Join us at ${location}`);
    const loc = encodeURIComponent(location);
    
    // In a real app, date parsing would be more robust to handle start/end times
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${loc}`;
    
    // Open in new tab
    window.open(googleCalUrl, '_blank');
  };

  return { syncEvent };
}