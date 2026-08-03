import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  MapPin,
  Search,
  Shuffle,
  Sparkles,
  Sun,
  Moon,
  Users,
  Wallet,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { PlaceCard } from '../shared/PlaceCard.jsx';
import { ExploreInsightsRail } from '../shared/ExploreInsightsRail.jsx';
import { PlaceCardSkeleton } from '../shared/Skeleton.jsx';
import { MapboxCanvas } from '../view/MapboxCanvas.jsx';
import { ExplorePageStyles as styles } from '@styles';
import { usePlaces } from '@library';
import { geocodeLocation } from '../../library/helpers/geocode.js';
import { useApp } from '../../library/contexts/AppContext.js';

const CATEGORIES = [
  { id: 'all', label: 'Everything' },
  { id: 'nature', label: 'Nature' },
  { id: 'eats', label: 'Eats' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'action', label: 'Action & Play' },
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
  const [focusedId, setFocusedId] = useState(null);
  const [mapFocus, setMapFocus] = useState(null);

  const { places, total, isEmpty, loading, source } = usePlaces({
    category: urlFilters.category,
    query: urlFilters.query,
    budget: urlFilters.budget,
    sort: urlFilters.sort,
    openNowOnly: urlFilters.open,
    userLocation,
  });

  const updateParams = useCallback(
    (patch) => {
      const params = new URLSearchParams(location.search);
      Object.entries(patch).forEach(([key, value]) => {
        if (!value || value === 'all' || (key === 'sort' && value === 'rating')) {
          params.delete(key === 'query' ? 'q' : key);
        } else {
          params.set(key === 'query' ? 'q' : key, value);
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

  const categoryLabel =
    CATEGORIES.find((c) => c.id === urlFilters.category)?.label || 'Everything';


  useEffect(() => {
    setFocusedId(null);
  }, [urlFilters.category, urlFilters.query, urlFilters.budget, urlFilters.open]);


  // Geocode search query → drive the MAP section only (not Today's pick)
  useEffect(() => {
    const q = urlFilters.query;
    if (!q || q.length < 2) {
      setMapFocus(null);
      return undefined;
    }
    let cancelled = false;

    const placeHit = (places || []).find((p) => {
      const blob = `${p.title || ''} ${p.location || ''} ${p.town || ''} ${p.county || ''}`.toLowerCase();
      return blob.includes(q.toLowerCase());
    });
    if (
      placeHit &&
      Number.isFinite(Number(placeHit.latitude ?? placeHit.lat)) &&
      Number.isFinite(Number(placeHit.longitude ?? placeHit.lng))
    ) {
      setMapFocus({
        lng: Number(placeHit.longitude ?? placeHit.lng),
        lat: Number(placeHit.latitude ?? placeHit.lat),
        label: placeHit.title || placeHit.location || q,
        zoom: 13.5,
      });
      return undefined;
    }

    geocodeLocation(q).then((hit) => {
      if (cancelled) return;
      if (hit) {
        setMapFocus({
          lng: hit.lng,
          lat: hit.lat,
          label: hit.label || q,
          zoom: 13.2,
        });
      } else {
        setMapFocus(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [urlFilters.query, places]);

  const focusPlace = useMemo(() => {

    if (!places?.length) return null;
    if (focusedId) {
      const hit = places.find(
        (p) => String(p.place_id ?? p.id) === String(focusedId)
      );
      if (hit) return hit;
    }
    return places[0];
  }, [places, focusedId]);

  return (
    <main className={styles.LayoutSplit}>
      <aside className={styles.ListSection} aria-label="Explore results">
        <header className={styles.ListHeader}>
          <div>
            <h1 className={styles.SectionTitle}>Explore {categoryLabel}</h1>
            <p className={styles.SectionSubtitle}>
              {urlFilters.query
                ? `Results for “${urlFilters.query}”`
                : 'Handpicked spots with budgets, parking & vibe built in'}
            </p>
          </div>
        </header>

        <div className={styles.DiscoveryStrip} role="group" aria-label="Quick discovery">
          <span className={styles.DiscoveryLabel}>Not sure where to start?</span>
          <button
            type="button"
            className={styles.DiscoverChip}
            onClick={() => {
              if (!places?.length) return;
              const pick = places[Math.floor(Math.random() * places.length)];
              const id = pick.place_id || pick.id;
              if (id) navigate(`/place/${id}`);
            }}
          >
            <Shuffle size={16} aria-hidden="true" /> Surprise me
          </button>
          <button type="button" className={styles.DiscoverChip} onClick={() => updateParams({ category: 'nature', budget: 'all' })}>
            <Sun size={16} aria-hidden="true" /> Fresh air
          </button>
          <button type="button" className={styles.DiscoverChip} onClick={() => updateParams({ category: 'eats', budget: 'mid' })}>
            <Wallet size={16} aria-hidden="true" /> Mid-range meal
          </button>
          <button type="button" className={styles.DiscoverChip} onClick={() => updateParams({ category: 'nightlife', open: '1' })}>
            <Moon size={16} aria-hidden="true" /> Evening
          </button>
          <button type="button" className={styles.DiscoverChip} onClick={() => updateParams({ category: 'action', budget: 'all' })}>
            <Users size={16} aria-hidden="true" /> With friends
          </button>
          <button type="button" className={styles.DiscoverChip} onClick={() => updateParams({ budget: 'under1500', category: 'all' })}>
            <Sparkles size={16} aria-hidden="true" /> Under 1.5k
          </button>
        </div>

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
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={
                  urlFilters.category === cat.id ? styles.PillActive : styles.Pill
                }
                onClick={() => updateParams({ category: cat.id })}
                aria-pressed={urlFilters.category === cat.id}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.FilterBlock}>
          <div className={styles.FilterLabel}>Budget</div>
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
          <span className={styles.ResultsMeta} aria-live="polite" aria-live="polite">
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

          {!loading && !isEmpty &&
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
            </section>
          )}
        </div>
      </aside>

      <div className={styles.RightStack}>
        <section className={styles.MapPane} aria-label="Map">
          <MapboxCanvas places={places} focus={mapFocus} focusLabel={mapFocus?.label} />
        </section>
        <ExploreInsightsRail
          places={places}
          categoryLabel={categoryLabel}
          pick={focusPlace}
          onSelectPick={setFocusedId}
        />
      </div>
    </main>
  );
}