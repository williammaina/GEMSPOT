import { WeatherBanner } from '../shared/WeatherBanner.jsx';
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
import { openDirectionsTo, buildDirectionsUrl } from '../../library/helpers/mapsDirections.js';
import { SafeImage } from '../shared/SafeImage.jsx';

export function EventDetailPage() {
  const { id } = useParams();
  const { syncEvent, downloadIcs, openOutlookWeb } = useCalendar();
  const { pushToast, toggleInterestedEvent, isInterestedEvent, toggleGoingEvent, isGoingEvent, getEventGoingCount, addToPlan, isInPlan, removeFromPlan, remindEvent, enableNotifications, whatsappRemindLink } = useApp();
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
  const going = getEventGoingCount?.(event) ?? (event.goingCount || event.attendees || 12);
  const iAmGoing = isGoingEvent?.(event.id);
  // Backend may return host as { name, org } — never render the object as a React child
  const hostRaw = event.host;
  const hostName =
    hostRaw && typeof hostRaw === 'object'
      ? [hostRaw.name, hostRaw.org].filter(Boolean).join(' · ') || 'GemSpot host'
      : String(hostRaw || event.host_name || event.venue_name || event.location || 'GemSpot host');
  const hostInitial = (hostName || 'G').trim().charAt(0).toUpperCase() || 'G';
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
                  Apple Calendar / Outlook (.ics)
                </button>
                <button
                  type="button"
                  className={
                    isInterestedEvent?.(event.id) ? styles.SecondaryOn : styles.SecondaryBtn
                  }
                  onClick={() => toggleInterestedEvent?.(event)}
                >
                  <Users size={16} />{' '}
                  {isInterestedEvent?.(event.id) ? 'Saved' : "I'm interested"}
                </button>
                <button
                  type="button"
                  className={iAmGoing ? styles.PrimaryBtn : styles.SecondaryBtn}
                  onClick={() => toggleGoingEvent?.(event)}
                  aria-pressed={Boolean(iAmGoing)}
                >
                  {iAmGoing ? "You're going ✓" : 'Going'}
                </button>
                <button
                  type="button"
                  className={styles.SecondaryBtn}
                  onClick={async () => {
                    await enableNotifications?.();
                    remindEvent?.(event, 24);
                    pushToast?.('Reminder set for 24h before (while app can run)', 'success');
                  }}
                >
                  Remind me
                </button>
                <a
                  className={styles.SecondaryBtn}
                  href={whatsappRemindLink?.(`Reminder: ${event.title} at ${event.location || 'TBA'} — via GemSpot`) || '#'}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textAlign: 'center', textDecoration: 'none' }}
                >
                  WhatsApp note
                </a>
                {isInterestedEvent?.(event.id) && (
                  <button
                    type="button"
                    className={isInPlan?.(event.id) ? styles.SecondaryOn : styles.SecondaryBtn}
                    onClick={() => {
                      if (isInPlan?.(event.id)) removeFromPlan?.(event.id);
                      else addToPlan?.({ ...event, type: 'event' });
                    }}
                  >
                    {isInPlan?.(event.id) ? 'In plan' : 'Add to plan'}
                  </button>
                )}
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
            <WeatherBanner
              location={[event.location, event.venue_name, 'Kenya'].filter(Boolean).join(', ')}
              lat={event.lat ?? event.latitude}
              lng={event.lng ?? event.longitude}
              title="Weather for event day"
            />
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
              href={buildDirectionsUrl({
                lat: event.lat ?? event.latitude,
                lng: event.lng ?? event.longitude,
                query: decodeURIComponent(mapsQuery),
              })}
              target="_blank"
              rel="noreferrer"
              className={styles.MapsLink}
              onClick={(e) => {
                e.preventDefault();
                openDirectionsTo({
                  lat: event.lat ?? event.latitude,
                  lng: event.lng ?? event.longitude,
                  query: decodeURIComponent(mapsQuery),
                });
              }}
            >
              Route from my location <ExternalLink size={14} />
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
                {hostInitial}
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
                <strong key={going}>{going}</strong> going
                {iAmGoing ? ' · including you' : ''}
              </span>
            </div>
            <button
              type="button"
              className={iAmGoing ? styles.GoingBtnOn : styles.GoingBtn}
              onClick={() => toggleGoingEvent?.(event)}
            >
              {iAmGoing ? "Cancel going" : "I'm going"}
            </button>
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
