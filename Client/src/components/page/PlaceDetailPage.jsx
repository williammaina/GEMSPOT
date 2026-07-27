import { MapPin, Star } from 'lucide-react';
import {
  CategoryPill,
  LogisticsCard,
  PlanBAlert,
  VibeReel,
  ReviewSection,
} from '@components';
import { PlaceDetailPageStyles as styles } from '@styles';

export function PlaceDetailPage() {
  const place = {
    title: "CJ's Restaurant - Village Market",
    location: 'Gigiri',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
    damage: 5500,
    gateFee: 'None',
    dressCode: 'Smart Casual',
  };

  return (
    <main className={styles.PageContainer}>
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
              <h1 id="place-title" className={styles.Title}>
                {place.title}
              </h1>
            </div>

            <div className={styles.MetaRow} aria-label="Place summary">
              <span className={styles.MetaItem}>
                <MapPin size={16} aria-hidden="true" />
                <span>{place.location}</span>
              </span>

              <span className={styles.MetaItemAccent}>
                <Star size={16} fill="currentColor" aria-hidden="true" />
                <span>{place.rating}</span>
              </span>
            </div>

            <div className={styles.PillsRow} aria-label="Page sections">
              <CategoryPill label="Reviews" isActive={true} />
              <CategoryPill label="Menu" isActive={false} />
            </div>
          </header>

          <section className={styles.SectionBlock} aria-label="Experience preview">
            <VibeReel />
          </section>

          <section className={styles.SectionBlock} aria-label="Reviews">
            <ReviewSection />
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
            condition="Light rain"
            altSuggestions={[
              'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=100&q=80',
              'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&q=80',
            ]}
          />
        </aside>
      </div>
    </main>
  );
}