import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, Wallet, Bus, Navigation, Sparkles } from 'lucide-react';
import { SafeImage } from './SafeImage.jsx';
import { PlaceCardStyles as styles } from '@styles';
import { formatKES, distanceFromUser, formatDistanceLabel } from '@library';
import { useApp } from '../../library/contexts/AppContext.js';
import { getInsightTeaser } from './CategoryInsights.jsx';
import { CrowdBadge } from './CrowdBadge.jsx';

export function PlaceCard({ place = {}, to }) {
  const { isFavorite, toggleFavorite, userLocation, user, pushToast } = useApp();
  const navigate = useNavigate();
  const signedIn = Boolean(user?.isAuthenticated || user?.email);
  const locked = !signedIn;
  const vibes = Array.isArray(place.vibes) ? place.vibes : [];
  const title = place.title || place.name || 'Untitled spot';
  const placeId = place.place_id ?? place.id ?? place.slug ?? '';
  const href = to || `/place/${placeId}`;
  const favorited = isFavorite?.(String(placeId));
  const teaser = getInsightTeaser(place);
  const category = String(place.category || '').toLowerCase();

  const foodItems = (
    Array.isArray(place.menuHighlights)
      ? place.menuHighlights
      : Array.isArray(place.popularFood)
        ? place.popularFood
        : ['Local favourite', 'Chef special']
  ).slice(0, 3);

  const activities = (Array.isArray(place.activities) ? place.activities : []).slice(0, 3);

  const kmAway = distanceFromUser(userLocation, place);
  const distanceLabel = formatDistanceLabel(kmAway);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (locked) {
      pushToast?.('Sign in to save places', 'info');
      navigate('/login', { state: { from: href } });
      return;
    }
    if (placeId !== '' && placeId != null) toggleFavorite?.(String(placeId));
  };

  const handleOpen = (e) => {
    if (!locked) return;
    e.preventDefault();
    e.stopPropagation();
    pushToast?.('Create an account to open place details', 'info');
    navigate('/login', { state: { from: href } });
  };

  const Wrapper = locked ? 'div' : Link;
  const wrapperProps = locked
    ? {
        className: `${styles.Card} ${styles.CardGlow || ''} ${styles.CardLocked || ''}`,
        role: 'button',
        tabIndex: 0,
        onClick: handleOpen,
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen(e);
          }
        },
        'aria-label': `Sign in to view ${title}`,
        'data-category': category || undefined,
      }
    : {
        className: `${styles.Card} ${styles.CardGlow || ''}`,
        to: href,
        'aria-label': `Open details for ${title}`,
        'data-category': category || undefined,
      };

  return (
    <Wrapper {...wrapperProps}>
      <div className={styles.GlowRing} aria-hidden="true" />
      <div className={styles.ImageContainer}>
        <SafeImage src={place.image} alt={title} className={styles.Image} />
        <div className={styles.CrowdSlot}>
          <CrowdBadge placeId={placeId} category={category} />
        </div>
        <button
          type="button"
          className={favorited ? styles.FavBtnActive : styles.FavBtn}
          onClick={handleFavorite}
          aria-label={favorited ? `Remove ${title} from favorites` : `Save ${title}`}
          aria-pressed={favorited}
        >
          <Heart size={15} fill={favorited ? 'currentColor' : 'none'} />
        </button>
        {category ? (
          <span className={styles.CategoryBadge} data-cat={category}>
            {category}
          </span>
        ) : null}
        {place.openLabel ? (
          <span className={styles.OpenBadge} data-open={place.openNow ? '1' : '0'}>
            {place.openLabel}
          </span>
        ) : null}
        {distanceLabel ? (
          <span className={styles.DistanceBadge}>
            <Navigation size={11} /> {distanceLabel}
          </span>
        ) : null}
      </div>

      <div className={styles.Content}>
        <div className={styles.TitleRow}>
          <h3 className={styles.Title}>{title}</h3>
          {place.rating != null && !Number.isNaN(Number(place.rating)) ? (
            <div className={styles.Rating}>
              <Star size={12} fill="currentColor" />
              <span>{Number(place.rating).toFixed(1)}</span>
            </div>
          ) : null}
        </div>

        <div className={styles.DetailGroup}>
          {place.location ? (
            <div className={styles.DetailRow}>
              <MapPin size={13} className={styles.IconPrimary} />
              <span>{place.location}</span>
            </div>
          ) : null}

          {place.price !== undefined && place.price !== null ? (
            <div className={styles.DetailRow}>
              <Wallet size={13} className={styles.IconPrimary} />
              <span>{formatKES(place.price)} for two</span>
            </div>
          ) : null}

          {place.matatu ? (
            <div className={styles.DetailRow}>
              <Bus size={13} className={styles.IconMuted} />
              <span>Matatu: {place.matatu}</span>
            </div>
          ) : null}
        </div>

        {teaser ? (
          <div className={styles.InsightChip}>
            <Sparkles size={12} />
            <span>{teaser}</span>
          </div>
        ) : null}

        {category === 'eats' || category === 'cafe' ? (
          <div className={styles.FoodRow}>
            <span className={styles.FoodLabel}>Popular</span>
            {foodItems.map((item, i) => (
              <span key={i} className={styles.FoodChip}>
                {typeof item === 'string' ? item : item.name || item.title}
                {item && typeof item === 'object' && item.price != null
                  ? ` · KES ${Number(item.price).toLocaleString('en-KE')}`
                  : ''}
              </span>
            ))}
          </div>
        ) : null}


        {category === 'nature' && activities.length > 0 ? (
          <div className={styles.ActivityRow}>
            <span className={styles.ActivityLabel}>Do</span>
            {activities.map((act, i) => (
              <span key={i} className={styles.ActivityChip}>
                {typeof act === 'string' ? act : act.name}
              </span>
            ))}
          </div>
        ) : null}

        {vibes.length > 0 ? (
          <div className={styles.VibeTags}>
            <span className={styles.VibeLabel}>Vibe</span>
            {vibes.slice(0, 3).map((vibe) => (
              <span key={vibe} className={styles.Tag}>
                {vibe}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Wrapper>
  );
}
