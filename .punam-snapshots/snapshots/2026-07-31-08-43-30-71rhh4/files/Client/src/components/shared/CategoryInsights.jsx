import {
  Backpack,
  Clock,
  Footprints,
  GlassWater,
  Music2,
  Shirt,
  Sparkles,
  Utensils,
  AlertTriangle,
  Mountain,
} from 'lucide-react';
import { formatKES } from '../../library/helpers/formatCurrency.js';
import styles from '../../styles/components/shared/CategoryInsights.module.css';

function intensityClass(level) {
  const l = String(level || '').toLowerCase();
  if (l.includes('hard')) return styles.IntensityHard;
  if (l.includes('moderate')) return styles.IntensityMod;
  return styles.IntensityEasy;
}

export function CategoryInsights({ place }) {
  if (!place) return null;
  const cat = String(place.category || '').toLowerCase();

  const hasNature =
    (cat === 'nature' || cat === 'action') &&
    (place.activities?.length || place.whatToBring?.length || place.requirements?.length);
  const hasEats = cat === 'eats' && place.menuHighlights?.length;
  const hasNight = cat === 'nightlife' && (place.signatureDrinks?.length || place.musicVibe);

  if (!hasNature && !hasEats && !hasNight) return null;

  return (
    <section className={styles.Panel} data-category={cat}>
      <header className={styles.Header}>
        <Sparkles size={16} />
        <h2>
          {hasNature && 'Activities & what to bring'}
          {hasEats && 'Menu highlights'}
          {hasNight && 'Vibe & drinks'}
        </h2>
      </header>

      {hasNature && (
        <div className={styles.Grid}>
          <div className={styles.MetaRow}>
            {place.difficulty && (
              <div className={styles.MetaChip}>
                <Mountain size={14} />
                <span>{place.difficulty}</span>
              </div>
            )}
            {place.bestTime && (
              <div className={styles.MetaChip}>
                <Clock size={14} />
                <span>{place.bestTime}</span>
              </div>
            )}
            {place.dressCode && (
              <div className={styles.MetaChip}>
                <Shirt size={14} />
                <span>{place.dressCode}</span>
              </div>
            )}
          </div>

          {Array.isArray(place.activities) && place.activities.length > 0 && (
            <div className={styles.Block}>
              <h3>
                <Footprints size={15} /> Activities
              </h3>
              <ul className={styles.ActivityList}>
                {place.activities.map((a) => (
                  <li key={a.name} className={styles.ActivityItem}>
                    <div>
                      <strong>{a.name}</strong>
                      {a.duration && <span className={styles.Muted}>{a.duration}</span>}
                    </div>
                    {a.intensity && (
                      <span className={intensityClass(a.intensity)}>{a.intensity}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(place.whatToBring) && place.whatToBring.length > 0 && (
            <div className={styles.Block}>
              <h3>
                <Backpack size={15} /> What to bring
              </h3>
              <ul className={styles.ChipList}>
                {place.whatToBring.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(place.requirements) && place.requirements.length > 0 && (
            <div className={styles.Block}>
              <h3>
                <AlertTriangle size={15} /> Requirements
              </h3>
              <ul className={styles.ReqList}>
                {place.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {hasEats && (
        <div className={styles.Grid}>
          {place.dressCode && (
            <div className={styles.MetaChip}>
              <Shirt size={14} />
              <span>{place.dressCode}</span>
            </div>
          )}
          {Array.isArray(place.dietary) && place.dietary.length > 0 && (
            <div className={styles.ChipListInline}>
              {place.dietary.map((d) => (
                <span key={d} className={styles.DietTag}>
                  {d}
                </span>
              ))}
            </div>
          )}
          <div className={styles.Block}>
            <h3>
              <Utensils size={15} /> Signature dishes
            </h3>
            <ul className={styles.MenuList}>
              {place.menuHighlights.map((m) => (
                <li key={m.name} className={styles.MenuRow}>
                  <div>
                    <strong>{m.name}</strong>
                    {m.note && <span className={styles.Muted}>{m.note}</span>}
                  </div>
                  {m.price != null && <span className={styles.Price}>{formatKES(m.price)}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {hasNight && (
        <div className={styles.Grid}>
          {place.musicVibe && (
            <div className={styles.VibeBanner}>
              <Music2 size={16} />
              <p>{place.musicVibe}</p>
            </div>
          )}
          <div className={styles.MetaRow}>
            {place.peakHours && (
              <div className={styles.MetaChip}>
                <Clock size={14} />
                <span>Peak: {place.peakHours}</span>
              </div>
            )}
            {place.coverCharge && (
              <div className={styles.MetaChip}>
                <span>Cover: {place.coverCharge}</span>
              </div>
            )}
            {place.dressCode && (
              <div className={styles.MetaChip}>
                <Shirt size={14} />
                <span>{place.dressCode}</span>
              </div>
            )}
          </div>
          {Array.isArray(place.signatureDrinks) && place.signatureDrinks.length > 0 && (
            <div className={styles.Block}>
              <h3>
                <GlassWater size={15} /> Signature drinks
              </h3>
              <ul className={styles.MenuList}>
                {place.signatureDrinks.map((d) => (
                  <li key={d.name} className={styles.MenuRow}>
                    <div>
                      <strong>{d.name}</strong>
                      {d.note && <span className={styles.Muted}>{d.note}</span>}
                    </div>
                    {d.price != null && <span className={styles.Price}>{formatKES(d.price)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Short teaser string for place cards */
export function getInsightTeaser(place) {
  if (!place) return null;
  const cat = String(place.category || '').toLowerCase();
  if ((cat === 'nature' || cat === 'action') && place.whatToBring?.[0]) {
    return place.whatToBring[0];
  }
  if ((cat === 'nature' || cat === 'action') && place.activities?.[0]?.name) {
    return place.activities[0].name;
  }
  if (cat === 'eats' && place.menuHighlights?.[0]?.name) {
    return place.menuHighlights[0].name;
  }
  if (cat === 'nightlife' && place.musicVibe) {
    return place.musicVibe.split('—')[0].split('-')[0].trim().slice(0, 42);
  }
  if (cat === 'nightlife' && place.signatureDrinks?.[0]?.name) {
    return place.signatureDrinks[0].name;
  }
  return null;
}
