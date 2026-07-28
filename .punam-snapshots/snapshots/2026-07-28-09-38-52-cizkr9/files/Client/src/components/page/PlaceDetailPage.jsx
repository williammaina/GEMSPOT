import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import {
  CategoryPill,
  LogisticsCard,
  PlanBAlert,
  VibeReel,
  ReviewSection,
} from '@components';
import { PlaceDetailPageStyles as styles } from '@styles';
import { placesData, useWeather } from '@library';

export function PlaceDetailPage() {
  const { id } = useParams();

  const place = useMemo(() => {
    return (
      placesData.find((item) => String(item.slug || item.id) === String(id))
    );
  }, [id]);

  const weather = useWeather(place?.location || 'Nairobi');
  const reviews = Array.isArray(place?.reviews) ? place.reviews : [];
  const reels = Array.isArray(place?.reels) && place.reels.length > 0 ? place.reels : [place?.image];
  const altSuggestions = Array.isArray(place?.indoorAlternatives) ? place.indoorAlternatives : [];

  if (!place) {
    return (
      <main className={styles.PageContainer}>
        <section className={styles.EmptyStateCard}>
          <h1 className={styles.EmptyStateTitle}>Place not found</h1>
          <p className={styles.EmptyStateText}>
            The requested listing could not be located in the current frontend dataset.
          </p>
          <Link to="/explore" className={styles.BackLink}>
            <ArrowLeft size={16} /> Back to explore
          </Link>
        </section>
      </main>
    );
  }

  const weatherCondition = weather.loading ? 'Checking local weather…' : weather.condition || 'Weather update unavailable';

  return (
    <main className={styles.PageContainer}>
      <Link to="/explore" className={styles.BackLink}>
        <ArrowLeft size={16} /> Back to explore
      </Link>

      <section className={styles.HeroImageContainer} aria-label={place.title}>
        <img
          src={place.image}
          alt={place.title}
          className={styles.HeroImage}
          loading="eager"
        />
        <div className={styles.HeroOverlay} />
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

              <span className={styles.RatingPill}>
                <Star size={16} fill="currentColor" aria-hidden="true" />
                <span>{place.rating}</span>
              </span>
            </div>

            <div className={styles.MetaRow} aria-label="Place summary">
              <span className={styles.MetaItem}>
                <MapPin size={16} aria-hidden="true" />
                <span>{place.location}</span>
              </span>

              <span className={styles.MetaItemAccent}>
                <span>{place.priceLevel || place.priceLabel || 'Mid-range'}</span>
              </span>
            </div>

            <div className={styles.PillsRow} aria-label="Spot highlights">
              {(place.vibes || []).slice(0, 4).map((vibe) => (
                <CategoryPill key={vibe} label={vibe} isActive />
              ))}
            </div>
          </header>

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
        </section>

        <aside className={styles.SideColumn} aria-label="Logistics and backup options">
          <LogisticsCard
            title="Logistics & Vibe Check"
            type="general"
            details={place}
          />
          <LogisticsCard
            title="No-Surprises"
            type="no-surprises"
            details={place}
          />
          <PlanBAlert
            location={place.location}
            condition={weatherCondition}
            altSuggestions={altSuggestions.length > 0 ? altSuggestions : [place.image]}
          />
        </aside>
      </div>
    </main>
  );
}
