import { CategoryPillStyles as styles } from '@styles';
import { clsx } from 'clsx'; // Utility for conditionally joining classNames

export function CategoryPill({ label, emoji, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={clsx(styles.Pill, isActive && styles.PillActive)}
    >
      <span>{label}</span>
      {emoji && <span>{emoji}</span>}
    </button>
  );
}