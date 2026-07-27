import { MapPin, Star, Wallet, Bus } from 'lucide-react';
import { PlaceCardStyles as styles } from '@styles';
import { formatKES } from '@library';

export function PlaceCard({ place }) {
  return (
    <div className={styles.Card}>
      <div className={styles.ImageContainer}>
        <img src={place.image} alt={place.title} className={styles.Image} />
      </div>
      <div className={styles.Content}>
        <div className={styles.TitleRow}>
          <h3 className={styles.Title}>{place.title}</h3>
          <div className={styles.Rating}>
            <Star size={16} fill="currentColor" />
            <span>{place.rating}</span>
          </div>
        </div>
        
        <div className={styles.DetailRow}>
          <MapPin size={14} />
          <span>{place.location}</span>
        </div>
        
        <div className={styles.DetailRow}>
          <Wallet size={14} color="var(--color-emerald)" />
          <span>{formatKES(place.price)} per adult session</span>
        </div>

        <div className={styles.DetailRow}>
          <Bus size={14} color="var(--color-sapphire)" />
          <span>Matatu: {place.matatu}</span>
        </div>

        <div className={styles.VibeTags}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>Vibe Check</span>
          {place.vibes.map(vibe => (
            <span key={vibe} className={styles.Tag}>{vibe}</span>
          ))}
        </div>
      </div>
    </div>
  );
}