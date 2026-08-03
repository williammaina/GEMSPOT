import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Sparkles, X, Trash2 } from 'lucide-react';
import { PlanNightBarStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

const DISMISS_KEY = 'gemspot-plan-bar-dismissed';

/**
 * Floating tray for an active plan only — not for empty/recent-only noise.
 */
export function PlanNightBar() {
  const {
    planStops = [],
    interestedEvents = [],
    removeFromPlan,
    clearPlan,
  } = useApp();

  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(DISMISS_KEY) !== '1';
  });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Re-open when user adds a stop after dismissing
  useEffect(() => {
    if (planStops.length > 0 && sessionStorage.getItem(DISMISS_KEY) !== '1') {
      setOpen(true);
    }
  }, [planStops.length]);

  const handleDismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  // Only show for explicit plan content — never recent-only filler
  if (!open || (planStops.length === 0 && interestedEvents.length === 0)) return null;

  return (
    <aside className={styles.Bar} aria-label="Your plan">
      <div className={styles.Head}>
        <span className={styles.Label}>
          <Sparkles size={14} /> Your plan
          {planStops.length > 0 ? ` · ${planStops.length}` : ''}
        </span>
        <button type="button" className={styles.Close} onClick={handleDismiss} aria-label="Hide">
          <X size={14} />
        </button>
      </div>

      <div className={styles.Items}>
        {planStops.slice(0, 3).map((place) => (
          <div key={place.id} className={styles.ItemRow}>
            <Link to={`/place/${place.id}`} className={styles.Item}>
              <MapPin size={14} />
              <span>
                <strong>{place.title}</strong>
                <small>
                  {[place.category, place.location].filter(Boolean).join(' · ') || 'Place'}
                </small>
              </span>
            </Link>
            <button
              type="button"
              className={styles.Remove}
              aria-label={`Remove ${place.title}`}
              onClick={() => removeFromPlan?.(place.id)}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {interestedEvents[0] && (
          <Link to={`/event/${interestedEvents[0].id}`} className={styles.Item}>
            <CalendarDays size={14} />
            <span>
              <strong>{interestedEvents[0].title}</strong>
              <small>{interestedEvents[0].location || 'Event'}</small>
            </span>
          </Link>
        )}
      </div>

      <div className={styles.Actions}>
        <Link to="/saved?tab=plan" className={styles.OpenPlan} onClick={() => {
          try { sessionStorage.removeItem(DISMISS_KEY); } catch { /* */ }
        }}>
          Open my list
        </Link>
        <button type="button" className={styles.Clear} onClick={() => clearPlan?.()}>
          Clear
        </button>
      </div>
    </aside>
  );
}
