/**
 * Best-effort parse of strings like:
 * "06:00 AM - 06:00 PM", "09:00 AM - 09:00 PM", "04:00 PM - 04:00 AM"
 */
function parseTimeToken(token) {
  if (!token) return null;
  const m = String(token)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (!ap && h > 23) return null;
  return h * 60 + min;
}

export function parseOpeningHours(hoursStr) {
  if (!hoursStr || typeof hoursStr !== 'string') return null;
  const parts = hoursStr.split('-').map((s) => s.trim());
  if (parts.length < 2) return null;
  const open = parseTimeToken(parts[0]);
  const close = parseTimeToken(parts[1]);
  if (open == null || close == null) return null;
  return { open, close, overnight: close <= open };
}

export function isOpenNow(hoursStr, now = new Date()) {
  const parsed = parseOpeningHours(hoursStr);
  if (!parsed) return null; // unknown
  const mins = now.getHours() * 60 + now.getMinutes();
  if (parsed.overnight) {
    return mins >= parsed.open || mins < parsed.close;
  }
  return mins >= parsed.open && mins < parsed.close;
}

export function openStatusLabel(hoursStr, now = new Date()) {
  const status = isOpenNow(hoursStr, now);
  if (status === true) return 'Open now';
  if (status === false) return 'Closed';
  return null;
}
