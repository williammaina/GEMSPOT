import { Backpack, Bus, Clock, Shirt, Wallet } from 'lucide-react';
import styles from '../../styles/components/shared/KnowBeforeYouGo.module.css';

/**
 * Scannable pre-visit checklist — same order every place.
 */
export function KnowBeforeYouGo({ place }) {
  if (!place) return null;

  const items = [];
  const dress = place.dressCode || place.dress_code;
  const budget = place.price || place.damage_for_two;
  const matatu = place.matatu || place.matatu_route;
  const best = place.bestTime || place.best_time || place.peakHours || place.peak_hours;
  const gear = place.whatToBring || place.what_to_bring || place.requirements;
  const gearList = Array.isArray(gear) ? gear.filter(Boolean) : gear ? [gear] : [];

  if (dress) items.push({ icon: Shirt, label: 'Dress code', value: dress });
  if (budget != null && budget !== '')
    items.push({
      icon: Wallet,
      label: 'Budget for two',
      value: typeof budget === 'number' ? `~KSh ${Number(budget).toLocaleString()}` : String(budget),
    });
  if (matatu) items.push({ icon: Bus, label: 'Matatu / transit', value: matatu });
  if (best) items.push({ icon: Clock, label: 'Best time', value: best });
  if (gearList.length)
    items.push({
      icon: Backpack,
      label: 'Bring',
      value: gearList.slice(0, 4).join(' · '),
    });

  if (!items.length) return null;

  return (
    <section className={styles.Shell} aria-label="Know before you go">
      <h2 className={styles.Title}>Know before you go</h2>
      <ul className={styles.List}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className={styles.Item}>
              <span className={styles.IconWrap} aria-hidden="true">
                <Icon size={16} />
              </span>
              <span className={styles.Text}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
