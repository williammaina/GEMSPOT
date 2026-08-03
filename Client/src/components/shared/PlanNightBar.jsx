import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Sparkles, X, Trash2 } from 'lucide-react';
import { PlanNightBarStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

const DISMISS_KEY = 'gemspot-plan-bar-dismissed';

export function PlanNightBar() {
  const { planStops = [], removeFromPlan, clearPlan } = useApp();
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

  if (!open || planStops.length === 0) return null;

  return (
    <aside className={styles.Bar} aria-label="Your plan">
      <div className={styles.Head}>
        <span className={styles.Label}>
          <Sparkles size={14} /> Your plan · {planStops.length}
        </span>
        <button type="button" className={styles.Close} onClick={handleDismiss} aria-label="Hide">
          <X size={14} />
        </button>
      </div>

      <div className={styles.Items}>
        {planStops.slice(0, 3).map((item) => {
          const isEvent = item.type === 'event';
          const href = isEvent ? `/event/${item.id}` : `/place/${item.id}`;
          return (
            <div key={`${item.type || 'place'}-${item.id}`} className={styles.ItemRow}>
              <Link to={href} className={styles.Item}>
                {isEvent ? <CalendarDays size={14} /> : <MapPin size={14} />}
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {[isEvent ? 'Event' : item.category, item.location]
                      .filter(Boolean)
                      .join(' · ') || (isEvent ? 'Event' : 'Place')}
                  </small>
                </span>
              </Link>
              <button
                type="button"
                className={styles.Remove}
                aria-label={`Remove ${item.title}`}
                onClick={() => removeFromPlan?.(item.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.Actions}>
        <Link
          to="/saved?tab=plan"
          className={styles.OpenPlan}
          onClick={() => {
            try {
              sessionStorage.removeItem(DISMISS_KEY);
            } catch {
              /* */
            }
          }}
        >
          Open my list
        </Link>
        <button type="button" className={styles.Clear} onClick={() => clearPlan?.()}>
          Clear
        </button>
      </div>
    </aside>
  );
}
