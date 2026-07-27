import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MapboxCanvas } from '../view/MapboxCanvas.jsx';
import { PlaceCard } from '../shared/PlaceCard.jsx';
import { ExplorePageStyles as styles } from '@styles';

const PLACES = [
  {
    id: 1,
    title: 'Karura Forest Reserve',
    category: 'nature',
    location: 'Limuru Road',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1518182170546-076616fdacaf?q=80&w=600',
  },
  {
    id: 2,
    title: "CJ's Village Market",
    category: 'eats',
    location: 'Gigiri',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600',
  },
  {
    id: 3,
    title: 'Alchemist Bar',
    category: 'nightlife',
    location: 'Westlands',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600',
  },
  {
    id: 4,
    title: 'Two Rivers Theme Park',
    category: 'action',
    location: 'Ruaka',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1583120194098-b8ce7711df77?q=80&w=600',
  },
];

const CATEGORY_LABELS = {
  all: 'Everything',
  nature: 'Nature',
  eats: 'Eats',
  nightlife: 'Nightlife',
  action: 'Action & Play',
  events: 'Events',
};

export function ExplorePage() {
  const location = useLocation();

  const categoryFilter = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return (searchParams.get('category') || 'all').toLowerCase();
  }, [location.search]);

  const displayedPlaces = useMemo(() => {
    if (categoryFilter === 'all') return PLACES;
    return PLACES.filter((place) => place.category.toLowerCase() === categoryFilter);
  }, [categoryFilter]);

  const formattedTitle = CATEGORY_LABELS[categoryFilter] || CATEGORY_LABELS.all;

  return (
    <main className={styles.LayoutSplit}>
      <aside className={styles.ListSection} aria-label="Explore results">
        <div>
          <h2 className={styles.SectionTitle}>Explore {formattedTitle}</h2>
          <p className={styles.SectionSubtitle}>
            Discover curated spots near you with a calm, premium browsing experience.
          </p>
        </div>

        <div className={styles.ResultsMeta} aria-live="polite">
          {displayedPlaces.length} {displayedPlaces.length === 1 ? 'spot' : 'spots'} found
        </div>

        <div className={styles.PlaceStack}>
          {displayedPlaces.length > 0 ? (
            displayedPlaces.map((place) => <PlaceCard key={place.id} place={place} />)
          ) : (
            <section className={styles.EmptyState} aria-live="polite">
              <h3 className={styles.EmptyStateTitle}>No spots found for “{categoryFilter}”.</h3>
              <p className={styles.EmptyStateText}>
                Try a different category or return to all places to continue discovering.
              </p>
              <a className={styles.EmptyStateAction} href="/explore?category=all">
                View everything
              </a>
            </section>
          )}
        </div>
      </aside>

      <section className={styles.MapSection} aria-label="Map view">
        <div className={styles.MapCanvas}>
          <MapboxCanvas />
        </div>
      </section>
    </main>
  );
}