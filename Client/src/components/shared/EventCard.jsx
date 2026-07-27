import { Calendar, Clock, MapPin } from 'lucide-react';
import { CalendarButton } from '@components';
import { clsx } from 'clsx';
import { EventCardStyles as styles } from '@styles';
import { useCalendar } from '@library';

export function EventCard({ event }) {
  const { syncEvent } = useCalendar();

  return (
    <article 
      className={clsx(styles.Card, event.featured && styles.FeaturedCard)}
      tabIndex={0}
    >
      {/* Media Viewport with Overlay Badges */}
      <div className={clsx(styles.ImageContainer, event.featured && styles.FeaturedImage)}>
        <img 
          src={event.image} 
          alt={event.title} 
          className={styles.Image} 
          loading="lazy" 
        />

        {/* Prominent Date Badge */}
        {event.date && (
          <div className={styles.DateBadge}>
            <Calendar size={13} />
            <span>{event.date}</span>
          </div>
        )}

        {/* Category Chip */}
        {event.category && (
          <span className={styles.CategoryChip}>
            {event.category}
          </span>
        )}
      </div>
      
      {/* Card Content & Metadata */}
      <div className={styles.Content}>
        <h3 className={styles.Title}>{event.title}</h3>
        
        <div className={styles.InfoGroup}>
          <div className={styles.TimeLocationMeta}>
            {event.time && (
              <div className={styles.InfoRow}>
                <Clock size={14} style={{ color: 'var(--color-primary, #2dd4bf)' }} />
                <span>{event.time}</span>
              </div>
            )}

            {event.location && (
              <div className={styles.InfoRow}>
                <MapPin size={14} style={{ color: 'var(--color-primary, #2dd4bf)' }} />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Featured Sync CTA */}
        {event.featured && (
          <div className={styles.CtaWrapper}>
            <CalendarButton onClick={() => syncEvent(event)} />
          </div>
        )}
      </div>
    </article>
  );
}