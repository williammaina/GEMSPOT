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
  Flag,
  ExternalLink,
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
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      pushToast?.('Link copied', 'success');
    } catch {
      /* ignore */
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
        <p className={styles.Muted}>This event may have been removed or the link is outdated.</p>
        <Link to="/events" className={styles.PrimaryBtn}>
          Browse events
        </Link>
      </main>
    );
  }

  const when = [event.weekday, event.day, event.month, event.time].filter(Boolean).join(' · ');
  const going = event.goingCount || event.attendees || 12;
  const hostName = event.host || event.venue_name || event.location || 'GemSpot host';
  const mapsQuery = encodeURIComponent(
    [event.location, event.venue_name, 'Kenya'].filter(Boolean).join(', ')
  );
  const mapsEmbed = `https://maps.google.com/maps?q=${mapsQuery}&z=14&output=embed`;

  return (
    <main className={styles.Page}>
      <Link to="/events" className={styles.Back}>
        <ArrowLeft size={16} /> All events
      </Link>

      <div className={styles.Layout}>
        <div className={styles.MainCol}>
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
                  className={
                    isInterestedEvent?.(event.id) ? styles.SecondaryOn : styles.SecondaryBtn
                  }
                  onClick={() => toggleInterestedEvent?.(event)}
                >
                  <Users size={16} />{' '}
                  {isInterestedEvent?.(event.id) ? 'Interested' : "I'm interested"}
                </button>
                <button
                  type="button"
                  className={styles.IconBtn}
                  onClick={handleShare}
                  aria-label="Share"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>

          <section className={styles.Section}>
            <h2 className={styles.SectionTitle}>About Event</h2>
            <p className={styles.Description}>
              {event.description || 'No description provided for this event yet.'}
            </p>
            {event.whoCanAttend && (
              <>
                <h3 className={styles.SubTitle}>Who Can Attend?</h3>
                <p className={styles.Description}>{event.whoCanAttend}</p>
              </>
            )}
            {event.price && (
              <p className={styles.PriceLine}>
                <strong>Price:</strong> {event.price}
              </p>
            )}
          </section>

          <section className={styles.Section}>
            <h2 className={styles.SectionTitle}>Location</h2>
            <p className={styles.LocationName}>{event.location || event.venue_name || 'TBA'}</p>
            {event.address && <p className={styles.Muted}>{event.address}</p>}
            {event.directions && <p className={styles.Directions}>{event.directions}</p>}
            <div className={styles.MapWrap}>
              <iframe
                title="Event location map"
                src={mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className={styles.MapFrame}
              />
            </div>
            <a
              className={styles.MapLink}
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Maps <ExternalLink size={14} />
            </a>
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
        </div>

        <aside className={styles.SideCol}>
          <div className={styles.SideCard}>
            <p className={styles.SideLabel}>Presented by</p>
            <div className={styles.HostRow}>
              <div className={styles.HostAvatar} aria-hidden="true">
                {(hostName || 'G')[0]}
              </div>
              <div>
                <p className={styles.HostName}>{hostName}</p>
                <p className={styles.Muted}>Event organizer on GemSpot</p>
              </div>
            </div>
            <button type="button" className={styles.FollowBtn}>
              Follow
            </button>
          </div>

          <div className={styles.SideCard}>
            <p className={styles.SideLabel}>Hosted by</p>
            <p className={styles.HostName}>{hostName}</p>
            <div className={styles.GoingRow}>
              <Users size={16} />
              <span>
                <strong>{going}</strong> going
              </span>
            </div>
            <div className={styles.AvatarStack} aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={styles.MiniAvatar} style={{ zIndex: 4 - i }} />
              ))}
            </div>
          </div>

          <div className={styles.SideCard}>
            <button type="button" className={styles.TextLink}>
              Contact the Host
            </button>
            <button type="button" className={styles.TextLinkMuted}>
              <Flag size={14} /> Report Event
            </button>
            {event.category && (
              <span className={styles.TagChip}>#{String(event.category).replace(/\s+/g, '')}</span>
            )}
          </div>

          <div className={styles.SideCard}>
            <p className={styles.SideLabel}>Before or after?</p>
            <p className={styles.Muted}>Find nearby eats, nature, or nightlife.</p>
            <Link to="/explore" className={styles.PrimaryBtn}>
              Explore places nearby
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
