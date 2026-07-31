import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  MapPin,
  Share2,
  Ticket,
  Users,
} from 'lucide-react';
import { EventDetailPageStyles as styles } from '@styles';
import { getEventById, useCalendar } from '@library';
import { useApp } from '../../library/contexts/AppContext.js';
import { SafeImage } from '../shared/SafeImage.jsx';

export function EventDetailPage() {
  const { id } = useParams();
  const { syncEvent, downloadIcs } = useCalendar();
  const { pushToast, toggleInterestedEvent, isInterestedEvent } = useApp();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEventById(id)
      .then((result) => {
        if (!cancelled) {
          setEvent(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEvent(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title, url });
        return;
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied');
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <main className={styles.Page}>
        <p className={styles.Muted}>Loading event…</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className={styles.Page}>
        <Link to="/events" className={styles.Back}>
          <ArrowLeft size={16} /> Back to events
        </Link>
        <h1 className={styles.Title}>Event not found</h1>
        <p className={styles.Muted}>
          This event may have been removed or the link is outdated.
        </p>
        <Link to="/events" className={styles.PrimaryBtn}>
          Browse events
        </Link>
      </main>
    );
  }

  const when = [event.weekday, event.day, event.month, event.time].filter(Boolean).join(' · ');

  return (
    <main className={styles.Page}>
      <Link to="/events" className={styles.Back}>
        <ArrowLeft size={16} /> All events
      </Link>

      <div className={styles.Hero}>
        <div className={styles.Media}>
          <SafeImage src={event.image} alt="" className={styles.Image} />
          {event.category && <span className={styles.Cat}>{event.category}</span>}
        </div>

        <div className={styles.Body}>
          {when && <p className={styles.When}>{when}</p>}
          <h1 className={styles.Title}>{event.title}</h1>

          <div className={styles.Meta}>
            {event.location && (
              <span>
                <MapPin size={15} /> {event.location}
              </span>
            )}
            {event.time && (
              <span>
                <Clock size={15} /> {event.time}
              </span>
            )}
            {event.price && (
              <span>
                <Ticket size={15} /> {event.price}
              </span>
            )}
          </div>

          <div className={styles.Actions}>
            <button
              type="button"
              className={styles.PrimaryBtn}
              onClick={() => {
                const ok = syncEvent(event);
                if (ok !== false) pushToast?.('Opening Google Calendar…', 'success');
              }}
            >
              <CalendarPlus size={16} /> Google Calendar
            </button>
            <button
              type="button"
              className={styles.SecondaryBtn}
              onClick={() => {
                downloadIcs?.(event);
                pushToast?.('Calendar file downloaded', 'success');
              }}
            >
              Apple / Outlook (.ics)
            </button>
            <button
              type="button"
              className={isInterestedEvent?.(event.id) ? styles.SecondaryOn : styles.SecondaryBtn}
              onClick={() => toggleInterestedEvent?.(event)}
            >
              <Users size={16} />{' '}
              {isInterestedEvent?.(event.id) ? 'Interested' : "I'm interested"}
            </button>
            <button type="button" className={styles.IconBtn} onClick={handleShare} aria-label="Share">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <section className={styles.Section}>
        <h2 className={styles.SectionTitle}>About</h2>
        <p className={styles.Description}>
          {event.description || 'No description provided for this event yet.'}
        </p>
      </section>

      <section className={styles.Section}>
        <h2 className={styles.SectionTitle}>Details</h2>
        <dl className={styles.Details}>
          <div>
            <dt>Status</dt>
            <dd>{event.status || 'Upcoming'}</dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{event.location || 'TBA'}</dd>
          </div>
          <div>
            <dt>Tickets</dt>
            <dd>{event.price || 'See organizer'}</dd>
          </div>
          {event.startDate && (
            <div>
              <dt>Starts</dt>
              <dd>{new Date(event.startDate).toLocaleString()}</dd>
            </div>
          )}
          {event.endDate && (
            <div>
              <dt>Ends</dt>
              <dd>{new Date(event.endDate).toLocaleString()}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className={styles.Cta}>
        <p>Want nearby places for before or after?</p>
        <Link to="/explore" className={styles.PrimaryBtn}>
          Explore places nearby
        </Link>
      </section>
    </main>
  );
}
