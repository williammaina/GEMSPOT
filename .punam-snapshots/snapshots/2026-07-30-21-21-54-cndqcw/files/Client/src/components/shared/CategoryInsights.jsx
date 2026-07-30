import {
  Backpack,
  Clock,
  Coffee,
  Footprints,
  GlassWater,
  Mountain,
  Music2,
  Shirt,
  Sparkles,
  Sun,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import { CategoryInsightsStyles as styles } from '@styles';

/**
 * Category-aware depth for place detail:
 * - nature / action → activities, requirements, what to bring
 * - eats → menu highlights, cuisine, dietary
 * - nightlife → drinks, music vibe, dress code, peak hours
 */
export function CategoryInsights({ place }) {
  if (!place) return null;
  const cat = String(place.category || '').toLowerCase();

  if (cat === 'nature' || cat === 'action') {
    return <OutdoorsBlock place={place} isAction={cat === 'action'} />;
  }
  if (cat === 'eats') {
    return <EatsBlock place={place} />;
  }
  if (cat === 'nightlife') {
    return <NightlifeBlock place={place} />;
  }
  return null;
}

function OutdoorsBlock({ place, isAction }) {
  const activities = place.activities || [];
  const requirements = place.requirements || [];
  const bring = place.whatToBring || [];
  if (!activities.length && !requirements.length && !bring.length) return null;

  return (
    <section className={styles.Root} data-variant={isAction ? 'action' : 'nature'}>
      <header className={styles.Header}>
        <span className={styles.IconShell} aria-hidden="true">
          {isAction ? <Zap size={18} /> : <Mountain size={18} />}
        </span>
        <div>
          <h2 className={styles.Title}>
            {isAction ? 'What you can do' : 'Trails & activities'}
          </h2>
          <p className={styles.Sub}>
            {[place.difficulty, place.duration, place.bestTime]
              .filter(Boolean)
              .join(' · ') || 'Plan the outing with the right kit'}
          </p>
        </div>
      </header>

      {activities.length > 0 && (
        <div className={styles.ActivityGrid}>
          {activities.map((a, i) => (
            <article
              key={a.name || i}
              className={styles.ActivityCard}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={styles.ActivityTop}>
                <Footprints size={15} />
                <strong>{a.name}</strong>
              </div>
              <div className={styles.ActivityMeta}>
                {a.duration && (
                  <span>
                    <Clock size={12} /> {a.duration}
                  </span>
                )}
                {a.intensity && <span className={styles.Intensity}>{a.intensity}</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      {requirements.length > 0 && (
        <div className={styles.Block}>
          <h3 className={styles.BlockTitle}>
            <Shirt size={15} /> Requirements & dress
          </h3>
          <ul className={styles.ReqList}>
            {requirements.map((r, i) => (
              <li key={r.label || i} style={{ animationDelay: `${i * 50}ms` }}>
                <strong>{r.label}</strong>
                {r.detail && <span>{r.detail}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {bring.length > 0 && (
        <div className={styles.Block}>
          <h3 className={styles.BlockTitle}>
            <Backpack size={15} /> What to bring
          </h3>
          <div className={styles.ChipRow}>
            {bring.map((item) => (
              <span key={item} className={styles.Chip}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {(place.bestTime || place.difficulty) && (
        <div className={styles.TipBar}>
          <Sun size={15} />
          <span>
            {place.bestTime
              ? `Best time: ${place.bestTime}`
              : `Difficulty: ${place.difficulty}`}
          </span>
        </div>
      )}
    </section>
  );
}

function EatsBlock({ place }) {
  const menu = place.menuHighlights || [];
  if (!menu.length && !place.cuisine && !place.signatureDish) return null;

  return (
    <section className={styles.Root} data-variant="eats">
      <header className={styles.Header}>
        <span className={styles.IconShell} aria-hidden="true">
          <UtensilsCrossed size={18} />
        </span>
        <div>
          <h2 className={styles.Title}>Menu highlights</h2>
          <p className={styles.Sub}>
            {[place.cuisine, place.signatureDish ? `Signature: ${place.signatureDish}` : null]
              .filter(Boolean)
              .join(' · ') || 'What regulars order'}
          </p>
        </div>
      </header>

      {menu.length > 0 && (
        <ul className={styles.MenuList}>
          {menu.map((item, i) => (
            <li
              key={item.name || i}
              className={styles.MenuRow}
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <div className={styles.MenuMain}>
                <Coffee size={14} className={styles.MenuIcon} />
                <div>
                  <strong>{item.name}</strong>
                  {item.note && <span className={styles.MenuNote}>{item.note}</span>}
                </div>
              </div>
              {item.price && <span className={styles.MenuPrice}>{item.price}</span>}
            </li>
          ))}
        </ul>
      )}

      {(place.dietary || []).length > 0 && (
        <div className={styles.ChipRow}>
          {place.dietary.map((d) => (
            <span key={d} className={styles.ChipSoft}>
              {d}
            </span>
          ))}
        </div>
      )}

      {place.dressCode && (
        <div className={styles.TipBar}>
          <Shirt size={15} />
          <span>Dress code: {place.dressCode}</span>
        </div>
      )}
    </section>
  );
}

function NightlifeBlock({ place }) {
  const drinks = place.signatureDrinks || [];
  if (
    !drinks.length &&
    !place.musicVibe &&
    !place.dressCode &&
    !place.peakHours
  ) {
    return null;
  }

  return (
    <section className={styles.Root} data-variant="nightlife">
      <header className={styles.Header}>
        <span className={styles.IconShell} aria-hidden="true">
          <Music2 size={18} />
        </span>
        <div>
          <h2 className={styles.Title}>Vibe & drinks</h2>
          <p className={styles.Sub}>
            {place.musicVibe || 'What the room feels like after dark'}
          </p>
        </div>
      </header>

      {(place.peakHours || place.coverCharge) && (
        <div className={styles.MetaPills}>
          {place.peakHours && (
            <span className={styles.MetaPill}>
              <Clock size={13} /> Peak {place.peakHours}
            </span>
          )}
          {place.coverCharge && (
            <span className={styles.MetaPill}>
              <Sparkles size={13} /> {place.coverCharge}
            </span>
          )}
        </div>
      )}

      {drinks.length > 0 && (
        <div className={styles.Block}>
          <h3 className={styles.BlockTitle}>
            <GlassWater size={15} /> Signature drinks
          </h3>
          <ul className={styles.MenuList}>
            {drinks.map((d, i) => (
              <li
                key={d.name || i}
                className={styles.MenuRow}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <div className={styles.MenuMain}>
                  <GlassWater size={14} className={styles.MenuIcon} />
                  <div>
                    <strong>{d.name}</strong>
                    {d.note && <span className={styles.MenuNote}>{d.note}</span>}
                  </div>
                </div>
                {d.price && <span className={styles.MenuPrice}>{d.price}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {place.dressCode && (
        <div className={styles.TipBar}>
          <Shirt size={15} />
          <span>Dress code: {place.dressCode}</span>
        </div>
      )}
    </section>
  );
}
