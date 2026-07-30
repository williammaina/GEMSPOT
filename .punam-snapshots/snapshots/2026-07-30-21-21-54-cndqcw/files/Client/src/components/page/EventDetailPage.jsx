import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bus,
  CalendarPlus,
  Car,
  Check,
  Clock,
  Heart,
  MapPin,
  Share2,
  Ticket,
  Users,
  Wallet,
  MessageCircle,
  Flag,
  Sparkles,
} from 'lucide-react';
import { EventDetailPageStyles as styles } from '@styles';
import { getEventById, useCalendar, useEvents } from '@library';
import { useApp } from '../../library/contexts/AppContext.js';
import { SafeImage } from '../shared/SafeImage.jsx';

function initials(name = '') {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

export function EventDetailPage() {
  const { id } = useParams();
  const { syncEvent, downloadIcs } = useCalendar();
  const { pushToast, toggleInterestedEvent, isInterestedEvent } = useApp();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { events: allEvents } = useEvents({});

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

  const similar = useMemo(() => {
    if (!event || !Array.isArray(allEvents)) return [];
    return allEvents
      .filter((e) => e.id !== event.id && (e.category === event.category || true))
      .filter((e) => e.id !== event.id)
      .slice(0, 3);
  }, [event, allEvents]);

  const interested = event ? isInterestedEvent?.(event.id) : false;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description?.slice(0, 120),
          url,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      pushToast?.('Link copied', 'success');
    } catch {
      pushToast?.('Could not copy link', 'error');
    }
  };

  if (loading) {
    return (
      <main className={styles.Page}>
        <div className={styles.SkeletonHero} />
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

  const whenLine = [event.weekday, event.day, event.month].filter(Boolean).join(' · ');
  const host = event.host || {
    name: event.venue || event.location || 'Host',
    org: event.venue || 'Organizer',
    bio: '',
    avatar: null,
  };
  const going = event.goingCount ?? 0;
  const previewNames = event.goingPreview || [];

  return (
    <main className={styles.Page}>
      <Link to="/events" className={styles.Back}>
        <ArrowLeft size={16} /> All events
      </Link>

      {/* Hero */}
      <section className={styles.Hero} aria-label="Event hero">
        <div className={styles.HeroMedia}>
          <SafeImage src={event.image} alt={event.title} className={styles.HeroImage} />
          <div className={styles.HeroOverlay} />
          {event.category && (
            <span className={styles.HeroCat}>{event.category}</span>
          )}
          {(event.day || event.month) && (
            <div className={styles.DateBadge} aria-hidden="true">
              {event.month && <span className={styles.DateMonth}>{event.month}</span>}
              {event.day && <span className={styles.DateDay}>{event.day}</span>}
            </div>
          )}
        </div>

        <div className={styles.HeroBody}>
          {whenLine && <p className={styles.When}>{whenLine}</p>}
          <h1 className={styles.Title}>{event.title}</h1>

          <div className={styles.HostRow}>
            <div className={styles.HostAvatar} aria-hidden="true">
              {host.avatar ? (
                <img src={host.avatar} alt="" />
              ) : (
                <span>{initials(host.name)}</span>
              )}
            </div>
            <div className={styles.HostMeta}>
              <span className={styles.HostLabel}>Presented by</span>
              <strong className={styles.HostName}>{host.org || host.name}</strong>
            </div>
          </div>

          <div className={styles.MetaGrid}>
            {event.time && (
              <div className={styles.MetaItem}>
                <Clock size={16} />
                <div>
                  <span className={styles.MetaLabel}>When</span>
                  <span className={styles.MetaValue}>{event.time}</span>
                </div>
              </div>
            )}
            {(event.venue || event.location) && (
              <div className={styles.MetaItem}>
                <MapPin size={16} />
                <div>
                  <span className={styles.MetaLabel}>Where</span>
                  <span className={styles.MetaValue}>
                    {event.venue || event.location}
                    {event.address ? (
                      <small className={styles.MetaSub}>{event.address}</small>
                    ) : null}
                  </span>
                </div>
              </div>
            )}
            {event.price && (
              <div className={styles.MetaItem}>
                <Ticket size={16} />
                <div>
                  <span className={styles.MetaLabel}>Price</span>
                  <span className={styles.MetaValue}>{event.price}</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.Actions}>
            <button
              type="button"
              className={interested ? styles.PrimaryOn : styles.PrimaryBtn}
              onClick={() => {
                toggleInterestedEvent?.(event);
                pushToast?.(
                  interested ? 'Removed from interested' : "You're interested",
                  'success'
                );
              }}
            >
              {interested ? <Check size={16} /> : <Heart size={16} />}
              {interested ? 'Interested' : "I'm interested"}
            </button>
            <button
              type="button"
              className={styles.SecondaryBtn}
              onClick={() => {
                const ok = syncEvent(event);
                if (ok !== false) pushToast?.('Opening Google Calendar…', 'success');
              }}
            >
              <CalendarPlus size={16} /> Calendar
            </button>
            <button
              type="button"
              className={styles.IconBtn}
              onClick={handleShare}
              aria-label="Share event"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </section>

      <div className={styles.Layout}>
        <div className={styles.MainCol}>
          {/* Social proof */}
          <section className={styles.Card}>
            <div className={styles.GoingRow}>
              <div className={styles.GoingAvatars} aria-hidden="true">
                {(previewNames.length
                  ? previewNames
                  : ['A', 'B', 'C']
                )
                  .slice(0, 4)
                  .map((name, i) => (
                    <span
                      key={i}
                      className={styles.GoingDot}
                      style={{ zIndex: 4 - i, background: `hsl(${(i * 55) % 360} 55% 55%)` }}
                    >
                      {typeof name === 'string' ? name[0] : '?'}
                    </span>
                  ))}
              </div>
              <div>
                <strong className={styles.GoingCount}>
                  <Users size={15} /> {going} going
                </strong>
                {previewNames.length > 0 && (
                  <p className={styles.GoingNames}>
                    {previewNames.slice(0, 2).join(', ')}
                    {going > 2 ? ` and ${Math.max(0, going - 2)} others` : ''}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* About */}
          <section className={styles.Card}>
            <h2 className={styles.SectionTitle}>About this event</h2>
            <p className={styles.Description}>
              {event.description || 'No description provided for this event yet.'}
            </p>

            {event.whoCanAttend && (
              <div className={styles.Callout}>
                <h3 className={styles.CalloutTitle}>Who can attend?</h3>
                <p>{event.whoCanAttend}</p>
              </div>
            )}

            {event.tags?.length > 0 && (
              <div className={styles.TagRow}>
                {event.tags.map((t) => (
                  <span key={t} className={styles.Tag}>
                    # {t}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Price & payment — Kenya-first */}
          <section className={styles.Card}>
            <h2 className={styles.SectionTitle}>
              <Wallet size={18} /> Price & payment
            </h2>
            <p className={styles.PriceHero}>{event.price || 'See organizer'}</p>
            {event.priceNote && <p className={styles.PriceNote}>{event.priceNote}</p>}
            <div className={styles.PayChips}>
              <span className={styles.PayChip}>M-Pesa</span>
              <span className={styles.PayChip}>Cash at gate</span>
              {event.capacity ? (
                <span className={styles.PayChip}>Capacity {event.capacity}</span>
              ) : null}
            </div>
          </section>

          {/* Logistics */}
          <section className={styles.Card}>
            <h2 className={styles.SectionTitle}>Getting there</h2>
            <div className={styles.LogGrid}>
              {(event.venue || event.location) && (
                <div className={styles.LogItem}>
                  <MapPin size={18} className={styles.LogIcon} />
                  <div>
                    <strong>{event.venue || event.location}</strong>
                    {event.address && <p>{event.address}</p>}
                    {event.directions && (
                      <p className={styles.LogHint}>{event.directions}</p>
                    )}
                  </div>
                </div>
              )}
              {event.matatu && (
                <div className={styles.LogItem}>
                  <Bus size={18} className={styles.LogIcon} />
                  <div>
                    <strong>Matatu / transit</strong>
                    <p>{event.matatu}</p>
                  </div>
                </div>
              )}
              {event.parking && (
                <div className={styles.LogItem}>
                  <Car size={18} className={styles.LogIcon} />
                  <div>
                    <strong>Parking</strong>
                    <p>{event.parking}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Lightweight map placeholder — no token required */}
            <div className={styles.MapFrame}>
              <div className={styles.MapPin}>
                <MapPin size={22} />
              </div>
              <div className={styles.MapCopy}>
                <strong>{event.venue || event.location}</strong>
                <span>
                  {event.lat && event.lng
                    ? `${Number(event.lat).toFixed(3)}, ${Number(event.lng).toFixed(3)}`
                    : event.address || 'Kenya'}
                </span>
                {event.lat && event.lng && (
                  <a
                    className={styles.MapLink}
                    href={`https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Maps
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Similar */}
          {similar.length > 0 && (
            <section className={styles.Card}>
              <h2 className={styles.SectionTitle}>
                <Sparkles size={18} /> More like this
              </h2>
              <ul className={styles.SimilarList}>
                {similar.map((e) => (
                  <li key={e.id}>
                    <Link to={`/event/${e.id}`} className={styles.SimilarItem}>
                      {e.image && (
                        <img src={e.image} alt="" className={styles.SimilarThumb} loading="lazy" />
                      )}
                      <div>
                        <strong>{e.title}</strong>
                        <span>
                          {[e.weekday, e.day, e.month, e.time].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className={styles.SideCol}>
          <section className={styles.SideCard}>
            <h2 className={styles.SideTitle}>Hosted by</h2>
            <div className={styles.HostCard}>
              <div className={styles.HostAvatarLg} aria-hidden="true">
                {host.avatar ? (
                  <img src={host.avatar} alt="" />
                ) : (
                  <span>{initials(host.name)}</span>
                )}
              </div>
              <div>
                <strong>{host.name}</strong>
                {host.org && host.org !== host.name && (
                  <span className={styles.HostOrg}>{host.org}</span>
                )}
              </div>
            </div>
            {host.bio && <p className={styles.HostBio}>{host.bio}</p>}
            <button type="button" className={styles.FollowBtn}>
              Follow host
            </button>
          </section>

          <section className={styles.SideCard}>
            <h2 className={styles.SideTitle}>Actions</h2>
            <button
              type="button"
              className={styles.SideAction}
              onClick={() => {
                downloadIcs?.(event);
                pushToast?.('Calendar file downloaded', 'success');
              }}
            >
              <CalendarPlus size={16} /> Apple / Outlook (.ics)
            </button>
            <button type="button" className={styles.SideAction} onClick={handleShare}>
              <Share2 size={16} /> Share event
            </button>
            <a
              className={styles.SideAction}
              href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(
                window.location.href
              )}`}
            >
              <MessageCircle size={16} /> Contact host
            </a>
            <button
              type="button"
              className={styles.SideActionMuted}
              onClick={() => pushToast?.('Thanks — we will review this event', 'info')}
            >
              <Flag size={16} /> Report event
            </button>
          </section>

          <section className={styles.SideCta}>
            <p>Plan food or drinks around this event?</p>
            <Link to="/explore?category=eats" className={styles.PrimaryBtn}>
              Explore nearby eats
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
