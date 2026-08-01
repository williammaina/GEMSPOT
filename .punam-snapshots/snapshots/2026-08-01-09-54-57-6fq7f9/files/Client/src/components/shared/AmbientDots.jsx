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
    </div>
  );
}
