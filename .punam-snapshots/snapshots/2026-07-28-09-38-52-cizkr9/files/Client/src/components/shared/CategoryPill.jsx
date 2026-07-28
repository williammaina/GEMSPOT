import clsx from 'clsx';
import { CategoryPillStyles as styles } from '@styles';

export function CategoryPill({
  label,
  emoji,
  isActive = false,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      className={clsx(styles.Pill, isActive && styles.PillActive)}
    >
      <span>{label}</span>
      {emoji ? <span aria-hidden="true">{emoji}</span> : null}
    </button>
  );
}