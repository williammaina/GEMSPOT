import { CalendarPlus } from 'lucide-react';
import { CalendarButtonStyles as styles } from '@styles';

export function CalendarButton({ onClick }) {
  return (
    <button className={styles.SyncButton} onClick={onClick}>
      <CalendarPlus size={18} />
      Add to Google Calendar
    </button>
  );
}