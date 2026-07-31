import { Link } from 'react-router-dom';
import {
  Banknote,
  Bus,
  Clock,
  MapPin,
  Sparkles,
  Star,
  Wifi,
  Car,
  ArrowRight,
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

export function computeListInsights(places = []) {
  const list = Array.isArray(places) ? places : [];
  const prices = list.map(priceOf).filter((n) => n != null);
  const avg =
    prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

  let openCount = 0;
  let openKnown = 0;
  for (const p of list) {
    if (typeof p.openNow === 'boolean') {
      openKnown += 1;
      if (p.openNow) openCount += 1;
    } else if (p.hours) {
      const s = isOpenNow(p.hours);
      if (s !== null) {
        openKnown += 1;
        if (s) openCount += 1;
      }
    }
  }

  const matatuHints = {};
  for (const p of list) {
    const m = (p.matatu || p.matatu_route || '').trim();
    if (!m) continue;
    // keep short corridor label
    const key = m.split(/[;·|]/)[0].trim().slice(0, 48);
    if (key) matatuHints[key] = (matatuHints[key] || 0) + 1;
  }
  const topMatatus = Object.entries(matatuHints)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => ({ label, count }));

  const wifiCount = list.filter((p) => p.wifi).length;
  const parkingCount = list.filter((p) => p.parking).length;
  const rated = list.filter((p) => Number(p.rating) > 0);
  const avgRating =
    rated.length > 0
      ? rated.reduce((a, p) => a + Number(p.rating), 0) / rated.length
      : null;

  return {
    total: list.length,
    avgPrice: avg,
    openCount,
    openKnown,
    topMatatus,
    wifiCount,
    parkingCount,
    avgRating,
  };
}

/**
 * Right-rail: Tonight's pick + list insights for current Explore filters.
 */
export function ExploreInsightsRail({
  places = [],
  categoryLabel = 'Everything',
  pick,
  onSelectPick,
}) {
  const { addToPlan, isInPlan, removeFromPlan } = useApp();
  const insights = computeListInsights(places);
  const featured = pick || places[0] || null;
  const featuredId = featured ? String(featured.place_id ?? featured.id) : null;
  const inPlan = featuredId ? isInPlan?.(featuredId) : false;

  return (
    <aside className={styles.MapSection} aria-label="Tonight's pick and list insights">
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
                  <span className={styles.PickChipMuted} title={featured.matatu || featured.matatu_route}>
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

        {/* —— List insights —— */}
        <section className={styles.InsightsCard} aria-labelledby="list-insights-title">
          <h3 id="list-insights-title" className={styles.InsightsTitle}>
            List insights
          </h3>
          <p className={styles.InsightsSub}>
            Based on {insights.total} spot{insights.total === 1 ? '' : 's'} in this view
          </p>

          <ul className={styles.InsightGrid}>
            <li className={styles.InsightItem}>
              <span className={styles.InsightIcon} aria-hidden="true">
                <Banknote size={16} />
              </span>
              <div>
                <strong>{formatKes(insights.avgPrice)}</strong>
                <span>Avg for two</span>
              </div>
            </li>
            <li className={styles.InsightItem}>
              <span className={styles.InsightIcon} aria-hidden="true">
                <Clock size={16} />
              </span>
              <div>
                <strong>
                  {insights.openKnown > 0
                    ? `${insights.openCount} / ${insights.openKnown}`
                    : '—'}
                </strong>
                <span>Open now</span>
              </div>
            </li>
            <li className={styles.InsightItem}>
              <span className={styles.InsightIcon} aria-hidden="true">
                <Star size={16} />
              </span>
              <div>
                <strong>
                  {insights.avgRating != null ? insights.avgRating.toFixed(1) : '—'}
                </strong>
                <span>Avg rating</span>
              </div>
            </li>
            <li className={styles.InsightItem}>
              <span className={styles.InsightIcon} aria-hidden="true">
                <Wifi size={16} />
              </span>
              <div>
                <strong>{insights.wifiCount}</strong>
                <span>With Wi‑Fi</span>
              </div>
            </li>
            <li className={styles.InsightItem}>
              <span className={styles.InsightIcon} aria-hidden="true">
                <Car size={16} />
              </span>
              <div>
                <strong>{insights.parkingCount}</strong>
                <span>With parking</span>
              </div>
            </li>
          </ul>

          {insights.topMatatus.length > 0 && (
            <div className={styles.MatatuBlock}>
              <p className={styles.MatatuLabel}>
                <Bus size={14} aria-hidden="true" /> Common matatu routes
              </p>
              <ul className={styles.MatatuList}>
                {insights.topMatatus.map((m) => (
                  <li key={m.label}>
                    <span className={styles.MatatuRoute}>{m.label}</span>
                    <span className={styles.MatatuCount}>{m.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* —— Quick switcher for tonight's pick —— */}
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
