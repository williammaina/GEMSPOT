import { useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  Coffee,
  Leaf,
  MapPin,
  Music2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trees,
  X,
  Zap,
} from 'lucide-react';
import { MapboxCanvas } from '../view/MapboxCanvas.jsx';
import { PlaceCard } from '../shared/PlaceCard.jsx';
import { PlaceCardSkeleton } from '../shared/Skeleton.jsx';
import { ExplorePageStyles as styles } from '@styles';
import { usePlaces } from '@library';
import { useApp } from '../../library/contexts/AppContext.js';

const CATEGORIES = [
  { id: 'all', label: 'Everything', icon: Sparkles },
  { id: 'nature', label: 'Nature', icon: Trees },
  { id: 'eats', label: 'Eats', icon: Coffee },
  { id: 'nightlife', label: 'Nightlife', icon: Music2 },
  { id: 'action', label: 'Action & Play', icon: Zap },
];

const BUDGETS = [
  { id: 'all', label: 'Any budget' },
  { id: 'under1500', label: 'Under 1,500' },
  { id: 'mid', label: '1,500–3,000' },
  { id: 'premium', label: '3,000–6,000' },
  { id: 'luxury', label: 'Premium' },
];

const SORTS = [
  { id: 'rating', label: 'Top rated' },
  { id: 'price-asc', label: 'Price ↑' },
  { id: 'price-desc', label: 'Price ↓' },
  { id: 'name', label: 'Name A–Z' },
  { id: 'distance', label: 'Nearest' },
];

const CATEGORY_HERO = {
  all: {
    eyebrow: 'Curated Kenya',
    title: 'Explore places',
    sub: 'Handpicked spots with budgets, parking, matatu hints & vibe built in.',
    tips: ['Open now', 'Under KES 1,500', 'Date night', 'Family'],
  },
  nature: {
    eyebrow: 'Green escapes',
    title: 'Nature near you',
    sub: 'Forests, ridges, tea walks, and open-air calm — with trail tips and matatu stages.',
    tips: ['Karura', 'Ngong Hills', 'Tigoni', 'Morning run'],
  },
  eats: {
    eyebrow: 'Tables & stalls',
    title: 'Eats worth the trip',
    sub: 'From street nyama to fine dining — damage for two, M-Pesa, and parking called out.',
    tips: ['Brunch', 'Date night', 'Street food', 'Under 2k'],
  },
  nightlife: {
    eyebrow: 'After dark',
    title: 'Nightlife',
    sub: 'Rooftops, live sets, and lounges — know the cover, the vibe, and how you get home.',
    tips: ['Live music', 'Rooftop', 'Cocktails', 'Late night'],
  },
  action: {
    eyebrow: 'Move more',
    title: 'Action & play',
    sub: 'Karting, rinks, climbs, and weekend energy — family-friendly and adrenaline-ready.',
    tips: ['Indoor', 'Family', 'Weekend', 'Groups'],
  },
};

