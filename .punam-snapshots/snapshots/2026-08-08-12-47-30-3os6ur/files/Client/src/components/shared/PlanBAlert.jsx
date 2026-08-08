import { Link } from 'react-router-dom';
import { AlertTriangle, CloudRain, ArrowRight } from 'lucide-react';
import { PlanBAlertStyles as styles } from '@styles';

/**
 * Weather-aware Plan B panel.
 * @param {object[]} alternatives — full place objects (preferred)
 * @param {string[]} altSuggestions — legacy image URLs
 */
export function PlanBAlert({
  location = 'your area',
  condition = 'Unfavorable weather',
  alternatives = [],
  altSuggestions = [],
  onAddToPlan,
}) {
  const places = Array.isArray(alternatives) ? alternatives.filter(Boolean) : [];
  const images = Array.isArray(altSuggestions) ? altSuggestions : [];

  return (
    <aside className={styles.AlertContainer} role="region" aria-label="Plan B Weather Alert">
      <div className={styles.AlertHeader}>
        <CloudRain size={18} aria-hidden="true" />
        <span>Plan B · stay dry</span>
      </div>

      <p className={styles.AlertText}>
        <span className={styles.HighlightText}>{condition}</span> expected in{' '}
        <span className={styles.HighlightText}>{location || 'your area'}</span>. Here are indoor
        spots that still work:
      </p>

      {places.length > 0 ? (
        <ul className={styles.AltList}>
          {places.map((p) => {
            const id = p.place_id ?? p.id;
            return (
              <li key={id} className={styles.AltItem}>
                <Link to={`/place/${id}`} className={styles.AltLink}>
                  {p.image && (
                    <img src={p.image} alt="" className={styles.AltThumb} loading="lazy" />
                  )}
                  <div className={styles.AltMeta}>
                    <strong>{p.title || p.name}</strong>
                    <span>
                      {p.category}
                      {p.location ? ` · ${p.location}` : ''}
                    </span>
                  </div>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                {onAddToPlan && (
                  <button
                    type="button"
                    className={styles.AltPlanBtn}
                    onClick={() => onAddToPlan(p)}
                  >
                    Add to plan
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : images.length > 0 ? (
        <div className={styles.AlternativeImages} aria-label="Alternative spot previews">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Alternative ${idx + 1}`}
              className={styles.AltImage}
              loading="lazy"
            />
          ))}
        </div>
      ) : (
        <Link to="/explore?category=eats" className={styles.ExploreLink}>
          Browse indoor eats <ArrowRight size={14} />
        </Link>
      )}
    </aside>
  );
}
