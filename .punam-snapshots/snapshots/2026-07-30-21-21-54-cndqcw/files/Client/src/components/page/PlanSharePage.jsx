import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  MapPin,
  Share2,
  Sparkles,
  ArrowRight,
  Coffee,
  Music2,
} from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { PlanSharePageStyles as styles } from '@styles';

/**
 * Shareable "Plan my night" view.
 * Reads from local plan state; share copies current URL + encoded snapshot.
 */
export function PlanSharePage() {
  const { recentPlaces = [], interestedEvents = [], favorites = [], pushToast } =
    useApp();
  const [params] = useSearchParams();

  let shared = null;
  try {
    const raw = params.get('p');
    if (raw) shared = JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    shared = null;
  }

  const places = shared?.places || recentPlaces.slice(0, 4);
  const events = shared?.events || interestedEvents.slice(0, 4);

  const handleShare = async () => {
    const payload = {
      places: recentPlaces.slice(0, 4),
      events: interestedEvents.slice(0, 4),
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
        <p className={styles.Eyebrow}>
          <Sparkles size={14} /> Night planner
        </p>
        <h1 className={styles.Title}>Tonight’s plan</h1>
        <p className={styles.Sub}>
          Line up places and events, then share one link with the group — matatu-friendly,
          budget-aware.
        </p>
        <div className={styles.HeaderRow}>
          <button type="button" className={styles.ShareBtn} onClick={handleShare}>
            <Share2 size={16} /> Share plan link
          </button>
          <span className={styles.CountBadge}>
            {places.length + events.length} stops
          </span>
        </div>
      </header>

      {empty && (
        <div className={styles.Empty}>
          <div className={styles.EmptyIcon}>
            <Sparkles size={22} />
          </div>
          <p className={styles.EmptyTitle}>Your plan is empty</p>
          <p>
            Save places and mark events as interested — they’ll show up here so you can share
            the night.
          </p>
          <div className={styles.EmptyActions}>
            <Link to="/explore?category=eats" className={styles.Cta}>
              <Coffee size={15} /> Find eats
            </Link>
            <Link to="/events" className={styles.CtaGhost}>
              <Music2 size={15} /> Browse events
            </Link>
          </div>
        </div>
      )}

      {places.length > 0 && (
        <section className={styles.Section}>
          <div className={styles.SectionHead}>
            <h2>Places</h2>
            <Link to="/explore" className={styles.SectionLink}>
              Add more <ArrowRight size={14} />
            </Link>
          </div>
          <ol className={styles.Timeline}>
            {places.map((p, i) => (
              <li key={p.id || i} className={styles.TimelineItem}>
                <span className={styles.Step}>{i + 1}</span>
                <Link to={`/place/${p.id}`} className={styles.TimelineLink}>
                  <MapPin size={16} />
                  <span>
                    <strong>{p.title}</strong>
                    <small>{p.location}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {events.length > 0 && (
        <section className={styles.Section}>
          <div className={styles.SectionHead}>
            <h2>Events</h2>
            <Link to="/events" className={styles.SectionLink}>
              More events <ArrowRight size={14} />
            </Link>
          </div>
          <ol className={styles.Timeline}>
            {events.map((e, i) => (
              <li key={e.id || i} className={styles.TimelineItem}>
                <span className={styles.Step}>{i + 1}</span>
                <Link to={`/event/${e.id}`} className={styles.TimelineLink}>
                  <CalendarDays size={16} />
                  <span>
                    <strong>{e.title}</strong>
                    <small>
                      {[e.location, e.time].filter(Boolean).join(' · ')}
                    </small>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!empty && (
        <section className={styles.Tips}>
          <h2>Before you go</h2>
          <ul>
            <li>Confirm M-Pesa / cover charges on each stop.</li>
            <li>Check matatu stages on place pages for the ride home.</li>
            <li>
              {favorites.length
                ? `You have ${favorites.length} saved spots if plans change.`
                : 'Heart a backup spot in case the weather shifts.'}
            </li>
          </ul>
        </section>
      )}
    </main>
  );
}
