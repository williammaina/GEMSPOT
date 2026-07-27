import { MapPin, Star } from 'lucide-react';
// Added ReviewSection to the component imports
import { CategoryPill, LogisticsCard, PlanBAlert, VibeReel, ReviewSection } from '@components';
import { PlaceDetailPageStyles as styles } from '@styles';

export function PlaceDetailPage() {
  // In a real app, you'd fetch this via useParams() and your library handlers
  const place = {
    title: "CJ's Restaurant - Village Market",
    location: "Gigiri",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200",
    damage: 5500,
    gateFee: "None",
    dressCode: "Smart Casual"
  };

  return (
    <div className={styles.PageContainer}>
      <div className={styles.HeroImageContainer}>
        <img src={place.image} alt={place.title} className={styles.HeroImage} />
      </div>

      <div className={styles.ContentSplit}>
        {/* Left Column: Core Info & Reviews */}
        <div className={styles.MainColumn}>
          <div>
            <div className={styles.TitleRow}>
              <h1 className={styles.Title}>{place.title}</h1>
            </div>
            <div className={styles.MetaRow}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={16} /> {place.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning-yellow)' }}>
                <Star size={16} fill="currentColor" /> {place.rating}
              </span>
            </div>
            <div className={styles.PillsRow}>
              <CategoryPill label="Reviews" isActive={true} />
              <CategoryPill label="Menu" isActive={false} />
            </div>
          </div>

          <VibeReel />
          
          {/* Replaced the placeholder with the actual ReviewSection component */}
          <ReviewSection />
        </div>

        {/* Right Column: Logistics & Alerts */}
        <div className={styles.SideColumn}>
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
              'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&q=80'
            ]}
          />
        </div>
      </div>
    </div>
  );
}