import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { getCrowdSnapshot } from '../../library/hooks/useCrowdLevel.js';
import styles from '../../styles/components/shared/CrowdBadge.module.css';

/**
 * Lightweight live crowd chip for place cards — refreshes every 30s.
 */
export function CrowdBadge({ placeId, category, compact = false }) {
  const [snap, setSnap] = useState(() => getCrowdSnapshot(placeId, category));

  useEffect(() => {
    setSnap(getCrowdSnapshot(placeId, category));
    const t = setInterval(() => setSnap(getCrowdSnapshot(placeId, category)), 30000);
    const onStorage = (e) => {
      if (e.key === 'gemspot-crowd-v2') setSnap(getCrowdSnapshot(placeId, category));
    };
    window.addEventListener('storage', onStorage);
    let bc;
    try {
      bc = new BroadcastChannel('gemspot-crowd');
      bc.onmessage = () => setSnap(getCrowdSnapshot(placeId, category));
    } catch {
      /* */
    }
    return () => {
      clearInterval(t);
      window.removeEventListener('storage', onStorage);
      try {
        bc?.close();
      } catch {
        /* */
      }
    };
  }, [placeId, category]);

  if (!snap) return null;

  return (
    <span
      className={`${styles.Badge} ${styles[snap.tone] || ''} ${compact ? styles.Compact : ''}`}
      title={
        snap.hasCommunity
          ? `${snap.reportsLast4h} community report${snap.reportsLast4h === 1 ? '' : 's'} in 4h`
          : 'Estimated from typical patterns for this hour'
      }
    >
      <Users size={compact ? 11 : 13} />
      <span>{snap.label}</span>
      {!compact && <span className={styles.Score}>{snap.score}%</span>}
      {snap.hasCommunity && <span className={styles.LiveDot} aria-hidden="true" />}
    </span>
  );
}
