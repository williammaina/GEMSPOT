import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  Share2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { PlanSharePageStyles as styles } from '@styles';

export function PlanSharePage() {
  const {
    planStops = [],
    interestedEvents = [],
    removeFromPlan,
    toggleInterestedEvent,
    pushToast,
  } = useApp();

  const places = planStops;
  const events = interestedEvents;

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My GemSpot plan',
          text: 'Check out the places I’m planning on GemSpot KE',
          url,
        });
        pushToast?.('Shared', 'success');
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(url);
      pushToast?.('Plan link copied', 'success');
    } catch {
      pushToast?.('Could not share plan', 'error');
    }
  };

  const empty = places.length === 0 && events.length === 0;

  return (
    <main className={styles.Page}>
      <header className={styles.Header}>
        <h1 className={styles.Title}>Your plan</h1>
        <p className={styles.Sub}>
          Places and events you’re lining up — open any stop or remove it.
        </p>
        {!empty && (
          <button type="button" className={styles.ShareBtn} onClick={handleShare}>
            <Share2 size={16} /> Share plan link
          </button>
        )}
      </header>

      {empty && (
        <div className={styles.Empty}>
          <p>Nothing in your plan yet. Add a place from Explore or Today’s pick.</p>
          <div className={styles.EmptyLinks}>
            <Link to="/explore">Explore places</Link>
            <Link to="/events">Browse events</Link>
          </div>
        </div>
      )}

      {places.length > 0 && (
        <section className={styles.Section}>
          <h2>Places ({places.length})</h2>
          <ul className={styles.List}>
            {places.map((p) => (
              <li key={p.id} className={styles.Row}>
                <Link to={`/place/${p.id}`} className={styles.RowMain}>
                  {p.image ? (
                    <img src={p.image} alt="" className={styles.Thumb} loading="lazy" />
                  ) : (
                    <span className={styles.ThumbPlaceholder}>
                      <MapPin size={16} />
                    </span>
                  )}
                  <span className={styles.Meta}>
                    <strong>{p.title || p.name}</strong>
                    <small>{p.location || p.town || p.category || 'Place'}</small>
                  </span>
                </Link>
                <div className={styles.RowActions}>
                  <Link
                    to={`/place/${p.id}`}
                    className={styles.ViewBtn}
                    title="View place"
                  >
                    <ExternalLink size={15} /> View
                  </Link>
                  <button
                    type="button"
                    className={styles.RemoveBtn}
                    onClick={() => removeFromPlan?.(p.id)}
                    title="Remove from plan"
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {events.length > 0 && (
        <section className={styles.Section}>
          <h2>Events ({events.length})</h2>
          <ul className={styles.List}>
            {events.map((e) => (
              <li key={e.id} className={styles.Row}>
                <Link to={`/event/${e.id}`} className={styles.RowMain}>
                  <span className={styles.ThumbPlaceholder}>
                    <CalendarDays size={16} />
                  </span>
                  <span className={styles.Meta}>
                    <strong>{e.title}</strong>
                    <small>{e.location || 'Event'}</small>
                  </span>
                </Link>
                <div className={styles.RowActions}>
                  <Link to={`/event/${e.id}`} className={styles.ViewBtn} title="View event">
                    <ExternalLink size={15} /> View
                  </Link>
                  <button
                    type="button"
                    className={styles.RemoveBtn}
                    onClick={() => {
                      toggleInterestedEvent?.(e);
                      pushToast?.('Removed interest', 'info');
                    }}
                    title="Remove"
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
