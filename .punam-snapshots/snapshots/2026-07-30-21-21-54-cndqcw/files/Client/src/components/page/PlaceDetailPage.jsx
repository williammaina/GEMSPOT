import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bus,
  Clock,
  Heart,
  MapPin,
  Share2,
  Star,
  Wallet,
  Wifi,
  Car,
  Sparkles,
  Plus,
} from 'lucide-react';
import {
  CategoryPill,
  CategoryInsights,
  LogisticsCard,
  PlaceCard,
  PlanBAlert,
  VibeReel,
  ReviewSection,
} from '@components';
import { PlaceDetailPageStyles as styles } from '@styles';
import {
  getPlaceById,
  getRelatedPlaces,
  useWeather,
  formatKES,
} from '@library';
import { useApp } from '../../library/contexts/AppContext.js';
import { fetchReviewsHandler } from '../../library/handlers/apiHandler.js';

export function PlaceDetailPage() {
  const { id } = useParams();
  const {
    trackPlaceView,
    isFavorite,
    toggleFavorite,
    pushToast,
    addToPlan,
  } = useApp();

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

        try {
          const remoteReviews = await fetchReviewsHandler({
            place_id: result.place_id ?? result.id,
          });
          if (!cancelled && Array.isArray(remoteReviews) && remoteReviews.length) {
            setReviews(remoteReviews);
          }
        } catch {
          /* keep embedded */
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
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const payload = {
      title: place?.title || 'GemSpot KE',
      text: place?.description || 'Check out this spot on GemSpot KE',
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        pushToast?.('Link copied', 'success');
      }
    } catch {
      /* cancelled */
    }
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

  const reels =
    Array.isArray(place.reels) && place.reels.length > 0
      ? place.reels
      : place.image
        ? [place.image]
        : [];
  const altSuggestions = Array.isArray(place.indoorAlternatives)
    ? place.indoorAlternatives
    : [];

  const weatherCondition = weather.loading
    ? 'Checking local weather…'
    : weather.condition || 'Weather update unavailable';

  const damage =
    place.price != null
      ? formatKES?.(place.price) || `KES ${place.price}`
      : place.priceLevel || null;

  return (
    <main className={styles.PageContainer}>
      <div className={styles.TopBar}>
        <Link to="/explore" className={styles.BackLink}>
          <ArrowLeft size={16} /> Back to explore
        </Link>

        <div className={styles.TopActions}>
          <button
            type="button"
            className={styles.IconAction}
            onClick={handleShare}
            aria-label="Share this place"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
          <button
            type="button"
            className={favorited ? styles.IconActionActive : styles.IconAction}
            onClick={() => {
              toggleFavorite?.(placeId);
              pushToast?.(favorited ? 'Removed from saved' : 'Saved', 'success');
            }}
            aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
            aria-pressed={favorited}
          >
            <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
            <span>{favorited ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      <section className={styles.HeroImageContainer} aria-label={place.title}>
        <img
          src={place.image}
          alt={place.title}
          className={styles.HeroImage}
          loading="eager"
        />
        <div className={styles.HeroOverlay} />
        {place.category && (
          <span className={styles.HeroCat}>{place.category}</span>
        )}
        {place.openLabel && (
          <span className={styles.OpenHero} data-open={place.openNow ? '1' : '0'}>
            {place.openLabel}
          </span>
        )}
      </section>

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
              {damage && (
                <span className={styles.MetaItemAccent}>
                  <Wallet size={14} />
                  <span>{damage} for two</span>
                </span>
              )}
            </div>

            <div className={styles.PillsRow} aria-label="Spot highlights">
              {(place.vibes || []).slice(0, 5).map((vibe) => (
                <CategoryPill key={vibe} label={vibe} isActive />
              ))}
            </div>

            <div className={styles.QuickActions}>
              <button
                type="button"
                className={styles.PrimaryAction}
                onClick={() => {
                  if (typeof addToPlan === 'function') {
                    addToPlan?.(place);
                    pushToast?.('Added to tonight’s plan', 'success');
                  } else {
                    toggleFavorite?.(placeId);
                    pushToast?.('Saved — open Plan to build your night', 'success');
                  }
                }}
              >
                <Plus size={16} /> Add to night plan
              </button>
              <Link to="/plan" className={styles.SecondaryAction}>
                <Sparkles size={16} /> View plan
              </Link>
            </div>
          </header>

          {/* Snapshot facts */}
          <section className={styles.FactGrid} aria-label="At a glance">
            {place.matatu && (
              <div className={styles.Fact}>
                <Bus size={16} />
                <div>
                  <strong>Matatu</strong>
                  <span>{place.matatu}</span>
                </div>
              </div>
            )}
            {place.parking && (
              <div className={styles.Fact}>
                <Car size={16} />
                <div>
                  <strong>Parking</strong>
                  <span>{place.parking}</span>
                </div>
              </div>
            )}
            {place.wifi && (
              <div className={styles.Fact}>
                <Wifi size={16} />
                <div>
                  <strong>Wi‑Fi</strong>
                  <span>{place.wifi}</span>
                </div>
              </div>
            )}
            {place.mpesaAvailable !== false && (
              <div className={styles.Fact}>
                <Wallet size={16} />
                <div>
                  <strong>M-Pesa</strong>
                  <span>Accepted</span>
                </div>
              </div>
            )}
            {place.openLabel && (
              <div className={styles.Fact}>
                <Clock size={16} />
                <div>
                  <strong>Hours</strong>
                  <span>{place.openLabel}</span>
                </div>
              </div>
            )}
          </section>

          {(place.amenities || []).length > 0 && (
            <section className={styles.SectionBlock}>
              <h2 className={styles.BlockTitle}>Amenities</h2>
              <div className={styles.AmenityRow}>
                {place.amenities.map((a) => (
                  <span key={a} className={styles.Amenity}>
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          <CategoryInsights place={place} />

          <section className={styles.SectionBlock} aria-label="Experience preview">
            <VibeReel
              user={{
                name: `${place.title} vibe reel`,
                avatar: place.image,
              }}
              reels={reels}
            />
          </section>

          <section className={styles.SectionBlock} aria-label="Reviews">
            <ReviewSection reviewsData={reviews} />
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
