import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, MapPin, Share2 } from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { PlanSharePageStyles as styles } from '@styles';

/**
 * Shareable "Plan my night" view.
 * Reads from local plan state; share copies current URL + encoded snapshot.
 */
export function PlanSharePage() {
  const { recentPlaces = [], interestedEvents = [], pushToast } = useApp();
  const [params] = useSearchParams();

  // Optional encoded snapshot from shared link
  let shared = null;
  try {
    const raw = params.get('p');
    if (raw) shared = JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    shared = null;
  }

  const places = shared?.places || recentPlaces.slice(0, 3);
  const events = shared?.events || interestedEvents.slice(0, 3);

  const handleShare = async () => {
    const payload = {
      places: recentPlaces.slice(0, 3),
      events: interestedEvents.slice(0, 3),
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = `${window.location.origin}/plan?p=${encoded}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My GemSpot night plan', url });
      } else {
        await navigator.clipboard.writeText(url);
        pushToast?.('Plan link copied', 'success');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        pushToast?.('Plan link copied', 'success');
      } catch {
        pushToast?.('Could not share plan', 'error');
      }
    }
  };

  const empty = places.length === 0 && events.length === 0;

  return (
    <main className={styles.Page}>
      <header className={styles.Header}>
        <h1 className={styles.Title}>Tonight’s plan</h1>
        <p className={styles.Sub}>Places and events you’re lining up — share with friends.</p>
        <button type="button" className={styles.ShareBtn} onClick={handleShare}>
          <Share2 size={16} /> Share plan link
        </button>
      </header>

      {empty && (
        <div className={styles.Empty}>
          <p>Save a place and mark an event as interested to build a plan.</p>
          <Link to="/explore">Explore places</Link>
          {' · '}
          <Link to="/events">Browse events</Link>
        </div>
      )}

      {places.length > 0 && (
        <section className={styles.Section}>
          <h2>Places</h2>
          <ul>
            {places.map((p) => (
              <li key={p.id}>
                <Link to={`/place/${p.id}`}>
                  <MapPin size={14} />
                  <span>
                    <strong>{p.title}</strong>
                    <small>{p.location}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {events.length > 0 && (
        <section className={styles.Section}>
          <h2>Events</h2>
          <ul>
            {events.map((e) => (
              <li key={e.id}>
                <Link to={`/event/${e.id}`}>
                  <CalendarDays size={14} />
                  <span>
                    <strong>{e.title}</strong>
                    <small>{e.location}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
