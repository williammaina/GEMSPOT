import { MapboxCanvas, PlaceCard } from '@components';
import { placesData } from '@library';
import { ExplorePageStyles as styles } from '@styles';

export function ExplorePage() {
  return (
    <div className={styles.LayoutSplit}>
      <div className={styles.MapSection}>
        <MapboxCanvas />
      </div>
      
      <div className={styles.ListSection}>
        <h2 className={styles.SectionTitle}>Action & Play</h2>
        
        {placesData.map(place => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
}