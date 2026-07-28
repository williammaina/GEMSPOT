// Formats numbers to match the Kenyan standard seen in the UI (e.g., 1,200/-)
export function formatKES(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return 'Free';
  }

  const numericAmount =
    typeof amount === 'number'
      ? amount
      : Number(String(amount).replace(/[^0-9.-]/g, ''));

  if (!Number.isFinite(numericAmount)) {
    return String(amount);
  }

  if (numericAmount === 0) {
    return 'Free';
  }

  return `${numericAmount.toLocaleString('en-KE')}/-`;
}
