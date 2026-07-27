// Formats numbers to match the Kenyan standard seen in the UI (e.g., 1,200/-)
export function formatKES(amount) {
  if (!amount) return 'Free';
  return `${amount.toLocaleString('en-KE')}/-`;
}