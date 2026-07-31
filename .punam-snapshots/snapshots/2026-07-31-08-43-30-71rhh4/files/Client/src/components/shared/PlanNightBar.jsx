import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Sparkles, X } from 'lucide-react';
import { PlanNightBarStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

/**
 * World-class "Plan my night" tray:
 * shows last viewed place + interested event, with quick links.
 */
export function PlanNightBar() {
  const { recentPlaces = [], interestedEvents = [], clearPlan } = useApp();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const place = recentPlaces[0];
  const event = interestedEvents[0];

  if (!open || (!place && !event)) return null;

  return (
    <aside className={styles.Bar} aria-label="Plan my night">
      <div className={styles.Head}>
        <span className={styles.Label}>
          <Sparkles size={14} /> Plan my night
        </span>
        <button type="button" className={styles.Close} onClick={() => setOpen(false)} aria-label="Hide">
          <X size={14} />
        </button>
      </div>

      <div className={styles.Items}>
        {place && (
          <Link to={`/place/${place.id}`} className={styles.Item}>
            <MapPin size={14} />
            <span>
              <strong>{place.title}</strong>
              <small>{place.location || 'Place'}</small>
            </span>
          </Link>
        )}
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
        {(place || event) && (
          <button type="button" className={styles.Clear} onClick={() => clearPlan?.()}>
            Clear
          </button>
        )}
      </div>
    </aside>
  );
}
