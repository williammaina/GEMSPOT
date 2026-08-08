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
  Bell,
  MoreHorizontal,
  Check,
  Heart,
  Navigation,
  MessageCircle,
} from 'lucide-react';
import { EventDetailPageStyles as styles } from '@styles';
import { getEventById, useCalendar } from '@library';
import { useApp } from '../../library/contexts/AppContext.js';
import { openDirectionsTo, buildDirectionsUrl } from '../../library/helpers/mapsDirections.js';
import { SafeImage } from '../shared/SafeImage.jsx';
import { WeatherBanner } from '../shared/WeatherBanner.jsx';
import { trackEvent } from '../../library/helpers/analytics.js';

export function EventDetailPage() {
  const { id } = useParams();
  const { syncEvent, downloadIcs } = useCalendar();
  const {
    pushToast,
    toggleInterestedEvent,
    isInterestedEvent,
    toggleGoingEvent,
    isGoingEvent,
    getEventGoingCount,
    addToPlan,
    isInPlan,
    removeFromPlan,
    remindEvent,
    enableNotifications,
    whatsappRemindLink,
  } = useApp();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEventById(id)
      .then((result) => {
        if (!cancelled) {
          setEvent(result);
          setLoading(false);
          if (result) trackEvent('event_view', { id: result.id, title: result.title });
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
    const title = event?.title || 'GemSpot event';
    trackEvent('event_share', { id: event?.id });
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} on GemSpot`, url });
        return;
      } catch {
        /* cancel */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      pushToast?.('Link copied', 'success');
    } catch {
      /* */
    }
  };

  if (loading) {
    return (
      <main className={styles.Page} aria-busy="true">
        <div className={styles.SkeletonHero} />
        <div className={styles.SkeletonLine} />
        <div className={styles.SkeletonLineShort} />
      </main>
    );
  }

  if (!event) {
    return (
      <main className={styles.Page}>
        <Link to="/events" className={styles.Back}>
          <ArrowLeft size={16} /> Back to events
        </Link>
        <div className={styles.EmptyState}>
          <h1 className={styles.Title}>Event not found</h1>
          <p className={styles.Muted}>This event may have ended or the link is outdated.</p>
          <Link to="/events" className={styles.PrimaryBtn}>
            Browse events
          </Link>
        </div>
      </main>
    );
  }

  const when = [event.weekday, event.day, event.month, event.time].filter(Boolean).join(' · ');
  const going = getEventGoingCount?.(event) ?? (event.goingCount || event.attendees || 12);
  const iAmGoing = isGoingEvent?.(event.id);
  const saved = isInterestedEvent?.(event.id);
  const inPlan = isInPlan?.(event.id);

  const hostRaw = event.host;
  const hostName =
    hostRaw && typeof hostRaw === 'object'
      ? [hostRaw.name, hostRaw.org].filter(Boolean).join(' · ') || 'GemSpot host'
      : String(hostRaw || event.host_name || event.venue_name || event.location || 'GemSpot host');
  const hostInitial = (hostName || 'G').trim().charAt(0).toUpperCase() || 'G';

  const mapsQuery = encodeURIComponent(
    [event.location, event.venue_name, 'Kenya'].filter(Boolean).join(', ')
  );

  return (
    <main className={styles.Page}>
      <div className={styles.TopBar}>
        <Link to="/events" className={styles.Back}>
          <ArrowLeft size={16} /> Events
        </Link>
        <button type="button" className={styles.IconGhost} onClick={handleShare} aria-label="Share event">
          <Share2 size={18} />
        </button>
      </div>

      {/* Full-bleed hero */}
      <section className={styles.HeroBlock}>
        <SafeImage src={event.image} alt="" className={styles.HeroImg} />
        <div className={styles.HeroGradient} aria-hidden="true" />
        {event.category && <span className={styles.CatBadge}>{event.category}</span>}
      </section>

      <div className={styles.Content}>
        <div className={styles.Main}>
          {when && <p className={styles.When}>{when}</p>}
          <h1 className={styles.Title}>{event.title}</h1>

          <ul className={styles.MetaList}>
            {event.location && (
              <li>
                <MapPin size={16} aria-hidden="true" />
                <span>{event.location}</span>
              </li>
            )}
            {event.time && (
              <li>
                <Clock size={16} aria-hidden="true" />
                <span>{event.time}</span>
              </li>
            )}
            {event.price && (
              <li>
                <Ticket size={16} aria-hidden="true" />
                <span>{event.price}</span>
              </li>
            )}
            <li>
              <Users size={16} aria-hidden="true" />
              <span>
                <strong>{going}</strong> going
                {iAmGoing ? ' · you' : ''}
              </span>
            </li>
          </ul>

          {/* Primary actions — max 2 prominent + overflow */}
          <div className={styles.PrimaryActions}>
            <button
              type="button"
              className={iAmGoing ? styles.BtnGoingOn : styles.BtnGoing}
              onClick={() => {
                toggleGoingEvent?.(event);
                trackEvent('event_going_toggle', { id: event.id, on: !iAmGoing });
              }}
              aria-pressed={Boolean(iAmGoing)}
            >
              {iAmGoing ? <Check size={18} /> : <Users size={18} />}
              {iAmGoing ? "You're going" : "I'm going"}
            </button>
            <button
              type="button"
              className={saved ? styles.BtnSaveOn : styles.BtnSave}
              onClick={() => toggleInterestedEvent?.(event)}
              aria-pressed={Boolean(saved)}
            >
              <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <div className={styles.MoreWrap}>
              <button
                type="button"
                className={styles.BtnMore}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={() => setMoreOpen((v) => !v)}
              >
                <MoreHorizontal size={20} />
              </button>
              {moreOpen && (
                <div className={styles.MoreMenu} role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      syncEvent(event);
                      pushToast?.('Opening Google Calendar…', 'success');
                      setMoreOpen(false);
                    }}
                  >
                    <CalendarPlus size={16} /> Google Calendar
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      downloadIcs?.(event);
                      pushToast?.('Calendar file downloaded', 'success');
                      setMoreOpen(false);
                    }}
                  >
                    <CalendarPlus size={16} /> Apple / Outlook (.ics)
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={async () => {
                      await enableNotifications?.();
                      remindEvent?.(event, 24);
                      pushToast?.('Reminder set', 'success');
                      setMoreOpen(false);
                    }}
                  >
                    <Bell size={16} /> Remind me
                  </button>
                  <a
                    role="menuitem"
                    href={
                      whatsappRemindLink?.(
                        `Reminder: ${event.title} at ${event.location || 'TBA'} — GemSpot`
                      ) || '#'
                    }
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMoreOpen(false)}
                  >
                    <MessageCircle size={16} /> WhatsApp note
                  </a>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      if (inPlan) removeFromPlan?.(event.id);
                      else addToPlan?.({ ...event, type: 'event' });
                      setMoreOpen(false);
                    }}
                  >
                    {inPlan ? 'Remove from plan' : 'Add to plan'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {event.description && (
            <section className={styles.Section}>
              <h2 className={styles.SectionTitle}>About</h2>
              <p className={styles.Prose}>{event.description}</p>
            </section>
          )}

          <WeatherBanner
            location={[event.location, event.venue_name, 'Kenya'].filter(Boolean).join(', ')}
            lat={event.lat ?? event.latitude}
            lng={event.lng ?? event.longitude}
            title="Weather for event day"
          />

          <section className={styles.Section}>
            <h2 className={styles.SectionTitle}>Location</h2>
            <p className={styles.LocationName}>{event.location || event.venue_name || 'TBA'}</p>
            <div className={styles.MapFrame}>
              <iframe
                title="Event map"
                src={`https://maps.google.com/maps?q=${mapsQuery}&z=14&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              className={styles.RouteBtn}
              href={buildDirectionsUrl({
                lat: event.lat ?? event.latitude,
                lng: event.lng ?? event.longitude,
                query: decodeURIComponent(mapsQuery),
              })}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openDirectionsTo({
                  lat: event.lat ?? event.latitude,
                  lng: event.lng ?? event.longitude,
                  query: decodeURIComponent(mapsQuery),
                });
              }}
            >
              <Navigation size={16} /> Route from my location
              <ExternalLink size={14} />
            </a>
          </section>
        </div>

        <aside className={styles.Aside}>
          <div className={styles.Card}>
            <p className={styles.CardLabel}>Host</p>
            <div className={styles.HostRow}>
              <span className={styles.Avatar} aria-hidden="true">
                {hostInitial}
              </span>
              <div>
                <p className={styles.HostName}>{hostName}</p>
                <p className={styles.MutedSm}>On GemSpot</p>
              </div>
            </div>
            <div className={styles.GoingStat}>
              <Users size={18} />
              <div>
                <strong>{going}</strong>
                <span>people going</span>
              </div>
            </div>
            <button
              type="button"
              className={iAmGoing ? styles.BtnGoingOn : styles.BtnGoing}
              style={{ width: '100%' }}
              onClick={() => toggleGoingEvent?.(event)}
            >
              {iAmGoing ? 'Cancel going' : "I'm going"}
            </button>
          </div>

          <div className={styles.Card}>
            <p className={styles.CardLabel}>Before or after?</p>
            <p className={styles.MutedSm}>Eats, nature, or nightlife nearby.</p>
            <Link to="/explore" className={styles.LinkBtn}>
              Explore places
            </Link>
          </div>

          <div className={styles.CardMuted}>
            <button type="button" className={styles.TextBtn}>
              Contact host
            </button>
            <button type="button" className={styles.TextBtnMuted}>
              <Flag size={14} /> Report
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
