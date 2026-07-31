import { SkeletonStyles as styles } from '@styles';

export function Skeleton({ height = 16, width = '100%', radius = 10, className = '' }) {
  return (
    <div
      className={`${styles.Block} ${className}`}
      style={{ height, width, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function PlaceCardSkeleton() {
  return (
    <div className={styles.Card}>
      <Skeleton height={140} radius={16} />
      <div className={styles.CardBody}>
        <Skeleton height={18} width="70%" />
        <Skeleton height={14} width="50%" />
        <Skeleton height={14} width="40%" />
      </div>
    </div>
  );
}
