import { AmbientDotsStyles as styles } from '@styles';

/**
 * Soft live particle field (Luma-style) — CSS-only, no canvas cost.
 */
export function AmbientDots({ tone = 'emerald' }) {
  return (
    <div className={styles.Field} data-tone={tone} aria-hidden="true">
      <div className={styles.LayerA} />
      <div className={styles.LayerB} />
      <div className={styles.LayerC} />
      <div className={styles.Glow} />
      <div className={styles.Orb1} />
      <div className={styles.Orb2} />
      <div className={styles.Orb3} />
      <div className={styles.Aurora} />
      <div className={styles.Streak1} />
      <div className={styles.Streak2} />
      <span className={styles.Spark} data-i="0" />
      <span className={styles.Spark} data-i="1" />
      <span className={styles.Spark} data-i="2" />
      <span className={styles.Spark} data-i="3" />
      <span className={styles.Spark} data-i="4" />
      <span className={styles.Spark} data-i="5" />
    </div>
  );
}