export function ExplorePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addRecentSearch, userLocation } = useApp();

  const urlFilters = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      category: (params.get('category') || 'all').toLowerCase(),
      query: (params.get('q') || '').trim(),
      budget: (params.get('budget') || 'all').toLowerCase(),
      sort: (params.get('sort') || 'rating').toLowerCase(),
      open: params.get('open') === '1',
    };
  }, [location.search]);

  const [localQuery, setLocalQuery] = useState(urlFilters.query);

  const { places, total, isEmpty, loading, source } = usePlaces({
    category: urlFilters.category,
    query: urlFilters.query,
    budget: urlFilters.budget,
    sort: urlFilters.sort,
    openNowOnly: urlFilters.open,
    userLocation,
  });

  const hero = CATEGORY_HERO[urlFilters.category] || CATEGORY_HERO.all;

  const updateParams = useCallback(
    (patch) => {
      const params = new URLSearchParams(location.search);
      Object.entries(patch).forEach(([key, value]) => {
        if (!value || value === 'all' || (key === 'sort' && value === 'rating') || (key === 'open' && !value)) {
          params.delete(key === 'query' ? 'q' : key);
        } else {
          params.set(key === 'query' ? 'q' : key, value === true ? '1' : value);
        }
      });
      const qs = params.toString();
      navigate(qs ? `/explore?${qs}` : '/explore', { replace: true });
    },
    [location.search, navigate]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = localQuery.trim();
    if (q) addRecentSearch?.(q);
    updateParams({ query: q });
  };

  const clearAll = () => {
    setLocalQuery('');
    navigate('/explore');
  };

  const hasActiveFilters =
    urlFilters.category !== 'all' ||
    urlFilters.query ||
    urlFilters.budget !== 'all' ||
    urlFilters.sort !== 'rating' ||
    urlFilters.open;

  return (
    <main className={styles.LayoutSplit}>
      <aside className={styles.ListSection} aria-label="Explore results">
        {/* Category-specific hero */}
        <header className={styles.CatHero} data-cat={urlFilters.category}>
          <p className={styles.CatEyebrow}>
            <Leaf size={13} /> {hero.eyebrow}
          </p>
          <h1 className={styles.SectionTitle}>{hero.title}</h1>
          <p className={styles.SectionSubtitle}>
            {urlFilters.query ? `Results for “${urlFilters.query}”` : hero.sub}
          </p>
          {!urlFilters.query && (
            <div className={styles.TipRow}>
              {hero.tips.map((tip) => (
                <button
                  key={tip}
                  type="button"
                  className={styles.TipChip}
                  onClick={() => {
                    setLocalQuery(tip);
                    updateParams({ query: tip });
                    addRecentSearch?.(tip);
                  }}
                >
                  {tip}
                </button>
              ))}
            </div>
          )}
        </header>

        <form className={styles.SearchRow} onSubmit={handleSearchSubmit} role="search">
          <Search size={16} className={styles.SearchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.SearchField}
            placeholder="Search places, vibes, areas…"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            aria-label="Search places"
          />
          {localQuery && (
            <button
              type="button"
              className={styles.ClearBtn}
              onClick={() => {
                setLocalQuery('');
                updateParams({ query: '' });
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <div className={styles.FilterBlock}>
          <div className={styles.FilterLabel}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Category
          </div>
          <div className={styles.PillRow} role="group" aria-label="Category filters">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={
                    urlFilters.category === cat.id ? styles.PillActive : styles.Pill
                  }
                  onClick={() => updateParams({ category: cat.id })}
                  aria-pressed={urlFilters.category === cat.id}
                >
                  <Icon size={13} aria-hidden="true" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.FilterBlock}>
          <div className={styles.FilterLabel}>Budget (for two)</div>
          <div className={styles.PillRow} role="group" aria-label="Budget filters">
            {BUDGETS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={
                  urlFilters.budget === b.id ? styles.PillActive : styles.Pill
                }
                onClick={() => updateParams({ budget: b.id })}
                aria-pressed={urlFilters.budget === b.id}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.MetaRow}>
          <button
            type="button"
            className={urlFilters.open ? styles.PillActive : styles.Pill}
            onClick={() => updateParams({ open: urlFilters.open ? '' : '1' })}
            aria-pressed={urlFilters.open}
          >
            Open now
          </button>
          <span className={styles.ResultsMeta} aria-live="polite">
            <MapPin size={13} aria-hidden="true" />
            {loading ? 'Loading…' : `${total} ${total === 1 ? 'spot' : 'spots'}`}
            {source === 'api' && !loading ? ' · live' : ''}
          </span>

          <div className={styles.SortWrap}>
            <ArrowUpDown size={13} aria-hidden="true" />
            <select
              className={styles.SortSelect}
              value={urlFilters.sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              aria-label="Sort results"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button type="button" className={styles.ResetBtn} onClick={clearAll}>
              Reset
            </button>
          )}
        </div>

        <div className={styles.PlaceStack}>
          {loading &&
            Array.from({ length: 6 }).map((_, i) => <PlaceCardSkeleton key={`sk-${i}`} />)}

          {!loading &&
            !isEmpty &&
            places.map((place) => (
              <PlaceCard
                key={place.place_id ?? place.id}
                place={place}
                to={`/place/${place.place_id ?? place.id}`}
              />
            ))}

          {!loading && isEmpty && (
            <section className={styles.EmptyState} aria-live="polite">
              <h3 className={styles.EmptyStateTitle}>No spots match these filters</h3>
              <p className={styles.EmptyStateText}>
                Try a broader category, clear the search, or reset budget filters.
              </p>
              <button type="button" className={styles.EmptyStateAction} onClick={clearAll}>
                View everything
              </button>
              <div className={styles.EmptyLinks}>
                <Link to="/explore?category=eats">Eats</Link>
                <Link to="/explore?category=nature">Nature</Link>
                <Link to="/events">Events</Link>
              </div>
            </section>
          )}
        </div>
      </aside>

      <section className={styles.MapSection} aria-label="Map view">
        <div className={styles.MapCanvas}>
          <MapboxCanvas places={places} />
        </div>
      </section>
    </main>
  );
}
