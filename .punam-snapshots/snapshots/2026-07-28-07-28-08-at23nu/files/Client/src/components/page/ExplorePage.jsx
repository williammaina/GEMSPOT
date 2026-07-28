import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapboxCanvas } from '../view/MapboxCanvas.jsx';
import { PlaceCard } from '../shared/PlaceCard.jsx';
import { ExplorePageStyles as styles } from '@styles';
import { placesData } from '@library';

const CATEGORY_LABELS = {
  all: 'Everything',
  nature: 'Nature',
  eats: 'Eats',
  nightlife: 'Nightlife',
  action: 'Action & Play',
  events: 'Events',
};

const BUDGET_LABELS = {
  under1500: 'Under KES 1,500',
  mid: 'KES 1,500–3,000',
  premium: 'KES 3,000–6,000',
  luxury: 'Premium Experiences',
};

export function ExplorePage() {
  const location = useLocation();

  const filters = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return {
      category: (searchParams.get('category') || 'all').toLowerCase(),
      query: (searchParams.get('q') || '').trim().toLowerCase(),
      budget: (searchParams.get('budget') || 'all').toLowerCase(),
    };
  }, [location.search]);

  const displayedPlaces = useMemo(() => {
    const normalized = placesData.filter((place) => {
      const title = (place.title || place.name || '').toLowerCase();
      const locationName = (place.location || '').toLowerCase();
      const category = (place.category || '').toLowerCase();
      const description = (place.description || '').toLowerCase();
      const vibes = Array.isArray(place.vibes) ? place.vibes.join(' ').toLowerCase() : '';
      const amenities = Array.isArray(place.amenities) ? place.amenities.join(' ').toLowerCase() : '';
      const searchBlob = [title, locationName, category, description, vibes, amenities].join(' ');

      const categoryMatches = filters.category === 'all' || category === filters.category;
      const queryMatches = !filters.query || searchBlob.includes(filters.query);
      const budgetMatches = filters.budget === 'all' || (place.budgetTier || '').toLowerCase() === filters.budget;

      return categoryMatches && queryMatches && budgetMatches;
    });

    return normalized.sort((a, b) => {
      const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      if (featuredDelta !== 0) return featuredDelta;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
  }, [filters]);

  const formattedTitle = CATEGORY_LABELS[filters.category] || CATEGORY_LABELS.all;
  const searchSummary = filters.query ? `Search results for “${filters.query}”` : 'Curated local recommendations';
  const budgetSummary = filters.budget !== 'all' ? BUDGET_LABELS[filters.budget] : null;

  return (
    <main className={styles.LayoutSplit}>
      <aside className={styles.ListSection} aria-label="Explore results">
        <div>
          <h2 className={styles.SectionTitle}>Explore {formattedTitle}</h2>
          <p className={styles.SectionSubtitle}>{searchSummary}</p>
          {budgetSummary && <p className={styles.SectionSubtitle}>{budgetSummary}</p>}
        </div>

        <div className={styles.ResultsMeta} aria-live="polite">
          {displayedPlaces.length} {displayedPlaces.length === 1 ? 'spot' : 'spots'} found
        </div>

        <div className={styles.PlaceStack}>
          {displayedPlaces.length > 0 ? (
            displayedPlaces.map((place) => (
              <PlaceCard
                key={place.slug || place.id}
                place={place}
                to={`/place/${place.slug || place.id}`}
              />
            ))
          ) : (
            <section className={styles.EmptyState} aria-live="polite">
              <h3 className={styles.EmptyStateTitle}>No spots found for your current filters.</h3>
              <p className={styles.EmptyStateText}>
                Try a different category, a broader search term, or return to the full discovery feed.
              </p>
              <Link className={styles.EmptyStateAction} to="/explore?category=all">
                View everything
              </Link>
            </section>
          )}
        </div>
      </aside>

      <section className={styles.MapSection} aria-label="Map view">
        <div className={styles.MapCanvas}>
          <MapboxCanvas places={displayedPlaces} />
        </div>
      </section>
    </main>
  );
}
