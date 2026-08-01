import { Link } from 'react-router-dom';
import {
  Banknote,
  Bus,
  MapPin,
  Sparkles,
  Star,
  Wifi,
  Car,
  ArrowRight,
  Clock,
  Leaf,
  Utensils,
  Music2,
  Zap,
} from 'lucide-react';
import { isOpenNow } from '../../library/helpers/openingHours.js';
import { ExplorePageStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

function priceOf(p) {
  const n = Number(p?.price ?? p?.damage_for_two ?? p?.damageForTwo);
  return Number.isFinite(n) ? n : null;
}

function formatKes(n) {
  if (n == null) return '—';
  return `KES ${Math.round(n).toLocaleString('en-KE')}`;
}

function whyGo(place, categoryLabel) {
  const bits = [];
  if (place?.rating && Number(place.rating) >= 4.5) bits.push('top-rated in this view');
  if (place?.openNow === true || (place?.hours && isOpenNow(place.hours) === true)) {
    bits.push('open right now');
  }
  const price = priceOf(place);
  if (price != null && price < 1500) bits.push('easy on the budget');
  else if (price != null && price >= 6000) bits.push('premium pick for a special night');
  if (place?.matatu || place?.matatu_route) bits.push('matatu-friendly');
  if (place?.wifi) bits.push('Wi‑Fi on site');
  if (place?.parking) bits.push('parking available');
  const vibe = (place?.vibes || place?.tags || [])[0];
  if (vibe) bits.push(`${vibe} energy`);

  if (!bits.length) {
    return `Handpicked ${categoryLabel.toLowerCase()} spot worth a look in ${place?.town || place?.location || 'Kenya'}.`;
  }
  return `Strong match because it’s ${bits.slice(0, 3).join(', ')}.`;
}

const QUICK_FILTERS = [
  { id: 'open', label: 'Open now', icon: Clock, patch: { open: '1' } },
  { id: 'under1500', label: 'Under 1.5k', icon: Banknote, patch: { budget: 'under1500' } },
  { id: 'nature', label: 'Nature', icon: Leaf, patch: { category: 'nature' } },
  { id: 'eats', label: 'Eats', icon: Utensils, patch: { category: 'eats' } },
  { id: 'nightlife', label: 'Nightlife', icon: Music2, patch: { category: 'nightlife' } },
  { id: 'action', label: 'Action', icon: Zap, patch: { category: 'action' } },
];

/**
 * Right-rail: Tonight's pick + actionable night-shaping tools (replaces weak list stats).
 */
export function ExploreInsightsRail({
  places = [],
  categoryLabel = 'Everything',
  pick,
  onSelectPick,
  activeFilters = {},
  onApplyFilter,
}) {
  const { addToPlan, isInPlan, removeFromPlan, planStops = [] } = useApp();
  const featured = pick || places[0] || null;
  const featuredId = featured ? String(featured.place_id ?? featured.id) : null;
  const inPlan = featuredId ? isInPlan?.(featuredId) : false;

  // Top towns in current results — useful for orienting
  const townCounts = {};
  for (const p of places) {
    const t = (p.town || (p.location || '').split(',')[0] || '').trim();
    if (!t) continue;
    townCounts[t] = (townCounts[t] || 0) + 1;
  }
  const topTowns = Object.entries(townCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Budget band for current list
  const prices = places.map(priceOf).filter((n) => n != null);
  const minP = prices.length ? Math.min(...prices) : null;
  const maxP = prices.length ? Math.max(...prices) : null;

  const isActive = (filterId) => {
    if (filterId === 'open') return activeFilters.open === true || activeFilters.open === '1';
    if (filterId === 'under1500') return activeFilters.budget === 'under1500';
    return activeFilters.category === filterId;
  };

  return (
    <aside className={styles.MapSection} aria-label="Tonight's pick and night tools">
      <div className={styles.InsightsRail}>
        {/* —— Tonight's pick —— */}
        <section className={styles.PickCard} aria-labelledby="tonights-pick-title">
          <div className={styles.PickHeader}>
            <span className={styles.PickEyebrow}>
              <Sparkles size={14} aria-hidden="true" />
              Tonight&apos;s pick
            </span>
            <span className={styles.PickContext}>{categoryLabel}</span>
          </div>

          {featured ? (
            <>
              <Link
                to={`/place/${featured.place_id ?? featured.id}`}
                className={styles.PickHero}
              >
                <img
                  src={featured.image}
                  alt=""
                  className={styles.PickImg}
                  loading="lazy"
                />
                <div className={styles.PickOverlay}>
                  <span className={styles.PickCat}>
                    {(featured.category || 'spot').toString().toUpperCase()}
                  </span>
                  <h2 id="tonights-pick-title" className={styles.PickName}>
                    {featured.title || featured.name}
                  </h2>
                  <p className={styles.PickLoc}>
                    <MapPin size={13} aria-hidden="true" />
                    {featured.location || featured.town || 'Kenya'}
                  </p>
                </div>
              </Link>

              <p className={styles.PickWhy}>{whyGo(featured, categoryLabel)}</p>

              <div className={styles.PickMeta}>
                {typeof featured.rating === 'number' && (
                  <span className={styles.PickChip}>
                    <Star size={13} fill="currentColor" aria-hidden="true" />
                    {featured.rating.toFixed(1)}
                  </span>
                )}
                {priceOf(featured) != null && (
                  <span className={styles.PickChip}>
                    <Banknote size={13} aria-hidden="true" />
                    {formatKes(priceOf(featured))}
                  </span>
                )}
                {(featured.matatu || featured.matatu_route) && (
                  <span
                    className={styles.PickChipMuted}
                    title={featured.matatu || featured.matatu_route}
                  >
                    <Bus size={13} aria-hidden="true" />
                    Matatu
                  </span>
                )}
              </div>

              <div className={styles.PickActions}>
                <Link
                  to={`/place/${featured.place_id ?? featured.id}`}
                  className={styles.PickCta}
                >
                  View place
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className={inPlan ? styles.PickPlanActive : styles.PickPlan}
                  onClick={() => {
                    if (inPlan) removeFromPlan?.(featuredId);
                    else addToPlan?.(featured);
                  }}
                >
                  {inPlan ? 'In tonight’s plan' : 'Add to tonight’s plan'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.PickEmpty}>
              <p>No spots in this filter yet. Widen the search or clear filters.</p>
            </div>
          )}
        </section>

        {/* —— Shape this night (actionable, replaces weak list insights) —— */}
        <section className={styles.InsightsCard} aria-labelledby="shape-night-title">
          <h3 id="shape-night-title" className={styles.InsightsTitle}>
            Shape this night
          </h3>
          <p className={styles.InsightsSub}>
            One tap to refine {places.length} spot{places.length === 1 ? '' : 's'} in view
            {minP != null && maxP != null
              ? ` · ${formatKes(minP)}–${formatKes(maxP)} for two`
              : ''}
          </p>

          <div className={styles.QuickFilterGrid} role="group" aria-label="Quick filters">
            {QUICK_FILTERS.map((f) => {
              const Icon = f.icon;
              const active = isActive(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={active ? styles.QuickFilterActive : styles.QuickFilter}
                  aria-pressed={active}
                  onClick={() => {
                    if (!onApplyFilter) return;
                    if (active) {
                      // toggle off
                      if (f.id === 'open') onApplyFilter({ open: '' });
                      else if (f.id === 'under1500') onApplyFilter({ budget: 'all' });
                      else onApplyFilter({ category: 'all' });
                    } else {
                      onApplyFilter(f.patch);
                    }
                  }}
                >
                  <Icon size={14} aria-hidden="true" />
                  {f.label}
                </button>
              );
            })}
          </div>

          {topTowns.length > 0 && (
            <div className={styles.MatatuBlock}>
              <p className={styles.MatatuLabel}>
                <MapPin size={14} aria-hidden="true" /> Hot neighbourhoods
              </p>
              <ul className={styles.MatatuList}>
                {topTowns.map(([town, count]) => (
                  <li key={town}>
                    <button
                      type="button"
                      className={styles.TownChipBtn}
                      onClick={() => onApplyFilter?.({ query: town })}
                    >
                      <span className={styles.MatatuRoute}>{town}</span>
                      <span className={styles.MatatuCount}>{count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(planStops) && planStops.length > 0 && (
            <div className={styles.PlanPreview}>
              <p className={styles.MatatuLabel}>
                <Sparkles size={14} aria-hidden="true" /> Your plan · {planStops.length}
              </p>
              <ul className={styles.PlanPreviewList}>
                {planStops.slice(0, 4).map((stop) => (
                  <li key={stop.id || stop.place_id}>
                    <Link to={`/place/${stop.place_id ?? stop.id}`}>
                      {stop.title || stop.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/plan" className={styles.PickCta} style={{ marginTop: 10 }}>
                Open full plan <ArrowRight size={14} />
              </Link>
            </div>
          )}

          <div className={styles.AmenityHints}>
            <span title="Spots with Wi‑Fi">
              <Wifi size={13} /> {places.filter((p) => p.wifi).length} Wi‑Fi
            </span>
            <span title="Spots with parking">
              <Car size={13} /> {places.filter((p) => p.parking).length} parking
            </span>
            <span title="Matatu-friendly">
              <Bus size={13} />{' '}
              {places.filter((p) => p.matatu || p.matatu_route).length} matatu
            </span>
          </div>
        </section>

        {/* —— Switch pick —— */}
        {places.length > 1 && (
          <section className={styles.AltPicks} aria-label="Other strong options">
            <p className={styles.AltLabel}>Switch pick</p>
            <ul className={styles.AltList}>
              {places.slice(0, 5).map((place) => {
                const id = String(place.place_id ?? place.id);
                const active = id === featuredId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={active ? styles.AltItemActive : styles.AltItem}
                      onClick={() => onSelectPick?.(id)}
                      aria-pressed={active}
                    >
                      <img src={place.image} alt="" loading="lazy" />
                      <span>
                        <strong>{place.title || place.name}</strong>
                        <small>{place.location || place.town}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
