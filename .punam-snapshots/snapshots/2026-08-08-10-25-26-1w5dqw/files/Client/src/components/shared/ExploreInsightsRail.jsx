import { Link } from 'react-router-dom';
import {
  Banknote,
  Bus,
  MapPin,
  Sparkles,
  Star,
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
  else if (price != null && price >= 6000) bits.push('premium pick for a special outing');
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

/**
 * Right-rail: Today's pick + alternate options only.
 */
export function ExploreInsightsRail({
  places = [],
  categoryLabel = 'Everything',
  pick,
  onSelectPick,
}) {
  const { addToPlan, isInPlan, removeFromPlan } = useApp();
  const featured = pick || places[0] || null;
  const featuredId = featured ? String(featured.place_id ?? featured.id) : null;
  const inPlan = featuredId ? isInPlan?.(featuredId) : false;

  return (
    <aside className={styles.MapSection} aria-label="Today's pick">
      <div className={styles.InsightsRail}>
        <section className={styles.PickCard} aria-labelledby="todays-pick-title">
          <div className={styles.PickHeader}>
            <span className={styles.PickEyebrow}>
              <Sparkles size={14} aria-hidden="true" />
              Today&apos;s pick
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
                  src={featured.image || featured.featured_image || featured.banner || ""}
                  alt=""
                  className={styles.PickImg}
                  loading="lazy"
                />
                <div className={styles.PickOverlay}>
                  <span className={styles.PickCat}>
                    {(featured.category || 'spot').toString().toUpperCase()}
                  </span>
                  <h2 id="todays-pick-title" className={styles.PickName}>
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
                  {inPlan ? 'In your plan' : 'Add to your plan'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.PickEmpty}>
              <p>No spots in this filter yet. Widen the search or clear filters.</p>
            </div>
          )}
        </section>

        {places.length > 1 && (
          <section className={styles.AltPicks} aria-label="Other strong options">
            <p className={styles.AltLabel}>Switch pick</p>
            <ul className={styles.AltList}>
              {places.slice(0, 6).map((place) => {
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
                      <img src={place.image || place.featured_image || ""} alt="" loading="lazy" />
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
