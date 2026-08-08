import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin, Share2, Star } from 'lucide-react';
import {
  CategoryPill,
  LogisticsCard,
  LocationCard,
  PlaceCard,
  PlanBAlert,
  VibeReel,
  ReviewSection,
} from '@components';
import { CategoryInsights } from '../shared/CategoryInsights.jsx';
import { WeatherBanner } from '../shared/WeatherBanner.jsx';
import { OwnerClaim } from '../shared/OwnerClaim.jsx';
import { reportCrowd } from '../../library/hooks/useCrowdLevel.js';
import { sharePlaceCard } from '../../library/helpers/shareCard.js';
import { trackEvent } from '../../library/helpers/analytics.js';
import { formatDistanceLabel, distanceFromUser } from '../../library/helpers/calculateDistance.js';
import { getCrowdSnapshot } from '../../library/hooks/useCrowdLevel.js';
import { PlaceDetailPageStyles as styles } from '@styles';
import {
  getPlaceById,
  getRelatedPlaces,
  useWeather,
  submitReviewHandler,
} from '@library';
import { useApp } from '../../library/contexts/AppContext.js';
import { fetchReviewsHandler } from '../../library/handlers/apiHandler.js';

export function PlaceDetailPage() {
  const { id } = useParams();
  const { trackPlaceView, isFavorite, toggleFavorite, user, pushToast, addToPlan, isInPlan, removeFromPlan, userLocation } = useApp();

  const [place, setPlace] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const weather = useWeather(place?.location || 'Nairobi');
  const placeId = place?.place_id ?? place?.id ?? place?.slug ?? '';
  const favorited = isFavorite?.(placeId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const result = await getPlaceById(id);
        if (cancelled) return;
        if (!result) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setPlace(result);
          if (result) trackPlaceView?.(result);
        setRelated(getRelatedPlaces(result, 3));
        setReviews(Array.isArray(result.reviews) ? result.reviews : []);

        // Prefer live reviews from API when available
        try {
          const remoteReviews = await fetchReviewsHandler({ place_id: result.place_id ?? result.id });
          if (!cancelled && Array.isArray(remoteReviews) && remoteReviews.length) {
            setReviews(remoteReviews);
          }
        } catch {
          // keep embedded reviews
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleShare = async () => {
    trackEvent('place_share', { id: place?.place_id || place?.id });
    const dist = formatDistanceLabel(distanceFromUser(userLocation, place));
    const crowd = getCrowdSnapshot(place?.place_id ?? place?.id, place?.category);
    const result = await sharePlaceCard(place, {
      distance: dist,
      crowd: crowd?.label,
    });
    if (result === 'copied') pushToast?.('Share text copied', 'success');
  };

  if (loading) {
    return (
      <main className={styles.PageContainer}>
        <section className={styles.EmptyStateCard}>
          <h1 className={styles.EmptyStateTitle}>Loading spot…</h1>
          <p className={styles.EmptyStateText}>Pulling the latest details for you.</p>
        </section>
      </main>
    );
  }

  if (notFound || !place) {
    return (
      <main className={styles.PageContainer}>
        <section className={styles.EmptyStateCard}>
          <h1 className={styles.EmptyStateTitle}>Place not found</h1>
          <p className={styles.EmptyStateText}>
            This listing is not in the curated dataset or API.
          </p>
          <Link to="/explore" className={styles.BackLink}>
            <ArrowLeft size={16} /> Back to explore
          </Link>
        </section>
      </main>
    );
  }

  // Only show vibe reels when we have real media — never re-use the hero image
  const reels = Array.isArray(place.reels)
    ? place.reels.filter(Boolean)
    : Array.isArray(place.images)
      ? place.images.map((img) => img.image_url || img.url || img).filter(Boolean)
      : [];
  const hasExtraGallery =
    reels.length > 0 &&
    !(reels.length === 1 && (reels[0] === place.image || reels[0] === place.featured_image));
  const altSuggestions = Array.isArray(place.indoorAlternatives)
    ? place.indoorAlternatives
    : [];

  const weatherCondition = weather.loading
    ? 'Checking local weather…'
    : weather.condition || 'Weather update unavailable';

  return (
    <main className={styles.PageContainer}>
      <div className={styles.TopBar}>
        <Link to="/explore" className={styles.BackLink}>
          <ArrowLeft size={16} /> Back to explore
        </Link>
        <button
          type="button"
          className={styles.IconAction}
          onClick={handleShare}
          aria-label="Share this place"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>

      <section className={styles.HeroImageContainer} aria-label={place.title}>
        <img
          src={place.image}
          alt={place.title}
          className={styles.HeroImage}
          loading="eager"
        />
        <div className={styles.HeroOverlay} />
      </section>

      {/* Primary actions — directly under hero */}
      <div className={styles.HeroActions} role="group" aria-label="Place actions">
        <button
          type="button"
          className={favorited ? styles.HeroSaveOn : styles.HeroSave}
          onClick={() => toggleFavorite?.(placeId)}
          aria-pressed={favorited}
        >
          <Heart size={18} fill={favorited ? 'currentColor' : 'none'} />
          {favorited ? 'Saved' : 'Save'}
        </button>
        <button
          type="button"
          className={styles.HeroPlan}
          onClick={() => {
            if (isInPlan?.(placeId)) removeFromPlan?.(placeId);
            else addToPlan?.(place);
          }}
        >
          {isInPlan?.(placeId) ? 'Remove from plan' : 'Add to plan'}
        </button>
      </div>

      <div className={styles.ContentSplit}>
        <section className={styles.MainColumn} aria-labelledby="place-title">
          <header className={styles.TitleBlock}>
            <div className={styles.TitleRow}>
              <div>
                <h1 id="place-title" className={styles.Title}>
                  {place.title}
                </h1>
                <p className={styles.Description}>{place.description}</p>
              </div>

              {typeof place.rating === 'number' && (
                <span className={styles.RatingPill}>
                  <Star size={16} fill="currentColor" aria-hidden="true" />
                  <span>{place.rating.toFixed(1)}</span>
                </span>
              )}
            </div>

            <div className={styles.MetaRow} aria-label="Place summary">
              <span className={styles.MetaItem}>
                <MapPin size={16} aria-hidden="true" />
                <span>{place.location}</span>
              </span>
              <span className={styles.MetaItemAccent}>
                <span>{place.priceLevel || 'Mid-range'}</span>
              </span>
            </div>

            <div className={styles.PillsRow} aria-label="Spot highlights">
              {(place.vibes || []).slice(0, 5).map((vibe) => (
                <CategoryPill key={vibe} label={vibe} isActive />
              ))}
            </div>
          </header>

          {hasExtraGallery && (
            <section className={styles.SectionBlock} aria-label="Experience preview">
              <VibeReel
                user={{
                  name: `${place.title} gallery`,
                  avatar: place.image,
                }}
                reels={reels}
              />
            </section>
          )}

          {/* Single category panel (menu / activities / vibe) — sits just above the map */}
          <section className={styles.SectionBlock} aria-label="Category insights">
            <CategoryInsights place={place} />
            {(String(place.category || '').toLowerCase() === 'nature' ||
              String(place.category || '').toLowerCase() === 'action') && (
              <WeatherBanner
                location={place.location || place.town || 'Nairobi'}
                lat={place.latitude ?? place.lat}
                lng={place.longitude ?? place.lng}
                title="Today's weather on site"
              />
            )}
          </section>

          <section className={styles.SectionBlock} aria-label="Location">
            <h2 className={styles.SectionHeading}>Location</h2>
            <LocationCard
              name={place.title || place.name}
              address={place.address || place.location}
              town={place.town}
              county={place.county}
              directions={place.directions}
              matatu={place.matatu || place.matatu_route}
              latitude={place.latitude}
              longitude={place.longitude}
            />
          </section>

          <section className={styles.SectionBlock} aria-label="Reviews">
            <OwnerClaim place={place} />
            <ReviewSection
              reviewsData={reviews}
              placeId={place.place_id ?? place.id}
              onReviewAdded={(r) => setReviews((prev) => [r, ...(prev || [])])}
              onCrowdReport={(level) => {
                reportCrowd(place.place_id ?? place.id, level, {
                  category: place.category,
                  source: 'review',
                });
              }}
            />
          </section>

          {related.length > 0 && (
            <section className={styles.RelatedSection} aria-labelledby="related-heading">
              <h2 id="related-heading" className={styles.RelatedTitle}>
                Similar spots you might like
              </h2>
              <div className={styles.RelatedGrid}>
                {related.map((item) => (
                  <PlaceCard
                    key={item.id}
                    place={item}
                    to={`/place/${item.place_id ?? item.id}`}
                  />
                ))}
              </div>
            </section>
          )}
        </section>

        <aside className={styles.SideColumn} aria-label="Logistics and backup options">
          <LogisticsCard title="Logistics & Vibe Check" type="general" details={place} />
          <LogisticsCard title="No-Surprises" type="no-surprises" details={place} />
          <PlanBAlert
            location={place.location}
            condition={weatherCondition}
            altSuggestions={
              altSuggestions.length > 0 ? altSuggestions : [place.image]
            }
          />
        </aside>
      </div>
    </main>
  );
}
