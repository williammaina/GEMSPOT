import { MapPin, Star, Wallet, Bus } from 'lucide-react';
import { PlaceCardStyles as styles } from '@styles';
import { formatKES } from '@library';

export function PlaceCard({ place = {} }) {
  const vibes = Array.isArray(place.vibes) ? place.vibes : [];

  return (
    <article className={styles.Card} tabIndex={0}>
      <div className={styles.ImageContainer}>
        <img 
          src={place.image} 
          alt={place.title || 'Spot image'} 
          className={styles.Image} 
          loading="lazy"
        />
      </div>

      <div className={styles.Content}>
        <div className={styles.TitleRow}>
          <h3 className={styles.Title}>{place.title}</h3>
          {place.rating && (
            <div className={styles.Rating}>
              <Star size={12} fill="currentColor" />
              <span>{place.rating}</span>
            </div>
          )}
        </div>
        
        <div className={styles.DetailGroup}>
          {place.location && (
            <div className={styles.DetailRow}>
              <MapPin size={13} className={styles.IconPrimary} />
              <span>{place.location}</span>
            </div>
          )}
          
          {place.price !== undefined && (
            <div className={styles.DetailRow}>
              <Wallet size={13} className={styles.IconPrimary} />
              <span>{formatKES(place.price)} per session</span>
            </div>
          )}

          {place.matatu && (
            <div className={styles.DetailRow}>
              <Bus size={13} className={styles.IconMuted} />
              <span>Matatu: {place.matatu}</span>
            </div>
          )}
        </div>

        {vibes.length > 0 && (
          <div className={styles.VibeTags}>
            <span className={styles.VibeLabel}>Vibe Check</span>
            {vibes.map((vibe) => (
              <span key={vibe} className={styles.Tag}>
                {vibe}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}