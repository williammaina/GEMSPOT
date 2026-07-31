import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Sparkles, X, Trash2 } from 'lucide-react';
import { PlanNightBarStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

/**
 * Floating tray for "Tonight's plan" — driven by planStops from
 * Tonight's pick + explicit Add to plan actions.
 */
export function PlanNightBar() {
  const {
    planStops = [],
    recentPlaces = [],
    interestedEvents = [],
    removeFromPlan,
    clearPlan,
  } = useApp();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prefer explicit plan stops; fall back to last viewed place
  const stops = planStops.length
    ? planStops
    : recentPlaces[0]
      ? [recentPlaces[0]]
      : [];
  const event = interestedEvents[0];

  if (!open || (stops.length === 0 && !event)) return null;

  return (
    <aside className={styles.Bar} aria-label="Tonight’s plan">
      <div className={styles.Head}>
        <span className={styles.Label}>
          <Sparkles size={14} /> Tonight’s plan
          {stops.length > 0 ? ` · ${stops.length}` : ''}
        </span>
        <button type="button" className={styles.Close} onClick={() => setOpen(false)} aria-label="Hide">
          <X size={14} />
        </button>
      </div>

      <div className={styles.Items}>
        {stops.map((place) => (
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
            {planStops.length > 0 && (
              <button
                type="button"
                className={styles.Remove}
                aria-label={`Remove ${place.title}`}
                onClick={() => removeFromPlan?.(place.id)}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        {event && (
          <Link to={`/event/${event.id}`} className={styles.Item}>
            <CalendarDays size={14} />
            <span>
              <strong>{event.title}</strong>
              <small>{event.location || 'Event'}</small>
            </span>
          </Link>
        )}
      </div>

      <div className={styles.Actions}>
        <Link to="/plan" className={styles.OpenPlan}>
          Open full plan
        </Link>
        {(stops.length > 0 || event) && (
          <button type="button" className={styles.Clear} onClick={() => clearPlan?.()}>
            Clear
          </button>
        )}
      </div>
    </aside>
  );
}
