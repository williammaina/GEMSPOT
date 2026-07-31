import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { LocationCardStyles as styles } from '@styles';

/**
 * Presentable location block with Google Maps embed (no Mapbox token required).
 */
export function LocationCard({
  name,
  address,
  directions,
  matatu,
  town,
  county,
  latitude,
  longitude,
  compact = false,
}) {
  const title = name || 'Location';
  const queryParts = [name, address, town, county, 'Kenya'].filter(Boolean);
  const mapsQuery = encodeURIComponent(queryParts.join(', '));
  const hasCoords =
    latitude != null &&
    longitude != null &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude));
  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${Number(latitude)},${Number(longitude)}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${mapsQuery}&z=14&output=embed`;
  const openUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${Number(latitude)},${Number(longitude)}`
    : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <section className={compact ? styles.CardCompact : styles.Card} aria-label="Location">
      <header className={styles.Head}>
        <div className={styles.IconWrap} aria-hidden="true">
          <MapPin size={18} />
        </div>
        <div>
          <p className={styles.Eyebrow}>Location</p>
          <h3 className={styles.Title}>{title}</h3>
          {(address || town) && (
            <p className={styles.Address}>
              {[address, town, county].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </header>

      {(directions || matatu) && (
        <p className={styles.Directions}>
          {directions || (matatu ? `Matatu: ${matatu}` : null)}
        </p>
      )}

      <div className={styles.MapWrap}>
        <iframe
          title={`Map of ${title}`}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={styles.MapFrame}
        />
      </div>

      <a className={styles.OpenLink} href={openUrl} target="_blank" rel="noreferrer">
        Open in Maps <ExternalLink size={14} />
      </a>

      {matatu && !directions && (
        <p className={styles.Matatu}>
          <Navigation size={14} /> {matatu}
        </p>
      )}
    </section>
  );
}
