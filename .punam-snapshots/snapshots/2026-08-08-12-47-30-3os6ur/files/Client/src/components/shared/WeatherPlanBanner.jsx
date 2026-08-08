import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CloudRain, ArrowRight } from 'lucide-react';
import { useWeather } from '../../library/hooks/useWeather.js';
import {
  isHighRainRisk,
  isOutdoorCategory,
  pickIndoorAlternatives,
  planBMessage,
} from '../../library/helpers/planB.js';
import { placesData } from '../../library/json/placesData.js';
import { useApp } from '../../library/contexts/AppContext.js';
import styles from '../../styles/components/shared/WeatherPlanBanner.module.css';

/**
 * On the plan tab: if any outdoor stop + high rain → surface indoor Plan B.
 */
export function WeatherPlanBanner({ planStops = [] }) {
  const { addToPlan, pushToast } = useApp();
  const outdoor = useMemo(
    () => planStops.filter((p) => isOutdoorCategory(p.category)),
    [planStops]
  );
  const anchor = outdoor[0] || planStops[0];
  const loc = anchor?.location || anchor?.town || 'Nairobi';
  const weather = useWeather(loc);

  const show = outdoor.length > 0 && isHighRainRisk(weather) && !weather.loading;
  const alts = useMemo(() => {
    if (!show) return [];
    return pickIndoorAlternatives(anchor || {}, placesData, 3).filter(
      (p) => !planStops.some((s) => String(s.id) === String(p.place_id ?? p.id))
    );
  }, [show, anchor, planStops]);

  if (!show) return null;

  return (
    <aside className={styles.Banner} role="status">
      <div className={styles.Head}>
        <CloudRain size={18} />
        <strong>Weather may soak your plan</strong>
      </div>
      <p className={styles.Body}>
        {planBMessage(weather)} near {loc}. Outdoor stops:{' '}
        {outdoor.map((p) => p.title).join(', ')}. Swap in an indoor option:
      </p>
      <ul className={styles.List}>
        {alts.map((p) => (
          <li key={p.place_id || p.id}>
            <Link to={`/place/${p.place_id || p.id}`}>{p.title || p.name}</Link>
            <button
              type="button"
              onClick={() => {
                addToPlan?.(p);
                pushToast?.(`Added ${p.title} as Plan B`, 'success');
              }}
            >
              Add <ArrowRight size={12} />
            </button>
          </li>
        ))}
        {alts.length === 0 && (
          <li>
            <Link to="/explore?category=eats">Browse indoor eats</Link>
          </li>
        )}
      </ul>
    </aside>
  );
}
