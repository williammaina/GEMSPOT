import { CalendarPlus } from 'lucide-react';
import { CalendarButtonStyles as styles } from '@styles';

export function CalendarButton({ onClick, disabled = false, label = 'Add to Google Calendar' }) {
  return (
    <button
      type="button"
      className={styles.SyncButton}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <CalendarPlus size={18} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}