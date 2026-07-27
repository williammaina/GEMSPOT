import { Calendar, Clock, MapPin } from 'lucide-react';
import { CalendarButton } from '@components';
import { clsx } from 'clsx';
import { EventCardStyles as styles } from '@styles';

export function EventCard({ event }) {
  return (
    <div className={clsx(styles.Card, event.featured && styles.FeaturedCard)}>
      <div className={clsx(styles.ImageContainer, event.featured && styles.FeaturedImage)}>
        <img src={event.image} alt={event.title} className={styles.Image} />
      </div>
      
      <div className={styles.Content}>
        <h3 className={styles.Title}>{event.title}</h3>
        
        <div className={styles.InfoRow}>
          <Calendar size={14} />
          <span>{event.date}</span>
          <Clock size={14} style={{ marginLeft: '8px' }} />
          <span>{event.time}</span>
        </div>
        
        <div className={styles.InfoRow}>
          <MapPin size={14} />
          <span>{event.location}</span>
        </div>

        {event.featured && (
          <CalendarButton onClick={() => console.log('Syncing to calendar...')} />
        )}
      </div>
    </div>
  );
}