import { Link } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Star,
  Wallet,
  Bus,
  Navigation,
  Footprints,
  UtensilsCrossed,
  Music2,
  Shirt,
} from 'lucide-react';
import { SafeImage } from './SafeImage.jsx';
import { PlaceCardStyles as styles } from '@styles';
import { formatKES, calculateDistance } from '@library';
import { useApp } from '../../library/contexts/AppContext.js';

function insightTeaser(place) {
  const cat = String(place.category || '').toLowerCase();
  if (cat === 'nature' || cat === 'action') {
    const req = place.requirements?.[0]?.label;
    const act = place.activities?.[0]?.name;
    if (req) return { Icon: Shirt, text: req };
    if (act) return { Icon: Footprints, text: act };
  }
  if (cat === 'eats') {
    const dish = place.signatureDish || place.menuHighlights?.[0]?.name;
    if (dish) return { Icon: UtensilsCrossed, text: dish };
  }
  if (cat === 'nightlife') {
    if (place.musicVibe) {
      const short = place.musicVibe.split('·')[0].trim();
      return { Icon: Music2, text: short };
    }
    const drink = place.signatureDrinks?.[0]?.name;
    if (drink) return { Icon: Music2, text: drink };
  }
  return null;
}

export function PlaceCard({ place = {}, to }) {
  const { isFavorite, toggleFavorite, userLocation } = useApp();
  const vibes = Array.isArray(place.vibes) ? place.vibes : [];
  const title = place.title || place.name || 'Untitled spot';
  const placeId = place.place_id ?? place.id ?? place.slug ?? '';
  const href = to || `/place/${placeId}`;
  const favorited = isFavorite?.(String(placeId));
  const teaser = insightTeaser(place);

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
    <Link className={styles.Card} to={href} aria-label={`Open details for ${title}`}>
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
        {place.category && (
          <span className={styles.CatBadge} data-cat={place.category}>
            {place.category}
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
          <div className={styles.InsightTeaser}>
            {(() => {
              const Icon = teaser.Icon;
              return <Icon size={13} aria-hidden="true" />;
            })()}
            <span>{teaser.text}</span>
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
