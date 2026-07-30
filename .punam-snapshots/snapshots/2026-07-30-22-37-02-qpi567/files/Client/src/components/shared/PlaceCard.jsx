import { Link } from 'react-router-dom';
import { Heart, MapPin, Star, Wallet, Bus, Navigation, Sparkles } from 'lucide-react';
import { SafeImage } from './SafeImage.jsx';
import { PlaceCardStyles as styles } from '@styles';
import { formatKES, calculateDistance } from '@library';
import { useApp } from '../../library/contexts/AppContext.js';
import { getInsightTeaser } from './CategoryInsights.jsx';

export function PlaceCard({ place = {}, to }) {
  const { isFavorite, toggleFavorite, userLocation } = useApp();
  const vibes = Array.isArray(place.vibes) ? place.vibes : [];
  const title = place.title || place.name || 'Untitled spot';
  const placeId = place.place_id ?? place.id ?? place.slug ?? '';
  const href = to || `/place/${placeId}`;
  const favorited = isFavorite?.(String(placeId));
  const teaser = getInsightTeaser(place);
  const category = String(place.category || '').toLowerCase();

  let distanceLabel = null;
  if (
    userLocation &&
    place.latitude != null &&
    place.longitude != null &&
    !Number.isNaN(Number(place.latitude)) &&
    !Number.isNaN(Number(place.longitude))
  ) {
    const km = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      Number(place.latitude),
      Number(place.longitude)
    );
    if (km != null && !Number.isNaN(km)) {
      distanceLabel = km < 1 ? `${Math.round(km * 1000)} m away` : `${km} km away`;
    }
  }

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (placeId !== '' && placeId != null) toggleFavorite?.(String(placeId));
  };

  return (
    <Link
      className={`${styles.Card} ${styles.CardGlow || ''}`}
      to={href}
      aria-label={`Open details for ${title}`}
      data-category={category || undefined}
    >
      <div className={styles.GlowRing} aria-hidden="true" />
      <div className={styles.ImageContainer}>
        <SafeImage src={place.image} alt={title} className={styles.Image} />
        <button
          type="button"
          className={favorited ? styles.FavBtnActive : styles.FavBtn}
          onClick={handleFavorite}
          aria-label={favorited ? `Remove ${title} from favorites` : `Save ${title}`}
          aria-pressed={favorited}
        >
          <Heart size={15} fill={favorited ? 'currentColor' : 'none'} />
        </button>
        {category && (
          <span className={styles.CategoryBadge} data-cat={category}>
            {category}
          </span>
        )}
        {place.openLabel && (
          <span className={styles.OpenBadge} data-open={place.openNow ? '1' : '0'}>
            {place.openLabel}
          </span>
        )}
        {distanceLabel && (
          <span className={styles.DistanceBadge}>
            <Navigation size={11} /> {distanceLabel}
          </span>
        )}
      </div>

      <div className={styles.Content}>
        <div className={styles.TitleRow}>
          <h3 className={styles.Title}>{title}</h3>
          {typeof place.rating === 'number' && place.rating > 0 && (
            <div className={styles.Rating}>
              <Star size={12} fill="currentColor" />
              <span>{place.rating.toFixed(1)}</span>
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

          {place.price !== undefined && place.price !== null && (
            <div className={styles.DetailRow}>
              <Wallet size={13} className={styles.IconPrimary} />
              <span>{formatKES(place.price)} for two</span>
            </div>
          )}

          {place.matatu && (
            <div className={styles.DetailRow}>
              <Bus size={13} className={styles.IconMuted} />
              <span>Matatu: {place.matatu}</span>
            </div>
          )}
        </div>

        {teaser && (
          <div className={styles.InsightChip}>
            <Sparkles size={12} />
            <span>{teaser}</span>
          </div>
        )}

        {vibes.length > 0 && (
          <div className={styles.VibeTags}>
            <span className={styles.VibeLabel}>Vibe</span>
            {vibes.slice(0, 3).map((vibe) => (
              <span key={vibe} className={styles.Tag}>
                {vibe}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
