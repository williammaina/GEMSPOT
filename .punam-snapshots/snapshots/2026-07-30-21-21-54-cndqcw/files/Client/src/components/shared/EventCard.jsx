import { Link } from 'react-router-dom';
import { Clock, MapPin, Ticket, CalendarPlus, Users } from 'lucide-react';
import clsx from 'clsx';
import { EventCardStyles as styles } from '@styles';
import { useCalendar } from '@library';

export function EventCard({ event, compact = false }) {
  const { syncEvent } = useCalendar();
  const id = event?.id ?? event?.event_id;
  const going = event?.goingCount;

  return (
    <article
      className={clsx(styles.Card, event.featured && styles.FeaturedCard, compact && styles.CompactCard)}
    >
      <Link to={`/event/${id}`} className={styles.CardLink} aria-label={`Open ${event.title}`}>
        <div className={clsx(styles.ImageContainer, event.featured && styles.FeaturedImage)}>
          {event.image && (
            <img src={event.image} alt={event.title} className={styles.Image} loading="lazy" />
          )}

          {(event.day || event.date) && (
            <div className={styles.DateBadge} aria-label={event.date}>
              {event.weekday && <span className={styles.DateWeekday}>{event.weekday}</span>}
              {event.day && <span className={styles.DateDay}>{event.day}</span>}
              {event.month && <span className={styles.DateMonth}>{event.month}</span>}
              {!event.day && event.date && (
                <span className={styles.DateFallback}>{event.date}</span>
              )}
            </div>
          )}

          {event.category && <span className={styles.CategoryChip}>{event.category}</span>}
        </div>

        <div className={styles.Content}>
          <h3 className={styles.Title}>{event.title}</h3>

          {event.host?.name && (
            <p className={styles.HostLine}>by {event.host.org || event.host.name}</p>
          )}

          <div className={styles.InfoGroup}>
            {event.time && (
              <div className={styles.InfoRow}>
                <Clock size={14} className={styles.MetaIcon} aria-hidden="true" />
                <span>{event.time}</span>
              </div>
            )}
            {event.location && (
              <div className={styles.InfoRow}>
                <MapPin size={14} className={styles.MetaIcon} aria-hidden="true" />
                <span>{event.location}</span>
              </div>
            )}
            {event.price && (
              <div className={styles.InfoRow}>
                <Ticket size={14} className={styles.MetaIconWarn} aria-hidden="true" />
                <span>{event.price}</span>
              </div>
            )}
            {typeof going === 'number' && going > 0 && (
              <div className={styles.InfoRow}>
                <Users size={14} className={styles.MetaIcon} aria-hidden="true" />
                <span>{going} going</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        className={styles.CalendarBtn}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          syncEvent(event);
        }}
        aria-label={`Add ${event.title} to calendar`}
      >
        <CalendarPlus size={15} />
        Calendar
      </button>
    </article>
  );
}
